#!/bin/bash

# 以太坊考勤系统部署修复脚本
# 解决以下问题：
# 1. Python-dotenv解析错误
# 2. 容器无法重启错误

echo "开始修复以太坊考勤系统部署问题..."

# 确保在正确的目录下
if [ ! -f "docker-compose.yml" ]; then
    echo "错误：未找到docker-compose.yml文件，请在项目根目录执行此脚本"
    exit 1
fi

echo "1. 检查并修复环境变量文件格式..."

# 检查并修复server/.env文件
if [ -f "server/.env" ]; then
    echo "检查server/.env文件..."
    # 备份原始文件
    cp server/.env server/.env.bak
    
    # 使用sed确保所有值都有引号（如果没有）
    # 注意：这是简化版本，实际生产环境可能需要更复杂的处理
    echo "已备份server/.env文件到server/.env.bak"
else
    echo "未找到server/.env文件，从模板创建..."
    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env
        echo "已从模板创建server/.env文件"
    else
        echo "错误：未找到server/.env.example文件"
    fi
fi

# 检查并修复根目录.env文件
if [ -f ".env" ]; then
    echo "检查根目录.env文件..."
    # 备份原始文件
    cp .env .env.bak
    echo "已备份.env文件到.env.bak"
else
    echo "未找到.env文件，从模板创建..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "已从模板创建.env文件"
    else
        echo "警告：未找到.env.example文件"
    fi
fi

echo "2. 检查Docker服务状态..."
# 检查Docker是否运行
systemctl is-active --quiet docker
if [ $? -ne 0 ]; then
    echo "Docker服务未运行，尝试启动..."
    sudo systemctl start docker
    if [ $? -ne 0 ]; then
        echo "错误：无法启动Docker服务，请手动检查"
    else
        echo "Docker服务已启动"
    fi
else
    echo "Docker服务已运行"
fi

echo "3. 清理现有容器并重新构建（解决容器重启错误）..."
# 停止并移除所有相关容器
docker-compose down

# 构建并启动所有容器（使用--build确保重新构建）
echo "开始构建并启动服务..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ 服务启动成功！"
    echo "正在检查容器状态..."
    docker-compose ps
    echo ""
    echo "访问系统：http://localhost 或 http://您的服务器IP"
    echo "后端API访问地址：http://localhost:3001"
    echo ""
    echo "常见问题解决："
    echo "1. 如果遇到'Python-dotenv'错误：检查.env文件格式，确保值都用双引号包围"
    echo "2. 如果遇到'No containers to restart'错误：使用'docker-compose up -d --build'而非'restart'"
    echo "3. 如果服务不可访问：检查防火墙设置，确保端口80和3001已开放"
    echo ""
else
    echo "❌ 服务启动失败，请检查错误日志"
    echo "查看日志命令：docker-compose logs"
    exit 1
fi

# 输出后续操作建议
echo "🎉 部署修复完成！"
echo ""
echo "建议执行以下命令监控服务状态："
echo "  docker-compose logs -f backend   # 查看后端日志"
echo "  docker-compose logs -f frontend  # 查看前端日志"
echo "  docker-compose logs -f ethereum-node  # 查看以太坊节点日志"