@echo off
echo === Starting Object Detection App ===

REM Start Flask backend in a new terminal window
echo Starting Flask backend...
start cmd /k "cd backend && conda activate backend_env && python app.py"

REM Start React frontend in a new terminal window
echo Starting React frontend...
start cmd /k "cd frontend && npm run dev"

echo === All components are running ===
