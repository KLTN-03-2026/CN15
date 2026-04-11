import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole, attachUser } from '../middleware/trungGianXacThuc.js';

const router = Router();
const prisma = new PrismaClient();

// Customer: Xem/cập nhật thông tin cá nhân
router.get('/profile', authMiddleware, attachUser, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, fullName: true, phone: true, address: true, avatar: true,
      points: true, role: true, createdAt: true,
    },
  });
  res.json(user);
});

router.put('/profile', authMiddleware, requireRole('CUSTOMER', 'ADMIN'), async (req, res) => {
  const { fullName, phone, address } = req.body;
  const isAdmin = req.userRole === 'ADMIN';
  const targetId = isAdmin && req.body.userId ? req.body.userId : req.userId;
  if (!isAdmin && targetId !== req.userId) {
    return res.status(403).json({ error: 'Không có quyền' });
  }
  const user = await prisma.user.update({
    where: { id: targetId },
    data: { fullName, phone, address },
    select: { id: true, fullName: true, phone: true, address: true },
  });
  res.json(user);
});

// Đổi mật khẩu
router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.userId },
    data: { password: hashed },
  });
  res.json({ message: 'Đã đổi mật khẩu' });
});

// Admin: Danh sách người dùng
router.get('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, fullName: true, phone: true, role: true,
      isLocked: true, points: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// Admin: Chi tiết user
router.get('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, email: true, fullName: true, phone: true, address: true,
      role: true, isLocked: true, points: true, createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json(user);
});

// Admin: Thêm user
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { email, password, fullName, phone, address, role } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email không được để trống' });
    if (!fullName || !fullName.trim()) return res.status(400).json({ error: 'Họ tên không được để trống' });
    const exists = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (exists) return res.status(400).json({ error: 'Email đã tồn tại' });
    const validRole = ['CUSTOMER', 'STAFF', 'ADMIN'].includes(role) ? role : 'CUSTOMER';
    const hashed = await bcrypt.hash(password?.trim() || '123456', 10);
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashed,
        fullName: (fullName || '').trim() || 'Người dùng',
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        role: validRole,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
    res.json(user);
  } catch (err) {
    console.error('[POST /users]', err);
    res.status(500).json({ error: err.message || 'Lỗi khi thêm tài khoản' });
  }
});

// Admin: Cập nhật user (bao gồm khóa, đổi role)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { fullName, phone, address, role, isLocked } = req.body;
  const data = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (phone !== undefined) data.phone = phone;
  if (address !== undefined) data.address = address;
  if (role !== undefined) data.role = role;
  if (isLocked !== undefined) data.isLocked = isLocked;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, email: true, fullName: true, role: true, isLocked: true },
  });
  res.json(user);
});

// Admin: Xóa user
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'Đã xóa' });
});

export default router;
