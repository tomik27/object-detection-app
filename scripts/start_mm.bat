@echo off
chcp 65001 >nul
set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%..\"

rem ── najdi micromamba.exe nebo použij výchozí cestu ─────────────
for %%I in (micromamba.exe) do set "MM=%%~$PATH:I"
if not defined MM set "MM=%USERPROFILE%\micromamba\micromamba.exe"

echo ROOT = "%ROOT%"
echo Micromamba binary = "%MM%"

rem 1) Ověření existence backend složky
if not exist "%ROOT%backend" (
    echo ❌  backend složka neexistuje: "%ROOT%backend"
    pause
    exit /b 1
)
echo ✅  backend složka existuje: "%ROOT%backend"

rem 2) Ověření, že micromamba existuje
if not exist "%MM%" (
    echo ❌  micromamba.exe nenalezena: "%MM%"
    pause
    exit /b 1
)
echo ✅  micromamba.exe found

rem 3) Spuštění BACKEND v novém okně s debugem – používá direktní cestu k micromamba
start "BACKEND" cmd /k ^
    "cd /d %ROOT%backend && echo ✅ cd succeeded: %%cd%% && echo [DEBUG] Running micromamba... && "%MM%" run -n backend_mm python app.py && echo ✅ micromamba run succeeded && pause"

REM ── FRONTEND (React/Vite) ──────────────────────────────────────────
start "FRONTEND" cmd /k "cd %ROOT%frontend && npm run dev"

echo === ✅  All components are running  ===
