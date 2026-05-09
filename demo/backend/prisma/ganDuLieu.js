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

  /** Lượt đổi thưởng mẫu — để sheet “Chi tiết phần thưởng đã đổi” / thống kê có dữ liệu khi chưa đổi qua UI */
  const soDoiHienCo = await prisma.rewardRedemption.count();
  if (soDoiHienCo === 0) {
    const matKhauKhach = await bcrypt.hash('customer123', 10);
    const khach = await prisma.user.upsert({
      where: { email: 'customer@recycling.vn' },
      update: {},
      create: {
        email: 'customer@recycling.vn',
        password: matKhauKhach,
        fullName: 'Khách hàng demo',
        role: 'CUSTOMER',
        points: 5000,
      },
    });
    const thuong = await prisma.reward.findFirst({ where: { name: 'Phiếu mua sắm 50k' } })
      ?? await prisma.reward.findFirst({ orderBy: { pointsCost: 'asc' } });
    if (thuong) {
      const homNay = new Date();
      const ngay = (soNgayTruoc) => {
        const x = new Date(homNay);
        x.setDate(x.getDate() - soNgayTruoc);
        x.setHours(10, 30, 0, 0);
        return x;
      };
      await prisma.rewardRedemption.createMany({
        data: [
          {
            userId: khach.id,
            rewardId: thuong.id,
            pointsSpent: thuong.pointsCost,
            status: 'completed',
            confirmationCode: 'SEED-DEMO-1',
            fulfillmentNote: 'Dữ liệu mẫu (chạy prisma:seed)',
            createdAt: ngay(0),
          },
          {
            userId: khach.id,
            rewardId: thuong.id,
            pointsSpent: thuong.pointsCost,
            status: 'completed',
            confirmationCode: 'SEED-DEMO-2',
            fulfillmentNote: 'Dữ liệu mẫu (chạy prisma:seed)',
            createdAt: ngay(3),
          },
          {
            userId: khach.id,
            rewardId: thuong.id,
            pointsSpent: thuong.pointsCost,
            status: 'completed',
            confirmationCode: 'SEED-DEMO-3',
            fulfillmentNote: 'Dữ liệu mẫu (chạy prisma:seed)',
            createdAt: ngay(12),
          },
        ],
      });
      console.log('Đã thêm 3 lượt đổi thưởng mẫu (customer@recycling.vn / customer123).');
    }
  }

  console.log('Đã gán dữ liệu! Admin: admin@recycling.vn / admin123 | Staff: staff@recycling.vn / staff123 | Khách: customer@recycling.vn / customer123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
