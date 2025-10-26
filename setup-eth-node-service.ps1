# 设置以太坊节点为持久服务
# 此脚本使用Windows任务计划程序创建一个在系统启动时自动运行并保持运行的任务

$scriptPath = "$PSScriptRoot\start-eth-node.ps1"
$taskName = "EthereumDevNode"

Write-Host "正在配置以太坊开发节点为持久服务..."

# 检查启动脚本是否存在
if (-not (Test-Path -Path $scriptPath)) {
    Write-Host "错误: 启动脚本 $scriptPath 不存在"
    exit 1
}

# 创建或更新任务计划程序任务
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File \"$scriptPath\""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -RestartCount 10 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# 检查任务是否已存在
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "更新现有任务: $taskName"
    Set-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal
} else {
    Write-Host "创建新任务: $taskName"
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal
}

# 立即启动任务
Write-Host "立即启动以太坊节点服务..."
Start-ScheduledTask -TaskName $taskName

Write-Host ""
Write-Host "✅ 以太坊节点服务配置完成!"
Write-Host "- 任务名称: $taskName"
Write-Host "- 启动脚本: $scriptPath"
Write-Host "- 日志位置: .\logs\node.log"
Write-Host "- 服务将在系统启动时自动运行"
Write-Host "- 如果节点意外关闭，将自动重启"
Write-Host ""
Write-Host "要手动管理此服务，请使用以下命令:"
Write-Host "- 查看状态: Get-ScheduledTask -TaskName $taskName | Select-Object State"
Write-Host "- 停止服务: Stop-ScheduledTask -TaskName $taskName"
Write-Host "- 启动服务: Start-ScheduledTask -TaskName $taskName"
Write-Host "- 查看日志: Get-Content -Path .\logs\node.log -Tail 100"