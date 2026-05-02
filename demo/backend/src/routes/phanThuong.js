import crypto from 'crypto';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole, attachUser } from '../middleware/trungGianXacThuc.js';

const router = Router();
const prisma = new PrismaClient();
const NGUONG_CANH_BAO_TON_KHO = 10;

async function guiCanhBaoTonKhoThapChoAdmin(reward, soLuongConLai) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isLocked: false },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: 'LOW_REWARD_STOCK',
      title: 'Cảnh báo tồn kho phần thưởng thấp',
      message: `Phần thưởng "${reward.name}" chỉ còn ${soLuongConLai} (dưới ${NGUONG_CANH_BAO_TON_KHO}).`,
      referenceId: reward.id,
    })),
  });
}

function maNgauNhien(doDai = 8) {
  return crypto.randomBytes(doDai).toString('hex').slice(0, doDai).toUpperCase();
}

/** Mã voucher dạng thực tế: 5 chữ in hoa + 6 số (vd: ABSJD123123) */
function maVoucherNgauNhien() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const buf = crypto.randomBytes(16);
  let s = '';
  for (let i = 0; i < 5; i++) s += letters[buf[i] % letters.length];
  for (let i = 0; i < 6; i++) s += String((buf[i + 5] % 10));
  return s;
}

/** Sinh mã xác nhận + ghi chú nhận thưởng (demo, gần thực tế) theo tên/mô tả phần thưởng */
function chiTietNhanThuong(reward) {
  const chuoi = `${reward.name} ${reward.description || ''}`.toLowerCase();
  const hauTo = maNgauNhien(8);
  if (/cây|trồng|tree|plant|reforest|góp cây/i.test(chuoi)) {
    return {
      code: `ECO-TREE-${hauTo}`,
      note: 'Đã ghi nhận đồng hành trồng cây. Mã dùng đối chiếu khi cập nhật tiến độ (hệ thống demo).',
      loai: 'tree',
    };
  }
  if (/200\.?000|200k|200\s*k/.test(chuoi) || /\b200\b.*voucher/i.test(reward.name)) {
    return {
      code: maVoucherNgauNhien(),
      note:
        'Mã đổi thưởng (voucher): dùng khi thanh toán — nhập mã online hoặc xuất trình mã tại quầy siêu thị / cửa hàng để được giảm 200.000đ, theo điều kiện (demo).',
      loai: 'voucher',
    };
  }
  if (/100\.?000|100k|100\s*k/.test(chuoi) || /\b100\b.*voucher/i.test(reward.name)) {
    return {
      code: maVoucherNgauNhien(),
      note:
        'Mã đổi thưởng (voucher): thanh toán online nhập mã, hoặc đem mã đến quầy siêu thị / cửa hàng để được giảm 100.000đ, theo điều kiện (demo).',
      loai: 'voucher',
    };
  }
  if (/50\.?000|50k|50\s*k/.test(chuoi) || /50\s*\.\s*000/.test(chuoi)) {
    return {
      code: maVoucherNgauNhien(),
      note:
        'Mã đổi thưởng (voucher): cần khi thanh toán — online hoặc tại quầy siêu thị; xuất trình mã để được giảm 50.000đ, theo điều kiện (demo).',
      loai: 'voucher',
    };
  }
  if (/voucher|vocher|vourcher|phiếu|phiếu mua|mua sắm|giảm giá|shopping/i.test(chuoi)) {
    return {
      code: maVoucherNgauNhien(),
      note:
        'Mã đổi thưởng / voucher: dùng khi thanh toán tại đối tác — kể cả siêu thị, luôn cần xuất trình hoặc nhập mã này, theo điều kiện chương trình (demo).',
      loai: 'voucher',
    };
  }
  return {
    code: `ECO-REWARD-${hauTo}`,
    note: 'Giữ mã để xác nhận khi nhận quà hoặc liên hệ hỗ trợ (demo).',
    loai: 'other',
  };
}

function tachLoaiRacTuMoTa(description) {
  const text = String(description || '').trim();
  if (!text) return null;
  // Mẫu hiện có: "Thu gom 2kg - Nhựa"
  const match = text.match(/-\s*(.+)$/);
  if (match?.[1]) return match[1].trim();
  return null;
}

