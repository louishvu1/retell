@echo off
cd /d "C:\Users\louis\Claude\Projects\Retell"
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
