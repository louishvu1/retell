@echo off
cd /d "C:\Users\louis\Claude\Projects\Retell"

echo ============================================
echo  Nott AI - Local Setup
echo ============================================
echo.

echo [1/4] Installing npm packages...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)
echo.

echo [2/4] Generating database migrations...
call npm run db:generate
if %ERRORLEVEL% neq 0 (
    echo ERROR: db:generate failed.
    pause
    exit /b 1
)
echo.

echo [3/4] Running migrations (creates SQLite database)...
call npm run db:migrate
if %ERRORLEVEL% neq 0 (
    echo ERROR: db:migrate failed.
    pause
    exit /b 1
)
echo.

echo [4/4] Registering first client in database...
call npx ts-node src/db/seed.ts
if %ERRORLEVEL% neq 0 (
    echo ERROR: seed.ts failed.
    pause
    exit /b 1
)
echo.

echo ============================================
echo  All done! Next steps:
echo  1. Run: ngrok http 3000
echo  2. Copy the ngrok URL into .env as APP_BASE_URL
echo  3. Run: npm run dev
echo  4. Visit: http://localhost:3000/oauth/square/start?agent_id=agent_04cb403d93c1d6fc57ba9a18a0
echo ============================================
pause
