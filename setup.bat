@echo off
setlocal
echo --------------------------------------------------
echo CODE-PREVIEW — One-Click Setup
echo --------------------------------------------------

:: Change to backend directory
cd backend

:: Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

:: Install dependencies
echo Installing backend dependencies...
call venv\Scripts\activate
pip install -r requirements.txt

:: Create .env if it doesn't exist
if not exist .env (
    echo Creating default .env file...
    echo # Copy of .env.example — fill in your real key > .env
    echo GEMINI_API_KEY=your_gemini_api_key_here >> .env
)

echo.
echo --------------------------------------------------
echo Setup complete! 
echo IMPORTANT: Open backend/.env and add your GEMINI_API_KEY.
echo --------------------------------------------------
pause
