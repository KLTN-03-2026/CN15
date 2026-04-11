import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import xacThuc from './routes/xacThuc.js';
import nguoiDung from './routes/nguoiDung.js';
import loaiRac from './routes/loaiRac.js';
import yeuCauThuGom from './routes/yeuCauThuGom.js';
import phanThuong from './routes/phanThuong.js';
import troLyAI from './routes/troLyAI.js';
import thongKe from './routes/thongKe.js';
import thongBao from './routes/thongBao.js';
import { authMiddleware, requireRole } from './middleware/trungGianXacThuc.js';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true })); // Cho phép mọi origin khi dev
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Các tuyến API (notifications đăng ký trước vì path /api/notifications có thể bị conflict)
app.use('/api/notifications', thongBao);

app.use('/api/auth', xacThuc);
app.use('/api/users', nguoiDung);
app.use('/api/waste-types', loaiRac);
app.use('/api/collections', yeuCauThuGom);
app.use('/api/rewards', phanThuong);
app.use('/api/ai', troLyAI);
app.use('/api/stats', thongKe);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res, next) => {
  console.warn('[404] Không tìm thấy:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  const msg = err.code === 'P1001' ? 'Không kết nối được database. Kiểm tra PostgreSQL và DATABASE_URL trong .env.'
    : (err.message || 'Lỗi máy chủ');
  res.status(500).json({ error: msg });
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
