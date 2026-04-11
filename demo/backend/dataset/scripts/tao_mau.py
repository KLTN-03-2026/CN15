#!/usr/bin/env python3
"""
Tao dataset mau (placeholder) de test train.py khi khong co dung luong tai TrashNet.
Chay: python tao_mau.py
Moi loai 20 anh mau (tong ~100 anh). Kich thuoc 224x224, co texture de xem duoc ro.
"""

from pathlib import Path
from PIL import Image
import random

DATASET_DIR = Path(__file__).resolve().parent.parent / "train"
FOLDERS = ["nhua-pet", "giay", "kim-loai", "thuy-tinh", "nhua-hdpe"]
# Mau sac khac nhau cho tung loai (de model phan biet de dang khi test)
COLORS = {
    "nhua-pet": (100, 180, 255),   # Xanh nhat
    "giay": (255, 200, 100),       # Vang
    "kim-loai": (150, 150, 150),  # Xam
    "thuy-tinh": (100, 255, 200), # Xanh la
    "nhua-hdpe": (255, 120, 180), # Hong
}
# Kich thuoc anh (224x224 de xem ro, phu hop train)
IMG_SIZE = 224

def main():
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    n = 0
    for folder in FOLDERS:
        (DATASET_DIR / folder).mkdir(exist_ok=True)
        base_color = COLORS.get(folder, (128, 128, 128))
        for i in range(20):
            img = Image.new("RGB", (IMG_SIZE, IMG_SIZE), base_color)
            # Them texture/vet de anh khong con la o mau phang, de xem hon
            for _ in range(IMG_SIZE * IMG_SIZE // 8):  # ~6000 diem cho 224x224
                x, y = random.randint(0, IMG_SIZE - 1), random.randint(0, IMG_SIZE - 1)
                delta = random.randint(-40, 40)
                new_color = tuple(max(0, min(255, c + delta)) for c in base_color)
                img.putpixel((x, y), new_color)
            # Vong tron mau toi hon o giua (mo phong vat the)
            cx, cy = IMG_SIZE // 2, IMG_SIZE // 2
            for dy in range(-60, 61):
                for dx in range(-60, 61):
                    if dx * dx + dy * dy < 2500 and 0 <= cx + dx < IMG_SIZE and 0 <= cy + dy < IMG_SIZE:
                        darker = tuple(max(0, c - 25) for c in base_color)
                        img.putpixel((cx + dx, cy + dy), darker)
            out = DATASET_DIR / folder / f"sample_{i:02d}.jpg"
            img.save(out, "JPEG", quality=90)
            n += 1
    print("Da tao", n, "anh mau tai", DATASET_DIR)
    print("Kich thuoc:", IMG_SIZE, "x", IMG_SIZE, "- co the xem bang ung dung anh.")
    print("Chay: python train.py de huan luyen.")

if __name__ == "__main__":
    main()