// Customer: Xem điểm + lịch sử tích/sử dụng (phải đặt trước /:id)
router.get('/points', authMiddleware, requireRole('CUSTOMER'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { points: true },
  });
  const transactions = await prisma.pointTransaction.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const earnTransactions = transactions.filter((t) => t.type === 'earn' && t.referenceId);
  const requestIds = [...new Set(earnTransactions.map((t) => t.referenceId).filter(Boolean))];

  const requests = requestIds.length
    ? await prisma.collectionRequest.findMany({
        where: { id: { in: requestIds }, customerId: req.userId },
        select: {
          id: true,
          wasteTypeId: true,
          verifiedTypeId: true,
        },
      })
    : [];

  const wasteTypeIds = [
    ...new Set(
      requests.flatMap((r) => [r.verifiedTypeId, r.wasteTypeId]).filter(Boolean),
    ),
  ];
  const wasteTypes = wasteTypeIds.length
    ? await prisma.wasteType.findMany({
        where: { id: { in: wasteTypeIds } },
        select: { id: true, name: true },
      })
    : [];
  const wasteTypeMap = Object.fromEntries(wasteTypes.map((w) => [w.id, w.name]));
  const requestMap = Object.fromEntries(requests.map((r) => [r.id, r]));

  const transactionsWithWasteType = transactions.map((t) => {
    if (t.type !== 'earn') return t;
    let wasteTypeName = null;
    if (t.referenceId) {
      const reqData = requestMap[t.referenceId];
      if (reqData) {
        wasteTypeName = wasteTypeMap[reqData.verifiedTypeId || reqData.wasteTypeId] || 'Khác';
      }
    }
    if (!wasteTypeName) {
      wasteTypeName = tachLoaiRacTuMoTa(t.description);
    }
    if (!wasteTypeName) return t;
    return { ...t, wasteTypeName };
  });

  const tongTheoLoai = {};
  transactionsWithWasteType.forEach((t) => {
    if (t.type !== 'earn' || !t.wasteTypeName) return;
    tongTheoLoai[t.wasteTypeName] = (tongTheoLoai[t.wasteTypeName] || 0) + (t.amount || 0);
  });
  const earnByWasteType = Object.entries(tongTheoLoai)
    .map(([wasteTypeName, points]) => ({ wasteTypeName, points }))
    .sort((a, b) => b.points - a.points);

  res.json({ points: user.points, transactions: transactionsWithWasteType, earnByWasteType });
});

