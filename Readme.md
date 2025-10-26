# 以太坊考勤系统部署指南

## 一、项目简介

以太坊考勤系统是一个基于区块链技术的去中心化考勤解决方案，使用智能合约确保考勤数据的不可篡改性和透明性。

## 二、服务器环境要求

### 2.1 基本配置
- **操作系统**: Ubuntu 24.04 64-bit
- **CPU**: 2核或以上
- **内存**: 4GB或以上
- **存储**: 50GB SSD
- **网络**: 稳定的互联网连接

### 2.2 系统依赖
- Docker
- Docker Compose
- Git

## 三、服务器环境准备

### 3.1 系统更新与依赖安装

```bash
# 更新系统软件包
apt update
apt upgrade -y

# 安装所需依赖
apt install -y apt-transport-https ca-certificates curl software-properties-common git

# 安装Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt update
apt install -y docker-ce

# 启动Docker服务并设置开机自启
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

<<<<<<< HEAD
#### 三、项目部署

1. **克隆项目代码**：

   ```bash
   # 创建项目目录
    mkdir -p /opt/ethereum-attendance
    cd /opt/ethereum-attendance
    
    # 克隆代码 - 注意：克隆后的主文件夹名是check
    git clone https://github.com/ABSXDIVY/check.git
   ```
2. **环境配置**：

   ```bash
   # 创建环境配置文件 - 完整命令格式
    # 进入check目录
    cd /opt/ethereum-attendance/check
    # 第一个命令复制主环境配置文件
    cp .env.example .env
    # 第二个命令复制服务器环境配置文件
    cp server/.env.example server/.env

   # 编辑服务器环境配置（使用Ubuntu 24.04优化参数）
   nano server/.env
   ```

   在server/.env中填入以下内容：

   ```
   # 以太坊网络配置
   ETHEREUM_RPC_URL=http://ethereum-node:8545

   # 服务器配置 - Ubuntu 24.04优化参数
   PORT=3001
   NODE_ENV=production

   # Ubuntu 24.04特有的网络优化
   SOCKET_TIMEOUT=30000
   CONNECTION_LIMIT=100

   # CORS配置
   ALLOWED_ORIGINS=*
   ```
3. **Ubuntu 24.04专用优化（重要）**：

   ```bash
   # 为Ubuntu 24.04优化Docker性能
    echo '{"default-address-pools":[{"base":"172.20.0.0/16","size":24}]}' > /etc/docker/daemon.json
    systemctl restart docker

   # 为Docker添加用户权限（可选）
   usermod -aG docker $USER
   ```
4. **启动服务**：

   ```bash
   # 在项目目录中执行
    cd /opt/ethereum-attendance/check
    
    # 首先确保创建了环境配置文件（使用修复后的格式）
    cp .env.example .env
    cp server/.env.example server/.env

    # 拉取最新代码以获取环境变量格式修复
    git pull
    
    # 一键启动完整系统（以太坊节点 + 后端 + 前端）
   docker-compose up -d --build

   # 查看启动状态
   docker-compose ps
   ```

   **注意事项：**
   - 如果收到"No containers to restart"错误，说明容器尚未创建，请使用`up -d`而非`restart`命令
   - 环境变量文件现已修复格式，所有值都添加了引号以解决Python-dotenv解析错误
   - 如需停止服务，使用`docker-compose down`
   - 服务完全启动后，可以通过服务器IP地址访问（默认端口80）

#### 四、前端连接服务器配置

##### 4.1 服务器端配置（后端API地址）

1. **修改Docker Compose中的CORS配置**：

   ```bash
   # 编辑docker-compose.yml
    nano /opt/ethereum-attendance/check/docker-compose.yml
   ```

   确保backend服务的环境变量配置正确：

   ```yaml
   environment:
     - NODE_ENV=production
     - ETHEREUM_RPC_URL=http://ethereum-node:8545
     - ALLOWED_ORIGINS=*
     - PORT=3001
   ```
2. **重启后端服务使配置生效**：

   ```bash
   docker-compose restart backend
   ```

##### 4.2 前端连接配置（如果需要单独部署前端）

如果您需要将前端部署在单独的服务器上：

1. **修改前端API连接地址**：

   ```bash
   # 编辑前端API配置文件
    cd /opt/ethereum-attendance/check/client
   cp .env.example .env
   nano .env
   ```

   在.env中填入以下内容：

   ```
   # 后端API地址（使用您的服务器公网IP）
   REACT_APP_API_URL=http://您的服务器IP:3001/api

   # 以太坊RPC节点地址
   REACT_APP_ETHEREUM_RPC_URL=http://您的服务器IP:8545
   ```
2. **重新构建前端**：

   ```bash
   # 安装依赖
   npm install

   # 构建前端
   npm run build

   # 将构建产物复制到Web服务器
   # 例如使用Nginx部署
   ```

#### 五、Ubuntu 24.04 特有的维护与优化

##### 5.1 系统监控与日志管理
=======
### 3.2 优化系统设置
>>>>>>> fdb21fce4b9a067b8ee8a6d4e31b810d7174b8f9

```bash
# 优化系统参数
cat <<EOF >> /etc/sysctl.conf
# 增加最大文件描述符数
fs.file-max = 65536
# 优化虚拟内存
vm.swappiness = 10
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10
EOF

