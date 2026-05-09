import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/trungGianXacThuc.js';

const router = Router();
const prisma = new PrismaClient();

// Guest/Customer: Xem danh sách loại rác (công khai). Admin: ?all=1 để xem tất cả
router.get('/', async (req, res) => {
  const where = req.query.all === '1' ? {} : { isActive: true };
  const list = await prisma.wasteType.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  res.json(list);
});

// Admin: CRUD loại rác
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, description, pointsPerKg } = req.body;
  const diemTrenKg = pointsPerKg === undefined || pointsPerKg === null || pointsPerKg === ''
    ? 0
    : Number(pointsPerKg);
  if (Number.isNaN(diemTrenKg)) {
    return res.status(400).json({ error: 'pointsPerKg phải là số hợp lệ' });
  }
  const wt = await prisma.wasteType.create({
    data: { name, description: description || null, pointsPerKg: diemTrenKg },
  });
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true } });
  if (customers.length > 0) {
    await prisma.notification.createMany({
      data: customers.map((c) => ({
        userId: c.id,
        type: 'NEW_WASTE_TYPE',
        title: 'Loại rác mới',
        message: `Hệ thống vừa thêm loại rác "${name}" - ${diemTrenKg} điểm/kg. Hãy tạo yêu cầu thu gom để tích điểm!`,
        referenceId: wt.id,
      })),
    });
  }
  res.json(wt);
});

router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const { name, description, pointsPerKg, isActive } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (pointsPerKg !== undefined) {
    const diemTrenKg = Number(pointsPerKg);
    if (Number.isNaN(diemTrenKg)) {
      return res.status(400).json({ error: 'pointsPerKg phải là số hợp lệ' });
    }
    data.pointsPerKg = diemTrenKg;
  }
  if (isActive !== undefined) data.isActive = isActive;
  const wt = await prisma.wasteType.update({
    where: { id: req.params.id },
    data,
  });
  res.json(wt);
});

router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  await prisma.wasteType.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ message: 'Đã vô hiệu hóa' });
});

export default router;