// Customer: Lịch sử đổi thưởng
router.get('/my-redemptions', authMiddleware, requireRole('CUSTOMER'), async (req, res) => {
  const list = await prisma.rewardRedemption.findMany({
    where: { userId: req.userId },
    include: { reward: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
});

// Xem danh sách phần thưởng (Customer + Guest). ?all=1 cho Admin xem tất cả
router.get('/', async (req, res) => {
  const where = req.query.all === '1' ? {} : { isActive: true };
  const list = await prisma.reward.findMany({
    where,
    orderBy: { pointsCost: 'asc' },
  });
  res.json(list);
});

// Customer: Đổi thưởng (redeemApiVersion=2: có ma, confirmationCode, fulfillmentNote)
router.post('/:id/redeem', authMiddleware, requireRole('CUSTOMER'), attachUser, async (req, res) => {
  const reward = await prisma.reward.findUnique({
    where: { id: req.params.id },
  });
  if (!reward || !reward.isActive) return res.status(404).json({ error: 'Phần thưởng không tồn tại' });
  if (req.user.points < reward.pointsCost) {
    return res.status(400).json({ error: 'Điểm không đủ' });
  }
  if (reward.quantity < 1) return res.status(400).json({ error: 'Đã hết hàng' });
  const soLuongConLaiSauDoi = reward.quantity - 1;

  const { code, note, loai } = chiTietNhanThuong(reward);
  const messageThanhCong =
    loai === 'voucher'
      ? 'Chúc mừng bạn đổi thưởng voucher thành công!'
      : 'Chúc mừng bạn đổi thưởng thành công!';

  await prisma.$transaction([
    prisma.reward.update({
      where: { id: reward.id },
      data: { quantity: { decrement: 1 } },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { points: { decrement: reward.pointsCost } },
    }),
    prisma.pointTransaction.create({
      data: {
        userId: req.userId,
        amount: -reward.pointsCost,
        type: 'redeem',
        description: `Đổi thưởng: ${reward.name}`,
        referenceId: reward.id,
      },
    }),
  ]);
  if (reward.quantity >= NGUONG_CANH_BAO_TON_KHO && soLuongConLaiSauDoi < NGUONG_CANH_BAO_TON_KHO) {
    try {
      await guiCanhBaoTonKhoThapChoAdmin(reward, soLuongConLaiSauDoi);
    } catch (err) {
      console.error('[redeem] Không gửi được cảnh báo tồn kho thấp:', err?.message || err);
    }
  }

  const redemption = await prisma.rewardRedemption.create({
    data: {
      userId: req.userId,
      rewardId: reward.id,
      pointsSpent: reward.pointsCost,
      confirmationCode: code,
      fulfillmentNote: note,
    },
    include: { reward: true },
  });

  const maPhanHoi = String(
    (redemption.confirmationCode && String(redemption.confirmationCode).trim()) || code || '',
  ).trim();
  const ghiChuPhanHoi = redemption.fulfillmentNote ?? note ?? '';
  const maAnToan = maPhanHoi || `ECO-FIX-${Date.now()}`;

  if (!maPhanHoi) {
    console.error('[redeem] Mã trống sau create — dùng mã dự phòng', { rewardId: reward.id, code });
  }

  if (!redemption.confirmationCode?.trim()) {
    try {
      await prisma.rewardRedemption.update({
        where: { id: redemption.id },
        data: { confirmationCode: maAnToan, fulfillmentNote: ghiChuPhanHoi },
      });
    } catch (err) {
      console.error('[redeem] Không cập nhật lại mã vào CSDL:', err?.message || err);
    }
  }

  // Không spread object Prisma (có thể khiến res.json mất trường); trả object thuần + key "ma" cho frontend
  const rewardPlain = redemption.reward
    ? {
        id: redemption.reward.id,
        name: redemption.reward.name,
        description: redemption.reward.description,
        pointsCost: redemption.reward.pointsCost,
        quantity: redemption.reward.quantity,
        imageUrl: redemption.reward.imageUrl,
        isActive: redemption.reward.isActive,
        createdAt: redemption.reward.createdAt,
        updatedAt: redemption.reward.updatedAt,
      }
    : null;

  res.setHeader('X-Redeem-API-Version', '2');
  res.status(200).json({
    redeemApiVersion: 2,
    message: messageThanhCong,
    rewardName: reward.name,
    ma: maAnToan,
    confirmationCode: maAnToan,
    fulfillmentNote: ghiChuPhanHoi,
    redemption: {
      id: redemption.id,
      userId: redemption.userId,
      rewardId: redemption.rewardId,
      pointsSpent: redemption.pointsSpent,
      status: redemption.status,
      confirmationCode: maAnToan,
      fulfillmentNote: ghiChuPhanHoi,
      createdAt: redemption.createdAt,
      reward: rewardPlain,
    },
  });
});

// Admin: CRUD phần thưởng
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, description, pointsCost, quantity } = req.body;
  const reward = await prisma.reward.create({
    data: { name, description, pointsCost: pointsCost || 0, quantity: quantity || 0 },
  });
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true } });
  if (customers.length > 0) {
    await prisma.notification.createMany({
      data: customers.map((c) => ({
        userId: c.id,
        type: 'NEW_REWARD',
        title: 'Phần thưởng mới',
        message: `Phần thưởng mới "${name}" - ${pointsCost || 0} điểm. Vào mục Đổi thưởng để sử dụng điểm tích lũy!`,
        referenceId: reward.id,
      })),
    });
  }
  if ((reward.quantity || 0) < NGUONG_CANH_BAO_TON_KHO) {
    try {
      await guiCanhBaoTonKhoThapChoAdmin(reward, reward.quantity || 0);
    } catch (err) {
      console.error('[reward.create] Không gửi được cảnh báo tồn kho thấp:', err?.message || err);
    }
  }
  res.json(reward);
});

router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, description, pointsCost, quantity, isActive } = req.body;
  const truocKhiCapNhat = await prisma.reward.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, quantity: true },
  });
  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (pointsCost !== undefined) data.pointsCost = pointsCost;
  if (quantity !== undefined) data.quantity = quantity;
  if (isActive !== undefined) data.isActive = isActive;
  const reward = await prisma.reward.update({
    where: { id: req.params.id },
    data,
  });
  if (
    truocKhiCapNhat
    && (truocKhiCapNhat.quantity ?? 0) >= NGUONG_CANH_BAO_TON_KHO
    && (reward.quantity ?? 0) < NGUONG_CANH_BAO_TON_KHO
  ) {
    try {
      await guiCanhBaoTonKhoThapChoAdmin(reward, reward.quantity ?? 0);
    } catch (err) {
      console.error('[reward.update] Không gửi được cảnh báo tồn kho thấp:', err?.message || err);
    }
  }
  res.json(reward);
});

router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  await prisma.reward.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ message: 'Đã vô hiệu hóa' });
});

export default router;
