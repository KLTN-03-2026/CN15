#!/usr/bin/env python3
"""
Script huan luyen model nhan dien loai rac. Tang cuong data augmentation va nhieu epoch.
Cai dat: pip install -r requirements.txt
Chay: python train.py
"""

from pathlib import Path

try:
    import torch
    from torch.utils.data import DataLoader, random_split
    from torchvision import datasets, models, transforms
except ImportError:
    print("Cai dat: pip install torch torchvision")
    exit(1)

DATASET_DIR = Path(__file__).resolve().parent.parent / "train"
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "models"

# Data augmentation - tang da dang anh, giam overfitting
TRAIN_TRANSFORM = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
VAL_TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def main():
    if not DATASET_DIR.exists():
        print("Tao thu muc dataset:", DATASET_DIR)
        for f in ["nhua-pet", "giay", "kim-loai", "thuy-tinh", "nhua-hdpe"]:
            (DATASET_DIR / f).mkdir(parents=True, exist_ok=True)
        print("Da tao cau truc. Hay chay tai_dataset_bo_sung.py truoc.")
        return

    counts = {}
    for d in DATASET_DIR.iterdir():
        if d.is_dir():
            c = len(list(d.glob("*.jpg")) + list(d.glob("*.png")) + list(d.glob("*.jpeg")))
            counts[d.name] = c
    total = sum(counts.values())
    if total < 20:
        print("Dataset qua it (", total, "anh). Chay: python tai_dataset_bo_sung.py")
        print("Cau truc:", counts)
        return

    print("Dataset:", counts, "| Tong:", total)

    full_ds = datasets.ImageFolder(str(DATASET_DIR), transform=None)
    class_names = full_ds.classes
    n = len(full_ds)
    train_size = int(0.85 * n)
    val_size = n - train_size
    train_sub, val_sub = random_split(full_ds, [train_size, val_size])

    class TransformSubset(torch.utils.data.Dataset):
        def __init__(self, subset, transform):
            self.subset, self.transform = subset, transform
        def __len__(self): return len(self.subset)
        def __getitem__(self, i):
            img, lbl = self.subset[i]
            return self.transform(img), lbl

    train_ds = TransformSubset(train_sub, TRAIN_TRANSFORM)
    val_ds = TransformSubset(val_sub, VAL_TRANSFORM)

    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=0)

    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

    best_acc = 0.0
    for epoch in range(12):
        model.train()
        total_loss = 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            out = model(images)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        avg_loss = total_loss / len(train_loader)
        scheduler.step(avg_loss)

        model.eval()
        correct, total_val = 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                pred = model(images).argmax(dim=1)
                correct += (pred == labels).sum().item()
                total_val += labels.size(0)
        acc = correct / total_val if total_val > 0 else 0
        print("Epoch", epoch + 1, "| Loss:", round(avg_loss, 4), "| Val Acc:", round(acc * 100, 1), "%")

        if acc > best_acc:
            best_acc = acc
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            torch.save({
                "model_state": model.state_dict(),
                "class_names": class_names,
            }, OUTPUT_DIR / "waste_classifier.pt")
            print("  -> Luu model tot hon (acc:", round(best_acc * 100, 1), "%)")

    print("Hoan thanh! Model tot nhat:", round(best_acc * 100, 1), "%")
    print("Da luu tai", OUTPUT_DIR / "waste_classifier.pt")


if __name__ == "__main__":
    main()
