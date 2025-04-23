@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
set "ROOT=%~dp0"

:: Vypnout nové defaultní chování torch.load() (PyTorch ≥ 2.6)
set "TORCH_FORCE_NO_WEIGHTS_ONLY_LOAD=1"

REM ---------------------------------------------------------------------
REM Locate micromamba executable
REM ---------------------------------------------------------------------
for %%I in (micromamba.exe) do set "MM=%%~$PATH:I"
if not defined MM set "MM=%USERPROFILE%\micromamba\micromamba.exe"
if not exist "%MM%" (
    echo ❌  micromamba.exe not found [%MM%]
    exit /b 1
)
echo === Running script from: %ROOT% ===


REM ---------------------------------------------------------------------
REM Clone YOLOv5 repo if not present
REM ---------------------------------------------------------------------
if not exist "%ROOT%yolov5\.git" (
    echo 🔽 Cloning YOLOv5 repository...
    git clone https://github.com/ultralytics/yolov5 "%ROOT%yolov5" || (
        echo ❌ Failed to clone YOLOv5 & exit /b 1
    )
) else (
    echo 🔁 YOLOv5 already exists at %ROOT%yolov5, skipping clone.
)

REM ---------------------------------------------------------------------
REM Clone YOLOv7 repo if not present
REM ---------------------------------------------------------------------
if not exist "%ROOT%yolov7\.git" (
    echo 🔽 Cloning YOLOv7 repository...
    git clone https://github.com/WongKinYiu/yolov7 "%ROOT%yolov7" || (
        echo ❌ Failed to clone YOLOv7 & exit /b 1
    )
) else (
    echo 🔁 YOLOv7 already exists at %ROOT%yolov7, skipping clone.
)

REM ---------------------------------------------------------------------
REM Copy custom environment.yml into model folders
REM ---------------------------------------------------------------------
echo 📄 Copying environment.yml into model folders...
copy /Y "%ROOT%yolov5-environment.yml" "%ROOT%yolov5\environment.yml" >nul
copy /Y "%ROOT%yolov7-environment.yml" "%ROOT%yolov7\environment.yml" >nul

REM ---------------------------------------------------------------------
REM Create YOLO environments
REM ---------------------------------------------------------------------
for %%M in (yolov5 yolov7) do (
    set "ENV_NAME=%%M_mm"
    set "FOUND=0"
    for /f "tokens=1" %%E in ('"%MM%" env list') do (
        if "%%E"=="!ENV_NAME!" set FOUND=1
    )
    if !FOUND! EQU 1 (
        echo ✅  !ENV_NAME! already exists – skipping.
    ) else (
        echo 🐍  Creating !ENV_NAME! from %ROOT%%%M\environment.yml...
        "%MM%" create -y -n !ENV_NAME! -f "%ROOT%%%M\environment.yml" || (
            echo ❌  Creating !ENV_NAME! failed & exit /b 1
        )

        )
    )
)

rem --- seznam "relative\path|URL"
for %%G in (
    "yolov5\yolov5s.pt|https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5s.pt"
    "yolov5\yolov5m.pt|https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5m.pt"
    "yolov5\yolov5l.pt|https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5l.pt"
    "yolov7\yolov7.pt|https://github.com/WongKinYiu/yolov7/releases/download/v0.1/yolov7.pt"
    "yolov7\yolov7-tiny.pt|https://huggingface.co/kadirnar/yolov7-tiny-v0.1/resolve/main/yolov7-tiny.pt"
    "yolov7\yolov7-e6.pt|https://huggingface.co/TechC-SugarCane/yolov7-models/resolve/main/sugarcane/YOLOv7-e6.pt"
    "yolov7\yolov7-d6.pt|https://huggingface.co/spaces/khushalcyber/yolo/resolve/main/weights/yolov7-d6.pt"
    "yolov7\yolov7x.pt|https://huggingface.co/TechC-SugarCane/yolov7-models/resolve/main/sugarcane/YOLOv7x.pt"
) do (
    for /f "tokens=1,2 delims=|" %%a in ("%%~G") do (
        set "OUT=%ROOT%%%a"
        if not exist "%%~dpnxOUT" (
            echo 🔽  Downloading %%a …
            powershell -NoLogo -NoProfile -Command ^
                "Invoke-WebRequest -Uri '%%b' -OutFile '%ROOT%%%a'"
        ) else (
            echo ✅  %%a already present.
        )
    )
)


echo 🎉  All YOLO models + environments are set up
endlocal
