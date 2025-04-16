@echo off
echo === Installing Object Detection App ===

REM Load Conda
CALL conda activate base

REM Create backend environment
echo Creating backend_env...
CALL conda env create -f backend\environment.yml

REM Setup YOLO models (v5 + v7)
echo Setting up YOLOv5 and YOLOv7...
CALL backend\models\setup_models.bat

REM Go to project root
cd /d %~dp0


REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
CALL npm install
cd ..

echo === Installation complete! You can now run: start.bat ===
