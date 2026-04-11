#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tai dataset TrashNet tu Hugging Face va sap xep theo cau truc loai rac.
Cai dat: pip install datasets Pillow
Chay: python tai_dataset.py [--limit N]
"""

import argparse
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent.parent / "train"
# TrashNet: 0=cardboard, 1=glass, 2=metal, 3=paper, 4=plastic, 5=trash
LABELS = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]
MAP = {
    "glass": "thuy-tinh",
    "paper": "giay",
    "cardboard": "giay",
    "plastic": "nhua-pet",
    "metal": "kim-loai",
    "trash": "nhua-pet",
}


def xoa_anh_cu(train_dir: Path) -> int:
    """Xoa tat ca .jpg/.jpeg/.png trong train/* (giu .gitkeep). Tra ve so file da xoa."""
    n = 0
    if not train_dir.is_dir():
        return 0
    for sub in train_dir.iterdir():
        if not sub.is_dir():
            continue
        for pattern in ("*.jpg", "*.jpeg", "*.png"):
            for f in sub.glob(pattern):
                f.unlink()
                n += 1
    return n


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=200, help="Ảnh tối đa mỗi loại rác")
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="Xóa toàn bộ ảnh cũ trong train/ trước khi tải (tải lại từ đầu)",
    )
    args = parser.parse_args()

    try:
        from datasets import load_dataset
    except ImportError:
        print("Cài đặt: pip install datasets Pillow")
        return

    if args.fresh:
        removed = xoa_anh_cu(DATASET_DIR)
        print("Da xoa", removed, "anh cu trong", DATASET_DIR)

    print("Dang tai dataset TrashNet tu Hugging Face (~3.7GB, lan dau mat vai phut)...")
    try:
        ds = load_dataset("garythung/trashnet", split="train", trust_remote_code=True)
    except Exception as e:
        print("Thu cau hinh khac...")
        try:
            ds = load_dataset("garythung/trashnet", "dataset-resized", split="train", trust_remote_code=True)
        except Exception:
            print("Loi:", e)
            return

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    for folder in set(MAP.values()):
        (DATASET_DIR / folder).mkdir(exist_ok=True)

    count_per_class = {f: 0 for f in set(MAP.values())}
    n = 0
    for item in ds:
        img = item.get("image") or item.get("img")
        label_idx = item.get("label", item.get("labels", 0))
        cat = LABELS[label_idx] if isinstance(label_idx, int) and 0 <= label_idx < len(LABELS) else "plastic"
        target_folder = MAP.get(cat, "nhua-pet")
        if count_per_class[target_folder] >= args.limit:
            continue
        if img:
            out_path = DATASET_DIR / target_folder / f"img_{n:05d}.jpg"
            img.save(out_path, "JPEG", quality=90)
            count_per_class[target_folder] += 1
            n += 1
        if n > 0 and n % 200 == 0:
            print("  Da luu", n, "anh...")

    print("Hoan thanh! Da luu", n, "anh vao", DATASET_DIR)
    for k, v in count_per_class.items():
        print("  -", k, ":", v, "anh")
    print("Chay: python train.py de huan luyen model.")


if __name__ == "__main__":
    main()
