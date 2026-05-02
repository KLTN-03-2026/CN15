import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole, attachUser } from '../middleware/trungGianXacThuc.js';

const router = Router();
const prisma = new PrismaClient();

const TOKEN_EXPIRY_HOURS = 1;

// Đăng ký (Guest)
router.post('/register', async (req, res) => {
  const { email, password, fullName, phone, address } = req.body || {};
  const e = (email || '').trim();
  const p = (password || '').trim();
  const fn = (fullName || '').trim();

  if (!e) return res.status(400).json({ error: 'Email không được để trống' });
  if (!fn) return res.status(400).json({ error: 'Họ tên không được để trống' });
  if (p.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });

  const exists = await prisma.user.findUnique({ where: { email: e } });
  if (exists) return res.status(400).json({ error: 'Gmail đã tồn tại, vui lòng nhập lại' });

  const hashed = await bcrypt.hash(p, 10);
  const user = await prisma.user.create({
    data: {
      email: e,
      password: hashed,
      fullName: fn,
      phone: (phone || '').trim() || null,
      address: (address || '').trim() || null,
      role: 'CUSTOMER',
    },
    select: { id: true, email: true, fullName: true, role: true },
  });
  // Thông báo cho admin khi có tài khoản mới đăng ký
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isLocked: false },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'NEW_USER_REGISTERED',
          title: 'Người dùng mới đăng ký',
          message: `Người dùng "${user.fullName}" (${user.email}) vừa tạo tài khoản mới.`,
          referenceId: user.id,
        })),
      });
    }
  } catch (err) {
    console.error('[register] Không gửi được thông báo admin:', err?.message || err);
  }
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
  res.json({ user, token });
});

// Đăng nhập (Guest / Staff / Admin)
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const e = (email || '').trim();
  const p = (password || '').trim();

  if (!e || !p) return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });

  const user = await prisma.user.findUnique({ where: { email: e } });
  if (!user) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
  if (user.isLocked) {
    return res.status(403).json({
      code: 'ACCOUNT_LOCKED',
      error: 'Tài khoản đã bị khóa. Vui lòng liên hệ nhân viên để được hỗ trợ.',
    });
  }

  const match = await bcrypt.compare(p, user.password);
  if (!match) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

  const secret = process.env.JWT_SECRET || 'fallback-secret';
  if (secret === 'fallback-secret') console.warn('[AUTH] Đang dùng JWT_SECRET mặc định - thêm vào .env để bảo mật');
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      points: user.points,
    },
    token,
  });
});

// Lấy thông tin user hiện tại
router.get('/me', authMiddleware, attachUser, (req, res) => {
  res.json(req.user);
});

// Quên mật khẩu - gửi yêu cầu (tạo token reset)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, origin } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng nhập email' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });
    const frontendUrl = (origin && /^https?:\/\//.test(origin)) ? origin.replace(/\/$/, '') : (process.env.FRONTEND_URL || 'http://localhost:5173');
    const resetLink = `${frontendUrl}/dat-lai-mat-khau?token=${token}`;
    res.json({ message: 'Đã tạo link đặt lại mật khẩu.', resetLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đặt lại mật khẩu với token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Thiếu token hoặc mật khẩu mới' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!reset || reset.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Link đã hết hạn. Vui lòng gửi yêu cầu mới.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
      prisma.passwordReset.delete({ where: { id: reset.id } }),
    ]);
    res.json({ message: 'Đặt mật khẩu mới thành công. Bạn có thể đăng nhập.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
