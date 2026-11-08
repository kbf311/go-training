@echo off
chcp 65001 > nul
cd /d "%~dp0backend"
echo [Backend] Go サーバーを起動しています (http://localhost:8080) ...
go run ./cmd/api
pause

