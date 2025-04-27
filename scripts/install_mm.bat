@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo === 🚀  Installing Object Detection App  (Micromamba) ===

REM ---------------------------------------------------------------------
REM 0) FIND MICROMAMBA  (PATH → root‑prefix)
REM ---------------------------------------------------------------------
for %%I in (micromamba.exe) do set "MM=%%~$PATH:I"
if not defined MM (
    set "MM=%USERPROFILE%\micromamba\micromamba.exe"
)

if not exist "%MM%" (
    echo ❌  Micromamba exe not found [%MM%]
    echo    Add it to PATH or specify your own prefix.
    exit /b 1
)

REM ---------------------------------------------------------------------
set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%..\"
REM ---------------------------------------------------------------------
REM 1) BACKEND ENV  (create only if YAML exists)
REM ---------------------------------------------------------------------
set "BACK_ENV=backend_mm"
set "BACK_YML=%ROOT%backend\environment.yml"

if exist "%BACK_YML%" (
    echo 🔎  Checking %BACK_ENV% ...
    set "FOUND=0"
    for /f "tokens=1" %%E in ('"%MM%" env list') do (
        if "%%E"=="%BACK_ENV%" set FOUND=1
    )
    if !FOUND! EQU 1 (
        echo ✅  %BACK_ENV% already exists – skipping.
    ) else (
        echo 🐍  Creating %BACK_ENV% ...
        "%MM%" create -y -n %BACK_ENV% -f "%BACK_YML%" || (
            echo ❌  Creating %BACK_ENV% failed & exit /b 1
        )
    )
) else (
    echo ⚠️  %BACK_YML% not found – backend env will be skipped!
)

REM ---------------------------------------------------------------------
REM 2) MODELS (YOLOv5 / YOLOv7)  – check existence via for/f
REM ---------------------------------------------------------------------
call "%ROOT%backend\models\setup_models_mm.bat" || exit /b 1

REM ---------------------------------------------------------------------
REM 3) FRONTEND
REM ---------------------------------------------------------------------
echo 📦  Installing frontend dependencies ...
pushd "%ROOT%frontend" || exit /b 1
npm install
popd



echo === ✅  Micromamba installation complete ===
endlocal