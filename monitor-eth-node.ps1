# 以太坊节点监控脚本
# 定期检查节点状态，确保其持续运行

$interval = 300  # 检查间隔（秒）
$scriptPath = "$PSScriptRoot\start-eth-node.ps1"

Write-Host "启动以太坊节点监控..."
Write-Host "检查间隔: $interval 秒"
Write-Host "按 Ctrl+C 停止监控"
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # 检查是否有hardhat节点进程在运行
    $nodeProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -match "node_modules\\.bin\\node" -or 
        $_.CommandLine -match "hardhat node"
    }
    
    if ($nodeProcess) {
        Write-Host "[$timestamp] ✅ 以太坊节点正常运行 (PID: $($nodeProcess.Id))"
    } else {
        Write-Host "[$timestamp] ❌ 未检测到运行中的以太坊节点，正在启动..."
        
        # 检查启动脚本是否存在
        if (Test-Path -Path $scriptPath) {
            try {
                # 启动节点（使用新窗口，避免监控脚本被阻塞）
                Start-Process PowerShell -ArgumentList "-ExecutionPolicy Bypass -File \"$scriptPath\""
                Write-Host "[$timestamp] ✅ 以太坊节点已启动"
            } catch {
                Write-Host "[$timestamp] ❌ 启动节点失败: $_"
            }
        } else {
            Write-Host "[$timestamp] ❌ 启动脚本 $scriptPath 不存在"
        }
    }
    
    # 等待下一次检查
    Start-Sleep -Seconds $interval
}