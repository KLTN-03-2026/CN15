#!/bin/bash
set -e
echo "=== Thiết lập AI nhận diện rác ==="
echo ""
echo "[1/3] Cài đặt thư viện..."
pip install -r requirements.txt -q
echo "[2/3] Tải dataset TrashNet (có thể mất 2-5 phút)..."
python tai_dataset.py --limit 150
echo "[3/3] Huấn luyện model..."
python train.py
echo ""
echo "=== Hoàn thành! Model tại backend/models/waste_classifier.pt ==="
