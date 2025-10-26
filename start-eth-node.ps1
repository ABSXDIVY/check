# 以太坊开发节点启动脚本(PowerShell版本)

Write-Host "Starting Ethereum development node..."

# Create logs directory
if (-not (Test-Path -Path ".\logs")) {
    New-Item -ItemType Directory -Path ".\logs" -Force
}

# Start node and ensure it keeps running
while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path ".\logs\node.log" -Value "[$timestamp] Starting new Ethereum node instance..."
    
    try {
        # Start the node process
        npx hardhat node
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Add-Content -Path ".\logs\node.log" -Value "[$timestamp] Node closed, restarting in 5 seconds..."
        Start-Sleep -Seconds 5
    } catch {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Add-Content -Path ".\logs\node.log" -Value "[$timestamp] Error: $_"
        Start-Sleep -Seconds 5
    }
}