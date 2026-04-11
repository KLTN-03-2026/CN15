import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, attachUser } from '../middleware/trungGianXacThuc.js';

const router = Router();

function tinhStartDate(period, now = new Date()) {
  const startDate = new Date(now);
  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else {
    startDate.setMonth(startDate.getMonth() - 1);
  }
  return startDate;
}

/** @param {string | null} customerId — null = toàn hệ thống (staff/admin) */
async function layBaoCaoThongKe(period, customerId) {
  const now = new Date();
  const startDate = tinhStartDate(period, now);
  const base = customerId ? { customerId } : {};

  const [totalRequests, completedRequests, byStatus, byWasteType] = await Promise.all([
    prisma.collectionRequest.count({ where: { ...base, createdAt: { gte: startDate } } }),
    prisma.collectionRequest.count({
      where: { ...base, status: 'COMPLETED', completedAt: { gte: startDate } },
    }),
    prisma.collectionRequest.groupBy({
      by: ['status'],
      where: { ...base, createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.collectionRequest.groupBy({
      by: ['wasteTypeId'],
      where: { ...base, status: 'COMPLETED', completedAt: { gte: startDate } },
      _sum: { verifiedWeight: true, quantity: true },
      _count: true,
    }),
  ]);

  const wasteTypeIds = [...new Set(byWasteType.map((b) => b.wasteTypeId))];
  const wasteTypes = await prisma.wasteType.findMany({
    where: { id: { in: wasteTypeIds } },
  });
  const wasteMap = Object.fromEntries(wasteTypes.map((wt) => [wt.id, wt]));

  const byWasteTypeDetail = byWasteType.map((b) => ({
    wasteType: wasteMap[b.wasteTypeId]?.name || 'Khác',
    count: b._count,
    totalWeight: (b._sum.verifiedWeight ?? b._sum.quantity ?? 0),
  }));

  const totalWeight = (await prisma.collectionRequest.aggregate({
    where: { ...base, status: 'COMPLETED', completedAt: { gte: startDate } },
    _sum: { verifiedWeight: true },
  }))._sum.verifiedWeight ?? 0;

  return {
    period: period || 'month',
    startDate,
    totalRequests,
    completedRequests,
    totalWeight,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    byWasteType: byWasteTypeDetail,
  };
}

/** Chuẩn hóa role từ DB (tránh khoảng trắng / ký tự ẩn khiến so sánh thất bại) */
function layVaiTroTuDb(req) {
  return String(req.user?.role ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toUpperCase();
}

function laNhanVienHoacQuanTri(role) {
  return role === 'STAFF' || role === 'ADMIN';
}

// STAFF/ADMIN: thống kê toàn hệ thống. Còn lại (CUSTOMER hoặc role lệch/rỗng): chỉ của chính họ — không trả 403.
router.get('/', authMiddleware, attachUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  const role = layVaiTroTuDb(req);
  if (laNhanVienHoacQuanTri(role)) {
    const data = await layBaoCaoThongKe(req.query.period, null);
    return res.json(data);
  }
  const data = await layBaoCaoThongKe(req.query.period, req.user.id);
  return res.json(data);
});

router.get('/me', authMiddleware, attachUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  const data = await layBaoCaoThongKe(req.query.period, req.user.id);
  res.json(data);
});

export default router;
