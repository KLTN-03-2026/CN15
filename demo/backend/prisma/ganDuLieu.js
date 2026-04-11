import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@recycling.vn' },
    update: {},
    create: {
      email: 'admin@recycling.vn',
      password: adminPassword,
      fullName: 'Quản trị viên',
      role: 'ADMIN',
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { email: 'staff@recycling.vn' },
    update: {},
    create: {
      email: 'staff@recycling.vn',
      password: staffPassword,
      fullName: 'Nhân viên Thu gom',
      role: 'STAFF',
    },
  });

  const wasteTypes = [
    { name: 'Nhựa PET', description: 'Chai nhựa, hộp nhựa', pointsPerKg: 5 },
    { name: 'Giấy', description: 'Giấy báo, bìa carton', pointsPerKg: 3 },
    { name: 'Kim loại', description: 'Nhôm, sắt, đồng', pointsPerKg: 8 },
    { name: 'Thủy tinh', description: 'Chai lọ thủy tinh', pointsPerKg: 4 },
    { name: 'Nhựa HDPE', description: 'Hộp sữa, chai nhựa cứng', pointsPerKg: 5 },
  ];

  for (const wt of wasteTypes) {
    const existing = await prisma.wasteType.findFirst({ where: { name: wt.name } });
    if (!existing) {
      await prisma.wasteType.create({ data: wt });
    }
  }

  const rewards = [
    { name: 'Phiếu mua sắm 50k', description: 'Đổi tại siêu thị', pointsCost: 100, quantity: 100 },
    { name: 'Phiếu mua sắm 100k', description: 'Đổi tại siêu thị', pointsCost: 180, quantity: 50 },
    { name: 'Bình nước inox', description: 'Bình giữ nhiệt 500ml', pointsCost: 500, quantity: 20 },
  ];

  for (const r of rewards) {
    const existing = await prisma.reward.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.reward.create({ data: r });
    }
  }

  console.log('Đã gán dữ liệu! Admin: admin@recycling.vn / admin123 | Staff: staff@recycling.vn / staff123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
