@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo === Tai lai dataset TrashNet (xoa anh cu, tai moi) ===
echo Can: Python + pip, mang on dinh. Lan dau tai ~3.7GB cache Hugging Face.
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo Khong tim thay python. Cai Python hoac mo Anaconda Prompt roi chay lai.
    pause
    exit /b 1
)

pip install -r requirements.txt -q
if errorlevel 1 (
    echo Loi: pip install -r requirements.txt
    pause
    exit /b 1
)

echo Dang chay: python tai_dataset.py --fresh --limit 200
python tai_dataset.py --fresh --limit 200
if errorlevel 1 (
    echo Loi tai dataset.
    pause
    exit /b 1
)

echo.
echo === Xong TrashNet. (Tuy chon) Bo sung them: python tai_dataset_bo_sung.py --fresh --limit 150 ===
pause
