# 阿里云服务器部署修复方案

## 问题分析

根据错误信息，我们遇到两个主要问题：

1. **环境变量解析错误**：
   ```
   WARNING: Python-dotenv could not parse statement starting at line 1
   ```

2. **Docker镜像拉取超时**：
   ```
   ERROR: Get "https://registry-1.docker.io/v2/": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
   ```

## 解决方案

### 1. 修复环境变量文件格式

创建一个简化的环境变量文件，确保Python-dotenv可以正确解析：

```bash
# 登录服务器后执行以下命令
cd /opt/ethereum-attendance/check

# 备份原有的环境变量文件
cp .env .env.bak
cp server/.env server/.env.bak

# 创建修复后的环境变量文件
echo 'NODE_ENV="development"
LOG_LEVEL="info"
ETHEREUM_NETWORK="development"
ETHEREUM_RPC_URL="http://ethereum-node:8545"
CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BACKEND_PORT="3001"
FRONTEND_PORT="80"
ETHEREUM_PORT="8545"
ETHEREUM_WS_PORT="8546"' > .env

# 创建服务器端修复的环境变量文件
echo 'ETHEREUM_RPC_URL="http://ethereum-node:8545"
CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PORT="3001"
NODE_ENV="development"' > server/.env
```

### 2. 配置阿里云Docker镜像加速器

阿里云服务器访问Docker Hub通常较慢或可能被限制，需要配置阿里云的Docker镜像加速器：

```bash
# 登录服务器后执行以下命令配置Docker镜像加速器

# 创建或编辑Docker配置文件
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://registry.cn-hangzhou.aliyuncs.com", "https://docker.mirrors.ustc.edu.cn", "https://hub-mirror.c.163.com"]
}
EOF

# 重启Docker服务以应用配置
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证Docker服务状态
sudo systemctl status docker
```

### 3. 修改docker-compose.yml使用本地构建方式（避免拉取镜像）

修改docker-compose.yml文件，使用本地构建而不是拉取镜像，或者使用已有的本地镜像：

```bash
# 登录服务器后执行以下命令修改docker-compose.yml

# 备份原文件
cp docker-compose.yml docker-compose.yml.bak

# 修改文件，使用本地构建或已有的镜像
sudo nano docker-compose.yml
```

在docker-compose.yml中，将ethereum-node服务修改为使用本地构建或者使用更轻量的镜像：

```yaml
# 修改前
ethereum-node:
  image: ethereum/client-go:stable
  # 其他配置...

# 修改后（使用轻量镜像或本地构建）
ethereum-node:
  # 选项1：使用更轻量的镜像
  image: ethereum/client-go:alltools-latest
  # 或者选项2：使用本地构建（如果有Dockerfile）
  # build: ./ethereum-node
  # 其他配置保持不变...
```

### 4. 使用一键部署脚本（已修复）

运行我们之前创建的修复脚本，但这次会优先使用本地构建：

```bash
# 登录服务器后执行
cd /opt/ethereum-attendance/check

# 拉取最新的修复代码
git pull

# 确保脚本有执行权限
chmod +x fix-deployment.sh

# 执行修复脚本（现在会使用配置好的镜像加速器）
./fix-deployment.sh
```

### 5. 如果仍然遇到拉取问题，使用完全本地化的解决方案

如果Docker Hub仍然无法访问，可以使用以下本地化解决方案：

```bash
# 登录服务器后执行
cd /opt/ethereum-attendance/check

# 创建一个使用本地开发模式的环境变量文件
echo 'ETHEREUM_NETWORK="localhost"
ETHEREUM_RPC_URL="http://127.0.0.1:8545"' >> .env

# 修改docker-compose.yml，注释掉ethereum-node服务，使用本地开发节点
# 然后单独启动后端和前端
docker-compose up -d backend frontend
```

## 验证部署

部署后，使用以下命令验证服务状态：

```bash
# 查看所有容器状态
docker-compose ps

# 检查容器日志
docker-compose logs -f

# 如果服务正常启动，测试API连接
curl -X GET http://localhost:3001/api/health
```

## 网络问题排查

如果仍然遇到网络问题，可以尝试以下排查步骤：

```bash
# 测试网络连接
ping -c 4 google.com

# 测试DNS解析
nslookup registry-1.docker.io

# 测试Docker Hub连接
docker run --rm hello-world
```

## 防火墙配置（如需要）

确保阿里云服务器的安全组配置允许相关端口：

```bash
# 检查开放的端口
sudo netstat -tuln

# 配置ufw防火墙（如需要）
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 8545/tcp
sudo ufw allow 8546/tcp
sudo ufw enable
```

请按照以上步骤依次操作，特别注意配置阿里云Docker镜像加速器，这通常能解决拉取超时的问题。