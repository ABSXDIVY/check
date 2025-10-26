# 前端服务启动脚本
Write-Host "正在启动前端服务在3001端口..."

# 设置环境变量
$env:PORT = 3001

# 使用try-catch捕获错误
try {
    # 启动服务
    Write-Host "启动react-scripts..."
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "$pwd" -NoNewWindow -Wait
} catch {
    Write-Host "启动失败，错误: $_"
    Read-Host "按Enter键继续..."
}