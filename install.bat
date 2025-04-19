@echo off
chcp 65001 > nul
echo === 🚀 Installing Object Detection App ===

REM Load Conda base
CALL conda activate base

REM Create backend environment if environment.yml exists
if exist backend\environment.yml (
    echo 🐍 Creating backend_env...
    CALL conda env create -f backend\environment.yml
) else (
    echo ⚠️ Skipping backend_env creation – backend\environment.yml not found!
)

REM Setup YOLOv5 and YOLOv7 environments
echo 🔧 Setting up YOLOv5 and YOLOv7...
CALL backend\models\setup_models.bat

REM Return to project root
cd /d %~dp0

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
CALL npm install
cd ..

echo === ✅ Installation complete! You can now run: start.bat ===
