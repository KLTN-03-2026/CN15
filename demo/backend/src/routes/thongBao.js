import { Router } from 'express';
import { authMiddleware } from '../middleware/trungGianXacThuc.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Mọi user đã đăng nhập: Số thông báo chưa đọc (CUSTOMER, STAFF, ADMIN)
router.get('/unread-count', authMiddleware, async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.userId, isRead: false },
  });
  res.json({ count });
});

// Mọi user đã đăng nhập: Lấy danh sách thông báo
router.get('/', authMiddleware, async (req, res) => {
  const list = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  console.log('[Notifications] GET list for userId:', req.userId, 'count:', list.length);
  res.json(list);
});

// Đánh dấu tất cả đã đọc (phải đặt trước /:id)
router.put('/read-all', authMiddleware, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: 'Đã đọc tất cả' });
});

// Đánh dấu một thông báo đã đọc
router.put('/:id/read', authMiddleware, async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { isRead: true },
  });
  res.json({ message: 'Đã đọc' });
});

export default router;
