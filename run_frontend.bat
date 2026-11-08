@echo off
chcp 65001 > nul
cd /d "%~dp0frontend"
echo [Frontend] Next.js サーバーを起動しています (http://localhost:3000) ...
npm run dev
pause

