@echo off
chcp 65001 >nul
echo === Thiết lập AI nhận diện rác ===
echo.

REM Kiểm tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Cần cài Python: https://python.org
    pause
    exit /b 1
)

echo [1/3] Cài đặt thư viện...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo Lỗi cài đặt. Chạy: pip install -r requirements.txt
    pause
    exit /b 1
)

echo [2/3] Tai dataset bo sung (griffinbholt ~500MB)...
python tai_dataset_bo_sung.py --limit 150 2>nul || python tao_mau.py
if errorlevel 1 (
    echo Lỗi tải dataset.
    pause
    exit /b 1
)

echo [3/3] Huấn luyện model...
python train.py
if errorlevel 1 (
    echo Lỗi huấn luyện.
    pause
    exit /b 1
)

echo.
echo === Hoàn thành! ===
echo Model đã lưu tại backend/models/waste_classifier.pt
echo.
pause
