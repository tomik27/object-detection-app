@echo off
setlocal
chcp 65001 >nul

set ROOT=%cd%

echo 🧠 Setting up YOLOv5 and YOLOv7...

REM --- Clone YOLOv5 if it doesn't exist ---
if not exist "%ROOT%\backend\models\yolov5" (
    echo 📦 Cloning YOLOv5...
    git clone https://github.com/ultralytics/yolov5.git "%ROOT%\backend\models\yolov5"
) else (
    echo 🔁 YOLOv5 already exists, skipping clone.
)

REM --- Clone YOLOv7 if it doesn't exist ---
if not exist "%ROOT%\backend\models\yolov7" (
    echo 📦 Cloning YOLOv7...
    git clone https://github.com/WongKinYiu/yolov7.git "%ROOT%\backend\models\yolov7"
) else (
    echo 🔁 YOLOv7 already exists, skipping clone.
)

REM --- Copy environment.yml files ---
echo 📄 Copying environment.yml files...
copy /Y "%ROOT%\backend\models\yolov5-environment.yml" "%ROOT%\backend\models\yolov5\environment.yml" >nul
copy /Y "%ROOT%\backend\models\yolov7-environment.yml" "%ROOT%\backend\models\yolov7\environment.yml" >nul

REM --- Create yolov5_env if it does not exist ---
echo 🔍 Checking for yolo5_env...
conda info --envs | findstr /R /C:"^yolo5_env[ \t]" >nul
if %errorlevel%==0 (
    echo ✅ yolo5_env already exists, skipping creation.
) else (
    echo 🐍 Creating yolo5_env...
    cd "%ROOT%\backend\models\yolov5"
    conda env create -f environment.yml
    timeout /t 5 >nul
    conda info --envs | findstr /R /C:"^yolo5_env[ \t]" >nul
    if %errorlevel%==0 (
        echo ✅ yolo5_env successfully created.
    ) else (
        echo ❌ Error creating yolo5_env.
        exit /b 1
    )
)

REM --- Create yolov7_env if it does not exist ---
echo 🔍 Checking for yolov7_env...
conda info --envs | findstr /R /C:"^yolov7_env[ \t]" >nul
if %errorlevel%==0 (
    echo ✅ yolov7_env already exists, skipping creation.
) else (
    echo 🐍 Creating yolov7_env...
    cd "%ROOT%\backend\models\yolov7"
    conda env create -f environment.yml
    timeout /t 5 >nul
    conda info --envs | findstr /R /C:"^yolov7_env[ \t]" >nul
    if %errorlevel%==0 (
        echo ✅ yolov7_env successfully created.
    ) else (
        echo ❌ Error creating yolov7_env.
        exit /b 1
    )
)

cd "%ROOT%"
echo 🎉 YOLO models and environments are ready!

endlocal
