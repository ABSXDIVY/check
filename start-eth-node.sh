#!/bin/bash

# 以太坊开发节点启动脚本
# 确保节点持续运行，即使意外关闭也能自动重启

echo "正在启动以太坊开发节点..."
echo "使用Hardhat节点作为开发环境"

# 检查是否安装了hardhat
if ! command -v npx &> /dev/null || ! npx hardhat --version &> /dev/null; then
    echo "错误: 未找到Hardhat。请先安装依赖: npm install"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动节点并记录日志
while true; do
    echo "[$(date)] 启动新的以太坊节点实例..." >> logs/node.log
    npx hardhat node > logs/node.log 2>&1
    echo "[$(date)] 节点意外关闭，5秒后重启..." >> logs/node.log
    sleep 5
done