# 应用系统参数
sysctl -p

# 增加用户进程限制
cat <<EOF >> /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
EOF
```

## 四、项目部署

### 4.1 创建项目目录

```bash
# 创建项目目录
mkdir -p /opt/ethereum-attendance
cd /opt/ethereum-attendance
```

### 4.2 克隆代码

```bash
# 克隆代码 - 注意：克隆后的主文件夹名是check
git clone https://github.com/ABSXDIVY/check.git
```

### 4.3 配置环境变量

```bash
# 在项目目录中执行
cd /opt/ethereum-attendance/check

# 创建环境配置文件
cp .env.example .env
cp server/.env.example server/.env
```

### 4.4 启动服务

执行以下命令启动所有服务：

```bash
# 在项目目录中执行
cd /opt/ethereum-attendance/check

# 首先确保创建了环境配置文件（使用修复后的格式）
cp .env.example .env
cp server/.env.example server/.env

# 拉取最新代码以获取环境变量格式修复
git pull

# 一键启动完整系统（以太坊节点 + 后端 + 前端）
docker-compose up -d --build

# 查看启动状态
docker-compose ps
```

**注意事项：**
- 如果收到"No containers to restart"错误，说明容器尚未创建，请使用`up -d`而非`restart`命令
- 环境变量文件现已修复格式，所有值都添加了引号以解决Python-dotenv解析错误
- 如需停止服务，使用`docker-compose down`
- 服务完全启动后，可以通过服务器IP地址访问（默认端口80）

#### 四、前端连接服务器配置

### 4.1 修改前端配置

根据您的部署环境修改前端配置：

```bash
# 编辑前端配置
cd /opt/ethereum-attendance/check/client
nano .env
```

### 4.2 配置反向代理（可选）

如果您想使用域名访问系统，可以配置Nginx作为反向代理：

```bash
# 安装Nginx
apt install -y nginx

# 创建Nginx配置文件
nano /etc/nginx/sites-available/ethereum-attendance
```

配置内容示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置并重启Nginx：

```bash
ln -s /etc/nginx/sites-available/ethereum-attendance /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 五、系统维护

### 5.1 查看日志

```bash
# 查看容器日志
docker-compose logs

# 查看特定容器日志
docker-compose logs ethereum-node
docker-compose logs backend
docker-compose logs frontend
```

### 5.2 更新系统

```bash
# 拉取最新代码
cd /opt/ethereum-attendance/check
git pull

# 重新构建并启动服务
docker-compose up -d --build
```

### 5.3 备份数据

```bash
# 备份以太坊数据
cp -r /opt/ethereum-attendance/check/eth-data /path/to/backup/
```

## 六、故障排除

### 6.1 常见问题

1. **服务无法启动**
   - 检查Docker和Docker Compose是否正确安装
   - 查看容器日志以获取详细错误信息

2. **连接以太坊节点失败**
   - 确保以太坊节点容器正在运行
   - 检查网络配置是否正确

3. **前端无法连接后端**
   - 确认后端服务正在运行
   - 检查CORS配置是否包含前端URL

### 6.2 性能优化

1. **增加资源限制**
   - 根据服务器实际配置调整docker-compose.yml中的资源限制

2. **优化Docker性能**
   - 使用overlay2存储驱动
   - 增加Docker守护进程内存限制

```bash
# 编辑Docker配置
nano /etc/docker/daemon.json
```

配置内容示例：

```json
{
  "storage-driver": "overlay2",
  "default-shm-size": "2G",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
```

重启Docker服务：

```bash
systemctl restart docker
```

## 七、安全注意事项

1. **生产环境部署**
   - 不要在生产环境中使用开发模式的以太坊节点
   - 使用真实的以太坊网络或测试网络
   - 确保私钥安全存储

2. **网络安全**
   - 配置防火墙，只开放必要的端口
   - 使用HTTPS保护通信
   - 定期更新系统和依赖