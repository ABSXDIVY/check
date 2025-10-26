#!/bin/bash

# 阿里云Docker镜像加速器配置脚本
# 用途：解决Docker拉取镜像超时问题

# 创建备份目录
BACKUP_DIR="docker_config_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份原有配置（如果存在）
if [ -f "/etc/docker/daemon.json" ]; then
    echo "备份现有Docker配置..."
    cp /etc/docker/daemon.json "$BACKUP_DIR/daemon.json.bak"
    echo "配置已备份到 $BACKUP_DIR/daemon.json.bak"
fi

# 创建Docker配置目录
echo "创建Docker配置目录..."
mkdir -p /etc/docker

# 写入阿里云镜像加速器配置
echo "配置阿里云Docker镜像加速器..."
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://registry.cn-shanghai.aliyuncs.com",
    "https://registry.cn-guangzhou.aliyuncs.com",
    "https://registry.cn-shenzhen.aliyuncs.com",
    "https://registry.cn-beijing.aliyuncs.com"
  ],
  "max-concurrent-downloads": 10,
  "log-driver": "json-file",
  "log-level": "warn",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "data-root": "/var/lib/docker"
}
EOF

echo "Docker镜像加速器配置已完成！"

# 重启Docker服务
echo "重启Docker服务以应用配置..."
systemctl daemon-reload
systemctl restart docker

# 验证Docker服务状态
echo "验证Docker服务状态..."
systemctl status docker --no-pager

# 验证镜像加速器是否生效
echo "验证镜像加速器配置是否生效..."
docker info | grep -A 1 "Registry Mirrors"

echo ""
echo "阿里云Docker镜像加速器配置完成！"
echo "现在可以重试拉取Docker镜像："
echo "  cd /opt/ethereum-attendance/check"
echo "  docker-compose up -d --build"
echo ""
echo "提示：如果仍然遇到问题，可以尝试使用以下特定镜像源（根据您的阿里云地域选择）："
echo "1. 华东：https://registry.cn-hangzhou.aliyuncs.com"
echo "2. 华北：https://registry.cn-beijing.aliyuncs.com"
echo "3. 华南：https://registry.cn-shenzhen.aliyuncs.com"
echo "4. 西南：https://registry.cn-chengdu.aliyuncs.com"
echo ""
echo "您也可以登录阿里云容器镜像服务控制台获取专属加速地址："
echo "https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors"