@echo off
echo 启动人事数据看板系统...
echo.

echo 1. 启动后端服务器...
cd server
start "后端服务器" cmd /k "node index.js"
echo 后端服务器启动中... (端口 3001)
echo.

echo 等待3秒让后端服务器启动...
timeout /t 3 /nobreak > nul

echo 2. 启动前端服务器...
cd ..\client
start "前端服务器" cmd /k "npm run dev"
echo 前端服务器启动中... (端口 3000)
echo.

echo 启动完成！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo 健康检查: http://localhost:3001/api/health
echo.
echo 按任意键关闭此窗口...
pause > nul
