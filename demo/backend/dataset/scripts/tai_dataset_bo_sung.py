#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tai dataset BO SUNG tu nhieu nguon Hugging Face de tang do chinh xac.
Dataset nho hon TrashNet (~500MB vs 7GB), chat luong cao.
Cai dat: pip install datasets Pillow
Chay: python tai_dataset_bo_sung.py [--limit N] [--source SOURCE]
"""

import argparse
import re
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent.parent / "train"

# Map ten loai trong dataset -> thu muc cua he thong
# griffinbholt: Battery, Biological, Cardboard, Clothes, Glass, Metal, Paper, Plastic, Shoes, Trash
# thomasavare: co the co cau truc tuong tu
LABEL_TO_FOLDER = {
    "glass": "thuy-tinh",
    "paper": "giay",
    "cardboard": "giay",
    "metal": "kim-loai",
    "plastic": "nhua-pet",
    "trash": "nhua-pet",
    "battery": "kim-loai",
    "biological": "giay",  # organic -> map tam giay
    "organic": "giay",
    "clothes": "nhua-pet",  # vai -> tam map nhua
    "shoes": "nhua-pet",
}


def norm(s):
    return re.sub(r"[^a-z]", "", (s or "").lower())


def xoa_anh_cu(train_dir: Path) -> int:
    """Xoa tat ca .jpg/.jpeg/.png trong train/* (giu .gitkeep)."""
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


def map_label(label_str_or_int, all_labels=None):
    if all_labels and isinstance(label_str_or_int, int):
        label_str_or_int = all_labels[label_str_or_int] if 0 <= label_str_or_int < len(all_labels) else "plastic"
    s = str(label_str_or_int).lower().replace("-", "").replace("_", "")
    for k, v in LABEL_TO_FOLDER.items():
        if k in s or norm(k) in norm(s):
            return v
    return "nhua-pet"


# Cac dataset: (id, config)
DATASETS = [
    # Griffinbholt - 38k anh, 527MB, 10 classes (chat luong cao)
    ("griffinbholt/augmented_waste_classification", {"split": "train"}),
    ("rootstrap-org/waste-classifier", {"split": "train"}),
    ("Tanmay1605/waste-classification", {"split": "train"}),
]


def load_and_save(ds_id, config, limit_per_class, existing_counts):
    try:
        from datasets import load_dataset
    except ImportError:
        return 0, "pip install datasets Pillow"

    print("Dang tai:", ds_id)
    try:
        ds = load_dataset(ds_id, split=config.get("split", "train"), streaming=config.get("streaming", False))
    except Exception as e:
        return 0, str(e)

    if len(ds) == 0:
        return 0, "Dataset trong"

    # Xac dinh cot
    cols = ds.column_names
    img_col = "image" if "image" in cols else ("img" if "img" in cols else None)
    label_col = None
    for c in ["label", "labels", "class", "category"]:
        if c in cols:
            label_col = c
            break

    if not img_col:
        return 0, "Khong tim thay cot anh"

    # Lay ten label neu co
    all_labels = None
    if "label" in cols and hasattr(ds.features.get("label"), "names"):
        all_labels = ds.features["label"].names
        print("  Nhan:", all_labels)

    n = 0
    for i, item in enumerate(ds):
        img = item.get(img_col)
        if img is None:
            continue
        lbl = item.get(label_col, 0)
        target = map_label(lbl, all_labels)
        if existing_counts.get(target, 0) >= limit_per_class:
            continue
        out_dir = DATASET_DIR / target
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"bo_sung_{target}_{i:06d}.jpg"
        try:
            img.save(out_path, "JPEG", quality=90)
            existing_counts[target] = existing_counts.get(target, 0) + 1
            n += 1
        except Exception:
            pass
        if n > 0 and n % 500 == 0:
            print("  Da luu", n, "anh...")
        if sum(existing_counts.values()) >= limit_per_class * 5:
            print("  Da du so luong, dung.")
            break
    return n, None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=300, help="Anh toi da moi loai rac")
    parser.add_argument("--source", type=str, default="all", help="griffinbholt | rootstrap | Tanmay | all")
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="Xoa toan bo anh cu trong train/ truoc khi tai bo sung",
    )
    args = parser.parse_args()

    if args.fresh:
        removed = xoa_anh_cu(DATASET_DIR)
        print("Da xoa", removed, "anh cu trong", DATASET_DIR)

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    for f in ["nhua-pet", "giay", "kim-loai", "thuy-tinh", "nhua-hdpe"]:
        (DATASET_DIR / f).mkdir(exist_ok=True)

    existing_counts = {}
    for d in DATASET_DIR.iterdir():
        if d.is_dir():
            c = len(list(d.glob("*.jpg")) + list(d.glob("*.png")))
            existing_counts[d.name] = c
    print("Hien co:", existing_counts)

    total_added = 0
    if args.source == "all":
        to_try = DATASETS
    else:
        to_try = [(k, v) for k, v in DATASETS if args.source.lower() in k.lower()]
        if not to_try:
            to_try = DATASETS

    for ds_id, config in to_try:
        added, err = load_and_save(ds_id, config, args.limit, existing_counts)
        if err:
            print("  Bo qua:", err)
        else:
            total_added += added
            print("  Them", added, "anh")
        if sum(existing_counts.values()) >= args.limit * 5:
            break

    print("Tong them:", total_added)
    print("Tong dataset:", existing_counts)
    print("Chay: python train.py de huan luyen lai.")


if __name__ == "__main__":
    main()
