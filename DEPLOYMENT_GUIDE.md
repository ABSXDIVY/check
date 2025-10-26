# 以太坊考勤系统 - Ubuntu 24.04 部署指南

## 解决的问题

本指南针对以下部署错误提供完整解决方案：
- `WARNING: Python-dotenv could not parse statement starting at line 1`
- `ERROR: No containers to restart`

## 环境变量修复说明

环境变量文件格式已修复，所有值现在都包含在双引号中。这解决了Python-dotenv解析错误问题。

## 服务器部署完整步骤

### 1. 准备工作

确保服务器已经完成以下准备：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Docker和Docker Compose
apt install -y docker.io docker-compose

# 启动Docker服务
systemctl start docker
systemctl enable docker
```

### 2. 克隆项目代码

```bash
# 创建项目目录
mkdir -p /opt/ethereum-attendance
cd /opt/ethereum-attendance

# 克隆代码
# 注意：克隆后的主文件夹名是check
git clone https://github.com/ABSXDIVY/check.git
cd check
```

### 3. 获取修复后的配置

```bash
# 确保获取最新的修复代码
git pull

# 检查环境变量文件是否存在
ls -la .env server/.env

# 如果不存在，创建环境变量文件
cp .env.example .env
cp server/.env.example server/.env
```

### 4. 首次构建和启动服务（重要）

**警告：** 不要使用`restart`命令，因为容器尚未创建。必须使用`up -d --build`命令：

```bash
# 首次构建并启动所有服务
docker-compose up -d --build

# 检查容器状态
docker-compose ps

# 检查日志（可选）
docker-compose logs -f
```

### 5. 验证服务

服务启动后，可以通过以下方式验证：

```bash
# 检查所有容器是否运行中
docker-compose ps

# 验证前端服务是否可以访问
curl -I http://localhost:80

# 验证后端API是否正常
curl -I http://localhost:3001/health
```

## 常见问题解决

### 1. Python-dotenv解析错误

问题：`WARNING: Python-dotenv could not parse statement starting at line 1`

解决方案：
- 确保环境变量值都用双引号包围
- 检查.env和server/.env文件格式是否正确
- 重新拉取最新代码：`git pull`

### 2. 容器无法重启错误

问题：`ERROR: No containers to restart`

解决方案：
- 不要使用`docker-compose restart`命令
- 使用`docker-compose up -d --build`命令重新构建和启动容器

### 3. 服务无法访问

问题：无法通过浏览器访问服务

解决方案：
- 检查防火墙设置，确保端口80和3001已开放
- 检查容器状态：`docker-compose ps`
- 检查容器日志：`docker-compose logs [服务名]`

## 服务管理命令

```bash
# 启动所有服务（首次或重新构建）
docker-compose up -d --build

# 停止所有服务
docker-compose down

# 查看所有容器状态
docker-compose ps

# 查看特定服务日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend

# 查看以太坊节点日志
docker-compose logs -f ethereum-node
```

## 注意事项

1. **避免使用restart命令**：容器首次部署时，使用`up -d --build`而不是`restart`
2. **环境变量格式**：所有环境变量值必须用双引号包围
3. **资源要求**：确保服务器至少有2GB内存和1核CPU
4. **端口冲突**：确保端口80、3001、8545和8546未被占用
5. **权限问题**：确保当前用户有Docker执行权限（或使用sudo）

## 故障排除流程

1. 检查环境变量文件格式：`cat .env server/.env`
2. 检查Docker服务状态：`systemctl status docker`
3. 重新构建容器：`docker-compose up -d --build`
4. 查看详细日志：`docker-compose logs --tail=100`
5. 检查容器健康状态：`docker-compose ps`

按照本指南操作，系统应该能够成功启动并运行，不再出现Python-dotenv解析错误和容器重启失败的问题。