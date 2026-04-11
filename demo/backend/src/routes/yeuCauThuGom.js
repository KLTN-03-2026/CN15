import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware, requireRole, attachUser } from '../middleware/trungGianXacThuc.js';
import { prisma } from '../lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Customer: Tạo yêu cầu thu gom
router.post('/', authMiddleware, requireRole('CUSTOMER'), attachUser, upload.single('image'), async (req, res) => {
  try {
    const { wasteTypeId, quantity, address, note, phone, desiredCollectionDate } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const ngayThuGom = desiredCollectionDate ? new Date(desiredCollectionDate) : null;
    if (ngayThuGom && ngayThuGom < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({ error: 'Ngày thu gom không được là ngày trong quá khứ' });
    }
    const reqData = await prisma.collectionRequest.create({
      data: {
        customerId: req.userId,
        wasteTypeId,
        quantity: parseFloat(quantity),
        address,
        note: note || null,
        phone: phone || null,
        desiredCollectionDate: ngayThuGom,
        imageUrl,
      },
      include: {
        wasteType: true,
        customer: { select: { fullName: true, phone: true } },
      },
    });
    await prisma.statusHistory.create({
      data: { requestId: reqData.id, status: 'PENDING', note: 'Yêu cầu mới' },
    });
    // Gửi thông báo cho tất cả nhân viên và admin khi có yêu cầu mới
    try {
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['STAFF', 'ADMIN'] }, isLocked: false },
        select: { id: true },
      });
      const wasteName = reqData.wasteType?.name || 'rác';
      const customerName = reqData.customer?.fullName || 'Khách hàng';
      const ngayStr = reqData.desiredCollectionDate ? new Date(reqData.desiredCollectionDate).toLocaleDateString('vi-VN') : '';
      const msg = ngayStr
        ? `Khách hàng ${customerName} yêu cầu thu gom ${wasteName} - ${reqData.quantity}kg tại ${reqData.address}, ngày: ${ngayStr}.`
        : `Khách hàng ${customerName} yêu cầu thu gom ${wasteName} - ${reqData.quantity}kg tại ${reqData.address}.`;
      await prisma.notification.createMany({
        data: staffUsers.map((u) => ({
          userId: u.id,
          type: 'NEW_COLLECTION_REQUEST',
          title: 'Có yêu cầu thu gom mới',
          message: msg,
          referenceId: reqData.id,
        })),
      });
      console.log('[Notification] Đã gửi thông báo yêu cầu mới cho', staffUsers.length, 'nhân viên');
    } catch (err) {
      console.error('[Notification] Lỗi gửi thông báo nhân viên:', err.message);
    }
    res.json(reqData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const TRANG_THAI_HOP_LE = ['PENDING', 'COLLECTING', 'COMPLETED', 'CANCELLED'];

// Customer: Danh sách yêu cầu của mình (tùy chọn ?status=PENDING|COLLECTING|...)
router.get('/my', authMiddleware, requireRole('CUSTOMER'), async (req, res) => {
  const { status } = req.query;
  const where = { customerId: req.userId };
  if (status && TRANG_THAI_HOP_LE.includes(String(status))) {
    where.status = String(status);
  }
  const list = await prisma.collectionRequest.findMany({
    where,
    include: { wasteType: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
});

// Staff: Danh sách tất cả yêu cầu (hỗ trợ lọc: status, date, address, wasteTypeId)
router.get('/', authMiddleware, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  const { status, date, address, wasteTypeId } = req.query;
  const where = status ? { status } : {};
  if (date) {
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    where.desiredCollectionDate = { gte: start, lte: end };
  }
  if (address?.trim()) {
    where.address = { contains: address.trim(), mode: 'insensitive' };
  }
  if (wasteTypeId?.trim()) {
    where.wasteTypeId = wasteTypeId.trim();
  }
  const list = await prisma.collectionRequest.findMany({
    where,
    include: {
      wasteType: true,
      customer: { select: { fullName: true, phone: true, address: true } },
      staff: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
});

// Chi tiết yêu cầu
router.get('/:id', authMiddleware, async (req, res) => {
  const reqData = await prisma.collectionRequest.findUnique({
    where: { id: req.params.id },
    include: {
      wasteType: true,
      customer: { select: { fullName: true, phone: true, address: true, email: true } },
      staff: { select: { fullName: true, phone: true } },
      statusHistory: true,
    },
  });
  if (!reqData) return res.status(404).json({ error: 'Không tìm thấy' });
  if (req.userRole === 'CUSTOMER' && reqData.customerId !== req.userId) {
    return res.status(403).json({ error: 'Không có quyền' });
  }
  res.json(reqData);
});

// Customer: Hủy yêu cầu (chỉ khi PENDING)
router.put('/:id/cancel', authMiddleware, requireRole('CUSTOMER'), async (req, res) => {
  const r = await prisma.collectionRequest.findUnique({ where: { id: req.params.id } });
  if (!r || r.customerId !== req.userId) return res.status(404).json({ error: 'Không tìm thấy' });
  if (r.status !== 'PENDING') return res.status(400).json({ error: 'Chỉ hủy được khi chưa xử lý' });
  await prisma.collectionRequest.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });
  await prisma.statusHistory.create({
    data: { requestId: req.params.id, status: 'CANCELLED', note: 'Khách hàng hủy' },
  });
  res.json({ message: 'Đã hủy' });
});

// Staff/Admin: Nhận yêu cầu (PENDING -> COLLECTING) → gửi thông báo cho khách hàng
router.put('/:id/accept', authMiddleware, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  const r = await prisma.collectionRequest.findUnique({
    where: { id: req.params.id },
    include: { wasteType: true },
  });
  if (!r || r.status !== 'PENDING') return res.status(400).json({ error: 'Không thể nhận' });
  await prisma.collectionRequest.update({
    where: { id: req.params.id },
    data: { status: 'COLLECTING', staffId: req.userId },
  });
  await prisma.statusHistory.create({
    data: { requestId: req.params.id, status: 'COLLECTING', note: 'Nhân viên nhận xử lý' },
  });

  try {
    await prisma.notification.create({
      data: {
        userId: r.customerId,
        type: 'REQUEST_ACCEPTED',
        title: 'Yêu cầu thu gom đã được duyệt',
        message: `Yêu cầu thu gom ${r.wasteType?.name || 'rác'} - ${r.quantity}kg tại ${r.address} đã được nhân viên nhận xử lý. Nhân viên sẽ tới thu gom theo lịch.`,
        referenceId: req.params.id,
      },
    });
    console.log('[Notification] Đã gửi thông báo cho khách hàng:', r.customerId);
  } catch (err) {
    console.error('[Notification] Lỗi khi tạo thông báo:', err.message);
  }

  res.json({ message: 'Đã nhận yêu cầu' });
});

// Staff/Admin: Cập nhật trạng thái + xác minh (COLLECTING -> COMPLETED) → gửi thông báo cho khách hàng
router.put('/:id/complete', authMiddleware, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  const { verifiedWeight, verifiedTypeId } = req.body;
  const r = await prisma.collectionRequest.findUnique({
    where: { id: req.params.id },
    include: { wasteType: true },
  });
  if (!r || r.status !== 'COLLECTING' || r.staffId !== req.userId) {
    return res.status(400).json({ error: 'Không thể hoàn thành' });
  }
  const wtId = verifiedTypeId || r.wasteTypeId;
  const weight = verifiedWeight ?? r.quantity;
  const wasteType = await prisma.wasteType.findUnique({ where: { id: wtId } });
  const pointsEarned = Math.floor((wasteType?.pointsPerKg || 0) * weight);

  await prisma.$transaction([
    prisma.collectionRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        verifiedWeight: weight,
        verifiedTypeId: wtId,
        pointsEarned,
        completedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: r.customerId },
      data: { points: { increment: pointsEarned } },
    }),
    prisma.pointTransaction.create({
      data: {
        userId: r.customerId,
        amount: pointsEarned,
        type: 'earn',
        description: `Thu gom ${weight}kg - ${wasteType?.name}`,
        referenceId: req.params.id,
      },
    }),
  ]);

  await prisma.statusHistory.create({
    data: { requestId: req.params.id, status: 'COMPLETED', note: `Xác minh ${weight}kg, +${pointsEarned} điểm` },
  });

  try {
    await prisma.notification.create({
      data: {
        userId: r.customerId,
        type: 'REQUEST_COMPLETED',
        title: 'Yêu cầu thu gom đã hoàn thành',
        message: `Yêu cầu thu gom đã hoàn thành. Bạn nhận được ${pointsEarned} điểm tích lũy.`,
        referenceId: req.params.id,
      },
    });
    console.log('[Notification] Đã gửi thông báo hoàn thành cho khách hàng:', r.customerId);
  } catch (err) {
    console.error('[Notification] Lỗi khi tạo thông báo:', err.message);
  }

  res.json({ message: 'Đã hoàn thành', pointsEarned });
});

export default router;
