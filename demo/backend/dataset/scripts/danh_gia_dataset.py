#!/usr/bin/env python3
"""
Đánh giá độ chính xác model local trên TOÀN BỘ ảnh trong dataset/train/<lớp>/
Nhãn đúng = tên thư mục (nhua-pet, giay, ...). So khớp với dự đoán của du_doan.

Chạy: python danh_gia_dataset.py
       python danh_gia_dataset.py --json   (chỉ in JSON cho máy đọc)

Yêu cầu: đã train và có backend/models/waste_classifier.pt
"""
import argparse
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DATASET_TRAIN = SCRIPT_DIR.parent / "train"
MODEL_PATH = SCRIPT_DIR.parent.parent / "models" / "waste_classifier.pt"
DU_DOAN = SCRIPT_DIR / "du_doan.py"

EXT = (".jpg", ".jpeg", ".png", ".webp", ".bmp")


def collect_images():
    by_class = {}
    if not DATASET_TRAIN.exists():
        return by_class
    for d in sorted(DATASET_TRAIN.iterdir()):
        if not d.is_dir() or d.name.startswith("."):
            continue
        imgs = [p for p in d.iterdir() if p.suffix.lower() in EXT]
        if imgs:
            by_class[d.name] = imgs
    return by_class


def predict_one(img_path: Path) -> dict:
    """Gọi du_doan.py, trả dict hoặc {error: ...}"""
    r = subprocess.run(
        [sys.executable, str(DU_DOAN), str(img_path)],
        cwd=str(SCRIPT_DIR),
        capture_output=True,
        text=True,
        timeout=120,
    )
    out = (r.stdout or "").strip()
    try:
        return json.loads(out.splitlines()[-1] if out else "{}")
    except json.JSONDecodeError:
        return {"error": out or r.stderr or "parse fail"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true", help="In chỉ JSON kết quả")
    args = ap.parse_args()

    by_class = collect_images()
    total_imgs = sum(len(v) for v in by_class.values())

    report = {
        "dataset_dir": str(DATASET_TRAIN),
        "model_path": str(MODEL_PATH),
        "model_exists": MODEL_PATH.exists(),
        "so_anh_moi_lop": {k: len(v) for k, v in by_class.items()},
        "tong_so_anh": total_imgs,
    }

    if not MODEL_PATH.exists():
        report["loi"] = "Chưa có model. Chạy: python train.py (sau khi có ảnh trong train/)"
        print(json.dumps(report, ensure_ascii=False, indent=2))
        sys.exit(1)

    if total_imgs == 0:
        report["loi"] = "Không có ảnh trong train/<lớp>/. Chạy: python tao_mau.py hoặc tải dataset."
        print(json.dumps(report, ensure_ascii=False, indent=2))
        sys.exit(1)

    # du_doan trả loaiRac = tên lớp trong class_names (cùng thứ tự train ImageFolder)
    correct = 0
    wrong = 0
    per_class = defaultdict(lambda: {"dung": 0, "sai": 0})
    confusion = defaultdict(lambda: defaultdict(int))  # true -> pred -> count
    confidences = []

    for true_label, paths in sorted(by_class.items()):
        for p in paths:
            pred = predict_one(p)
            if pred.get("error"):
                wrong += 1
                per_class[true_label]["sai"] += 1
                confusion[true_label]["__error__"] += 1
                continue
            pred_label = pred.get("loaiRac", "")
            conf = float(pred.get("confidence", 0))
            confidences.append(conf)

            ok = pred_label == true_label
            if ok:
                correct += 1
                per_class[true_label]["dung"] += 1
            else:
                wrong += 1
                per_class[true_label]["sai"] += 1
            confusion[true_label][pred_label] += 1

    n = correct + wrong
    acc = correct / n if n else 0.0
    report["tong_du_doan"] = n
    report["dung"] = correct
    report["sai"] = wrong
    report["do_chinh_xac_tong"] = round(acc * 100, 2)
    report["confidence_trung_binh"] = round(sum(confidences) / len(confidences), 4) if confidences else None
    report["confidence_min"] = round(min(confidences), 4) if confidences else None
    report["confidence_max"] = round(max(confidences), 4) if confidences else None
    report["theo_lop"] = {
        k: {
            "dung": v["dung"],
            "sai": v["sai"],
            "acc_%": round(100 * v["dung"] / (v["dung"] + v["sai"]), 2) if (v["dung"] + v["sai"]) else 0,
        }
        for k, v in sorted(per_class.items())
    }
    report["confusion_matrix"] = {
        true_l: dict(preds) for true_l, preds in sorted(confusion.items())
    }

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("=== Đánh giá model trên dataset (train/) ===\n")
        print(f"Thư mục: {DATASET_TRAIN}")
        print(f"Model:   {MODEL_PATH} (exists={MODEL_PATH.exists()})")
        print(f"Tổng ảnh: {n} | Đúng: {correct} | Sai: {wrong}")
        print(f"Độ chính xác: {report['do_chinh_xac_tong']}%")
        if confidences:
            print(
                f"Confidence TB: {report['confidence_trung_binh']} (min={report['confidence_min']}, max={report['confidence_max']})"
            )
        print("\nTheo lớp:")
        for k, v in report["theo_lop"].items():
            print(f"  {k}: {v['acc_%']}% ({v['dung']}/{v['dung']+v['sai']})")
        print("\nConfusion (nhãn đúng -> số lần dự đoán):")
        for tl, preds in report["confusion_matrix"].items():
            print(f"  {tl}: {dict(preds)}")
        print("\n(JSON đầy đủ: python danh_gia_dataset.py --json)")

    sys.exit(0)


if __name__ == "__main__":
    main()
