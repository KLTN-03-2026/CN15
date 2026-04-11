#!/usr/bin/env python3
"""
Dua ra du doan loai rac tu anh. Goi tu Node.js:
  python du_doan.py <path_to_image>
Output JSON: {"loaiRac":"nhua-pet","confidence":0.95}
"""

import sys
import json
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "waste_classifier.pt"


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Thieu duong dan anh"}))
        return
    img_path = sys.argv[1]
    if not Path(img_path).exists():
        print(json.dumps({"error": "File khong ton tai"}))
        return
    if not MODEL_PATH.exists():
        print(json.dumps({"error": "Chua co model. Chay train.py truoc."}))
        return

    try:
        import torch
        from torchvision import models, transforms
        from PIL import Image
    except ImportError:
        print(json.dumps({"error": "Cai dat: pip install torch torchvision Pillow"}))
        return

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    img = Image.open(img_path).convert("RGB")
    x = transform(img).unsqueeze(0)

    ckpt = torch.load(MODEL_PATH, map_location="cpu")
    class_names = ckpt.get("class_names", [])
    model = models.resnet18()
    model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))
    model.load_state_dict(ckpt["model_state"])
    model.eval()

    with torch.no_grad():
        out = model(x)
        probs = torch.softmax(out, dim=1)[0]
        idx = torch.argmax(probs).item()
        conf = float(probs[idx])

    out = {
        "loaiRac": class_names[idx] if idx < len(class_names) else "nhua-pet",
        "confidence": round(conf, 3),
    }
    print(json.dumps(out))


if __name__ == "__main__":
    main()
