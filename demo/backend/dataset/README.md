# Dataset nhận diện loại rác (AI Waste Classification)

## Mục đích

Dataset dùng để huấn luyện/nâng cao độ chính xác của AI nhận diện loại rác từ ảnh.

## Cấu trúc thư mục

```
dataset/
├── README.md           # File này
├── mapping.json        # Ánh xạ danh mục dataset → loại rác trong hệ thống
├── train/              # Ảnh huấn luyện (theo thư mục con = loại)
│   ├── nhua-pet/
│   ├── giay/
│   ├── kim-loai/
│   ├── thuy-tinh/
│   └── nhua-hdpe/
├── val/                # Ảnh kiểm tra
└── scripts/            # Script Python huấn luyện
```

## Dataset công khai có sẵn

### 1. TrashNeXt (IEEE DataPort)
- **Link**: https://ieee-dataport.org/documents/trashnext-dataset
- **Nội dung**: 23,625 ảnh, 9 loại (cardboard, e-waste, foam rubber, glass, medical, metal, organic, paper, plastic)
- **Độ chính xác**: ~95% với ConvNeXt
- **Kích thước**: ~2.96 GB

### 2. Recyclable Waste Classification (GTS.ai)
- **Link**: https://gts.ai/dataset-download/recyclable-and-household-waste-classification/
- **Nội dung**: 15,000 ảnh (256×256), 30 loại (plastic, paper, glass, metal, organic, textiles…)
- **Chất lượng**: Cao, có ảnh studio + thực tế

### 3. Waste Classification (Mendeley)
- **Link**: https://data.mendeley.com/datasets/n3gtgm9jxj/3
- **Nội dung**: 24,705 ảnh, 2 lớp: organic, recyclable
- **Ưu điểm**: Có Jupyter notebook sẵn

### 4. Kaggle - Waste Classification
- **Tìm**: `waste classification` hoặc `recyclable waste`
- Nhiều dataset nhỏ có thể gộp và map theo `mapping.json`

## Ánh xạ loại rác (mapping.json)

File `mapping.json` map tên danh mục trong dataset sang `WasteType` trong database:

| Dataset category | Loại rác hệ thống |
|-----------------|-------------------|
| plastic, PET, bottle | Nhựa PET |
| paper, cardboard | Giấy |
| metal, aluminum | Kim loại |
| glass | Thủy tinh |
| HDPE, hard plastic | Nhựa HDPE |

## Cách sử dụng

### Cách 1: Chạy toàn bộ (khuyến nghị)

**Windows:**
```bash
cd backend/dataset/scripts
chay_full.bat
```

**Linux/Mac:**
```bash
cd backend/dataset/scripts
chmod +x chay_full.sh && ./chay_full.sh
```

Script sẽ: cài thư viện → tải dataset (hoặc tạo mẫu nếu không đủ dung lượng) → huấn luyện model. Model lưu tại `backend/models/waste_classifier.pt`.

### Cách 2: Tải dataset bổ sung (khuyến nghị - ~500MB, chính xác hơn)

```bash
cd backend/dataset/scripts
pip install -r requirements.txt
python tai_dataset_bo_sung.py --limit 150
python train.py
```

Dataset griffinbholt: 38k ảnh, 10 loại (glass, paper, plastic, metal, cardboard, trash...). Map vào 5 loại hệ thống.

### Cách 3: Tải TrashNet (cần ~7GB dung lượng)

```bash
cd backend/dataset/scripts
pip install -r requirements.txt
python tai_dataset.py --limit 200
python train.py
```

### Cách 4: Dữ liệu mẫu (nhanh, test)

```bash
cd backend/dataset/scripts
pip install torch torchvision Pillow
python tao_mau.py    # Tạo 100 ảnh mẫu
python train.py
```

### Bước 1 (thủ công): Tải dataset

Chọn 1 dataset trên, tải về và đặt vào thư mục `train/` theo cấu trúc:

```
train/
  nhua-pet/    → ảnh chai nhựa, hộp nhựa PET
  giay/        → ảnh giấy, bìa carton
  kim-loai/    → ảnh nhôm, sắt, đồng
  thuy-tinh/   → ảnh chai lọ thủy tinh
  nhua-hdpe/   → ảnh hộp sữa, chai nhựa cứng
```

### Bước 2: Chạy script huấn luyện

```bash
cd dataset/scripts
pip install -r requirements.txt
python train.py
```

### Bước 3: Export model

Sau khi train xong, export model (ONNX/Pickle) và đặt vào `backend/models/` để AI backend dùng inference local.

---

**Ghi chú**: Nếu không có dataset tự train, hệ thống sử dụng **OpenAI Vision API** (khi có `OPENAI_API_KEY`) để phân tích ảnh trực tiếp mà không cần dataset.
