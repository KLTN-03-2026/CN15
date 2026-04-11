import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DU_DOAN_SCRIPT = path.join(__dirname, '../../dataset/scripts/du_doan.py');
const MODEL_PATH = path.join(__dirname, '../../models/waste_classifier.pt');
const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    cb(null, `ai-${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

/** Map tên AI trả về (có thể khác chút) sang WasteType chính xác */
function mapToWasteType(aiName, wasteTypes) {
  const normalized = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const aiNorm = normalized(aiName);
  for (const wt of wasteTypes) {
    if (normalized(wt.name).includes(aiNorm) || aiNorm.includes(normalized(wt.name))) return wt;
  }
  // Fallback: tìm từ khóa (bao gồm tên thư mục dataset: nhua-pet, giay...)
  const keywords = {
    'nhựa pet': ['pet', 'chai nhựa', 'nhua pet', 'nhua-pet', 'plastic'],
    'giấy': ['giay', 'paper', 'cardboard', 'bìa'],
    'kim loại': ['kim loai', 'kim-loai', 'metal', 'nhôm', 'sắt', 'đồng'],
    'thủy tinh': ['thuy tinh', 'thuy-tinh', 'glass'],
    'nhựa hdpe': ['hdpe', 'nhua-hdpe', 'hộp sữa', 'chai cứng'],
  };
  for (const [name, kws] of Object.entries(keywords)) {
    if (kws.some((k) => aiNorm.includes(k))) {
      return wasteTypes.find((wt) => normalized(wt.name).includes(normalized(name)));
    }
  }
  return null;
}

/** Phân tích ảnh bằng OpenAI Vision - mô tả chi tiết loại rác trong ảnh */
async function phanTichBangOpenAI(filePath, wasteTypes) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const mime = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

  const wasteList = wasteTypes.map((w) => w.name).join(', ');
  const prompt = `Bạn là chuyên gia phân loại rác tái chế. Phân tích ảnh và:

1. MÔ TẢ CHI TIẾT: Nói rõ trong ảnh có những loại rác gì (VD: "Chai nhựa PET, 2 chai nước suối 500ml, 1 túi nilon").
2. PHÂN LOẠI: Chọn ĐÚNG MỘT loại rác phù hợp nhất từ danh sách: ${wasteList}
3. ƯỚC LƯỢNG: Khối lượng ước tính (kg), số thập phân.

Trả về ĐÚNG định dạng JSON sau (không thêm text khác):
{"moTa":"mô tả chi tiết bằng tiếng Việt","loaiRac":"tên loại rác chọn từ danh sách","khoiLuongKg": số}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mime};base64,${base64}` },
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) return null;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return parsed;
  } catch {
    return null;
  }
}

/** Phân tích bằng model local (đã train từ dataset) */
function phanTichBangModelLocal(filePath, wasteTypes) {
  return new Promise((resolve) => {
    if (!fs.existsSync(DU_DOAN_SCRIPT) || !fs.existsSync(MODEL_PATH)) return resolve(null);
    const py = spawn('python', [DU_DOAN_SCRIPT, filePath], { cwd: path.dirname(DU_DOAN_SCRIPT) });
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (d) => { stdout += d; });
    py.stderr.on('data', (d) => { stderr += d; });
    py.on('close', () => {
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.error) return resolve(null);
        const matched = mapToWasteType(parsed.loaiRac || '', wasteTypes);
        if (matched) {
          const conf = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;
          resolve({
            loaiRac: matched.name,
            khoiLuongKg: 2.5,
            confidence: conf,
            moTa: `Model phân loại: ${matched.name} (độ tin cậy ${Math.round(conf * 100)}%)`,
          });
        } else resolve(null);
      } catch {
        resolve(null);
      }
    });
  });
}

/**
 * AI nhận diện loại rác từ ảnh
 * 1. Có OPENAI_API_KEY: dùng GPT Vision phân tích chính xác
 * 2. Có model local (đã train): dùng model
 * 3. Fallback: gợi ý theo thứ tự
 */
router.post('/analyze-waste', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng tải ảnh lên' });
    }

    const wasteTypes = await prisma.wasteType.findMany({
      where: { isActive: true },
      orderBy: { pointsPerKg: 'asc' },
    });

    let suggestedWasteTypeId = null;
    let suggestedWasteTypeName = null;
    let suggestedQuantity = 2.5;
    let moTaChiTiet = '';
    let suggestions = [];

    if (process.env.OPENAI_API_KEY && wasteTypes.length > 0) {
      try {
        const aiResult = await phanTichBangOpenAI(req.file.path, wasteTypes);
        if (aiResult) {
          moTaChiTiet = aiResult.moTa || aiResult.mo_ta || '';
          const matched = mapToWasteType(aiResult.loaiRac || aiResult.loai_rac || '', wasteTypes);
          if (matched) {
            suggestedWasteTypeId = matched.id;
            suggestedWasteTypeName = matched.name;
            suggestedQuantity = Number(aiResult.khoiLuongKg ?? aiResult.khoi_luong_kg ?? 2.5) || 2.5;
            suggestions = [{ id: matched.id, name: matched.name, confidence: 0.9 }];
          }
        }
      } catch (e) {
        console.warn('OpenAI Vision error:', e.message);
      }
    }

    if (!suggestedWasteTypeId && wasteTypes.length > 0) {
      const localResult = await phanTichBangModelLocal(req.file.path, wasteTypes);
      if (localResult) {
        moTaChiTiet = localResult.moTa || '';
        const matched = mapToWasteType(localResult.loaiRac || '', wasteTypes);
        if (matched) {
          suggestedWasteTypeId = matched.id;
          suggestedWasteTypeName = matched.name;
          suggestedQuantity = localResult.khoiLuongKg ?? 2.5;
          const conf = localResult.confidence ?? 0.85;
          suggestions = [{ id: matched.id, name: matched.name, confidence: conf }];
        }
      }
    }

    if (!suggestedWasteTypeId && wasteTypes.length > 0) {
      suggestedWasteTypeId = wasteTypes[0].id;
      suggestedWasteTypeName = wasteTypes[0].name;
      suggestions = wasteTypes.slice(0, 3).map((w, i) => ({
        id: w.id,
        name: w.name,
        confidence: 0.9 - i * 0.1,
      }));
    }

    res.json({
      suggestedWasteTypeId,
      suggestedWasteTypeName,
      suggestedQuantity,
      moTaChiTiet: moTaChiTiet || 'Kết quả phân tích. Có thể nhập thủ công.',
      suggestions,
      imageUrl: `/uploads/${req.file.filename}`,
      note: process.env.OPENAI_API_KEY
        ? 'AI đã phân tích ảnh.'
        : fs.existsSync(MODEL_PATH)
          ? 'Đã dùng model local (từ dataset).'
          : 'Chạy dataset/scripts/tao_mau.py và train.py để có model local.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
