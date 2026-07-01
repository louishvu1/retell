@echo off
cd /d "%~dp0"
git add -A
git commit -m "Nott AI Milestone 1 — booking flow, Square OAuth, DB migrations, seed scripts"
git push https://YOUR_GITHUB_TOKEN@github.com/louishvu1/retell.git main
echo.
echo Done! Press any key to close.
pause >nul
