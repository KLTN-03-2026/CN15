import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

/** Chuẩn hóa role để so sánh (JWT/DB có thể khác kiểu hoặc chữ hoa/thường) */
function chuanHoaVaiTro(role) {
  if (role == null || role === '') return null;
  return String(role).replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toUpperCase();
}

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId ?? decoded.id ?? decoded.sub;
    if (!req.userId) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }
    // Luôn lấy vai trò từ DB — tránh JWT thiếu/sai role khiến requireRole trả 403 dù đăng nhập đúng
    try {
      const u = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true },
      });
      if (!u) {
        return res.status(401).json({ error: 'Tài khoản không tồn tại' });
      }
      req.userRole = chuanHoaVaiTro(u.role);
    } catch (e) {
      return next(e);
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
  }
}

export function requireRole(...roles) {
  const choPhep = roles.map((r) => chuanHoaVaiTro(r));
  return (req, res, next) => {
    const role = chuanHoaVaiTro(req.userRole);
    if (role && choPhep.includes(role)) return next();
    return res.status(403).json({ error: 'Không có quyền thực hiện' });
  };
}

export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, fullName: true, role: true, isLocked: true, points: true },
    });
    if (!user || user.isLocked) {
      return res.status(401).json({ error: 'Tài khoản bị khóa' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
