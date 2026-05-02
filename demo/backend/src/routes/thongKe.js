import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, attachUser } from '../middleware/trungGianXacThuc.js';

const router = Router();

function tinhStartDate(period, now = new Date()) {
  if (period === 'all') {
    return new Date(0);
  }
  const startDate = new Date(now);
  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);
  }
  return startDate;
}

function dauNgay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function cuoiNgay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseLocalDateYMD(value) {
  if (!value || typeof value !== 'string') return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(y, month - 1, day);
  if (
    Number.isNaN(d.getTime())
    || d.getFullYear() !== y
    || d.getMonth() !== month - 1
    || d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function taoKhoangThoiGian(query) {
  const now = new Date();
  const homNayDauNgay = dauNgay(now);
  const homNayCuoiNgay = cuoiNgay(now);
  const periodRaw = typeof query.period === 'string' ? query.period.trim() : '';
  const period = periodRaw || 'month';
  const fromDateText = typeof query.fromDate === 'string' ? query.fromDate.trim() : '';
  const toDateText = typeof query.toDate === 'string' ? query.toDate.trim() : '';
  const fromDateRaw = parseLocalDateYMD(fromDateText);
  const toDateRaw = parseLocalDateYMD(toDateText);

  if (fromDateText || toDateText) {
    if (!fromDateText || !toDateText) {
      throw new Error('Vui lòng chọn đầy đủ Từ ngày và Đến ngày');
    }
    if (!fromDateRaw || !toDateRaw || Number.isNaN(fromDateRaw.getTime()) || Number.isNaN(toDateRaw.getTime())) {
      throw new Error('Khoảng ngày không hợp lệ');
    }
    const startDate = dauNgay(fromDateRaw);
    const endDate = cuoiNgay(toDateRaw);
    if (startDate > endDate) {
      throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
    }
    if (startDate >= homNayDauNgay) {
      throw new Error('Từ ngày không được chọn hôm nay');
    }
    if (endDate > homNayCuoiNgay) {
      throw new Error('Đến ngày không được vượt quá hôm nay');
    }
    const maxEndDate = new Date(startDate);
    maxEndDate.setMonth(maxEndDate.getMonth() + 6);
    if (endDate > maxEndDate) {
      throw new Error('Khoảng thời gian tối đa là 6 tháng');
    }
    return { period: 'custom', startDate, endDate };
  }

  return {
    period,
    startDate: tinhStartDate(period, now),
    endDate: now,
  };
}

/** @param {string | null} customerId — null = toàn hệ thống (staff/admin) */
async function layBaoCaoThongKe(period, customerId) {
  const startDate = period.startDate;
  const endDate = period.endDate;
  const base = customerId ? { customerId } : {};
  const basePoint = customerId ? { userId: customerId } : {};
  const khoangTaoYeuCau = { gte: startDate, lte: endDate };

  const [totalRequests, completedRequests, byStatus, byWasteType, earnedAgg, byRewardRedemption] = await Promise.all([
    prisma.collectionRequest.count({ where: { ...base, createdAt: khoangTaoYeuCau } }),
    prisma.collectionRequest.count({
      // Đồng bộ logic theo thời điểm tạo yêu cầu để kết quả lọc nhất quán giữa các chỉ số.
      where: { ...base, status: 'COMPLETED', createdAt: khoangTaoYeuCau },
    }),
    prisma.collectionRequest.groupBy({
      by: ['status'],
      where: { ...base, createdAt: khoangTaoYeuCau },
      _count: true,
    }),
    prisma.collectionRequest.groupBy({
      by: ['wasteTypeId'],
      where: { ...base, status: 'COMPLETED', createdAt: khoangTaoYeuCau },
      _sum: { verifiedWeight: true, quantity: true },
      _count: true,
    }),
    prisma.pointTransaction.aggregate({
      where: { ...basePoint, type: 'earn', createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.rewardRedemption.findMany({
      where: {
        ...(customerId ? { userId: customerId } : {}),
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        rewardId: true,
        userId: true,
        pointsSpent: true,
      },
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
    where: { ...base, status: 'COMPLETED', createdAt: khoangTaoYeuCau },
    _sum: { verifiedWeight: true },
  }))._sum.verifiedWeight ?? 0;
  const totalPointsEarned = earnedAgg._sum.amount ?? 0;
  const rewardIds = [...new Set(byRewardRedemption.map((r) => r.rewardId).filter(Boolean))];
  const rewards = rewardIds.length > 0
    ? await prisma.reward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true, name: true },
    })
    : [];
  const rewardMap = Object.fromEntries(rewards.map((r) => [r.id, r.name]));
  const aggByReward = new Map();
  byRewardRedemption.forEach((item) => {
    const key = item.rewardId || 'unknown';
    const hienTai = aggByReward.get(key) || {
      rewardId: item.rewardId,
      rewardName: rewardMap[item.rewardId] || 'Phần thưởng khác',
      redemptionCount: 0,
      totalPointsSpent: 0,
      customerIds: new Set(),
    };
    hienTai.redemptionCount += 1;
    hienTai.totalPointsSpent += Math.abs(Number(item.pointsSpent) || 0);
    if (item.userId) hienTai.customerIds.add(item.userId);
    aggByReward.set(key, hienTai);
  });
  const byRewardType = Array.from(aggByReward.values())
    .map((item) => ({
      rewardId: item.rewardId,
      rewardName: item.rewardName,
      redemptionCount: item.redemptionCount,
      totalPointsSpent: item.totalPointsSpent,
      customerCount: item.customerIds.size,
    }))
    .sort((a, b) => b.redemptionCount - a.redemptionCount);
  const totalPointsUsed = byRewardRedemption.reduce(
    (tong, item) => tong + Math.abs(Number(item.pointsSpent) || 0),
    0,
  );

  return {
    period: period.period || 'month',
    startDate,
    endDate,
    totalRequests,
    completedRequests,
    totalWeight,
    totalPointsEarned,
    totalPointsUsed,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    byWasteType: byWasteTypeDetail,
    byRewardType,
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
  let period;
  try {
    period = taoKhoangThoiGian(req.query);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Khoảng thời gian không hợp lệ' });
  }
  const role = layVaiTroTuDb(req);
  if (laNhanVienHoacQuanTri(role)) {
    const data = await layBaoCaoThongKe(period, null);
    return res.json(data);
  }
  const data = await layBaoCaoThongKe(period, req.user.id);
  return res.json(data);
});

router.get('/me', authMiddleware, attachUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  let period;
  try {
    period = taoKhoangThoiGian(req.query);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Khoảng thời gian không hợp lệ' });
  }
  const data = await layBaoCaoThongKe(period, req.user.id);
  res.json(data);
});

export default router;
