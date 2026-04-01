@echo off
setlocal
echo --------------------------------------------------
echo CODE-PREVIEW — Starting AI Code Review 🚀
echo --------------------------------------------------

:: Backend folder
cd backend

:: Check if .env exists
findstr "your_gemini_api_key_here" .env >nul
if %errorlevel% == 0 (
    echo [WARNING] GEMINI_API_KEY is not set in backend/.env.
    echo Please get a key at https://aistudio.google.com/app/apikey 
    echo and paste it in the backend/.env file.
    pause
)

:: Start Backend in a new window
echo Starting Backend API...
start cmd /k "venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for a second
timeout /t 2 /nobreak >nul

:: Start Frontend Server in another window
echo Starting Frontend Server...
cd ..
cd frontend
start cmd /k "python -m http.server 3000"

:: Open Browser
timeout /t 1 /nobreak >nul
echo Opening browser at http://localhost:3000
start http://localhost:3000

echo.
echo --------------------------------------------------
echo Both servers are running!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo --------------------------------------------------
echo Press any key to stop EVERYTHING (close those windows).
pause
