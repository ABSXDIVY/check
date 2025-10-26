# 以太坊考勤系统部署指南

![版本更新] 2023-11-10: 优化Docker构建过程，使用阿里云Alpine镜像源，减少冗余步骤，显著提升构建速度

![版本更新] 2023-11-08: 优化配置文件，解决Docker镜像拉取和构建问题

## 一、项目简介

以太坊考勤系统是一个基于区块链技术的去中心化考勤解决方案，使用智能合约确保考勤数据的不可篡改性和透明性。该系统由三个主要组件构成：

- **以太坊节点**：提供区块链交互能力
- **后端服务**：处理业务逻辑和智能合约交互
- **前端应用**：用户交互界面

## 二、冲突解决工具

本项目提供以下工具帮助解决Git冲突问题：

### 2.1 本地冲突解决

- **local_conflict_resolver.bat** - Windows批处理脚本，提供图形化界面解决本地Git冲突
- **SERVER_LOCAL_GIT_SYNC_FIX.md** - 详细文档说明如何确保本地与服务器同步

### 2.2 服务器冲突解决

- **resolve_conflicts.sh** - 服务器端冲突解决脚本
- **GIT_CONFLICT_RESOLUTION.md** - Git冲突解决通用指南
- **LOCAL_GIT_CONFLICT_RESOLUTION.md** - 本地冲突解决指南

## 三、服务器环境要求

### 3.1 基本配置

- **操作系统**: Ubuntu 24.04 64-bit
- **CPU**: 2核或以上
- **内存**: 4GB或以上
- **存储**: 50GB SSD
- **网络**: 稳定的互联网连接

### 3.2 系统依赖

- Docker
- Docker Compose
- Git

### 3.3 阿里云Docker镜像加速器

为解决Docker拉取镜像超时问题，本项目提供了阿里云镜像加速器配置脚本：

```bash
# 在服务器上执行
chmod +x setup_aliyun_docker_mirror.sh
./setup_aliyun_docker_mirror.sh
```

脚本将自动配置多个阿里云区域的镜像源，并优化Docker性能参数。

**重要更新**: 已优化Dockerfile，将Node.js版本从18-alpine更改为16-alpine，以确保在阿里云环境下的兼容性和稳定性。Node.js 16-alpine在阿里云镜像源中更稳定可用，可有效避免"not found"错误。

**最新优化**:

1. 配置阿里云Alpine镜像源，显著提升构建速度和稳定性
2. 移除Dockerfile中的冗余依赖安装步骤，节省构建时间
3. 优化npm安装命令，添加--no-audit --no-fund参数加速安装
4. 删除不必要的开发依赖清理和重新安装步骤
5. 修复Dockerfile语法错误，确保多行命令正确执行
6. 实现了多阶段构建优化，减小最终镜像体积
7. 创建了.dockerignore文件，排除不必要的文件，提高构建效率
8. 添加了详细的编译错误诊断输出，方便排查问题
9. 创建了冲突解决工具脚本，解决服务器端有修改无法pull的问题

## 三、冲突解决工具

当服务器端有本地修改导致无法执行 `git pull`时，可以使用以下工具安全地处理这种情况：

### Linux/Mac环境使用方法

```bash
# 赋予脚本执行权限
chmod +x fix-server-conflict.sh

# 运行脚本
./fix-server-conflict.sh
```

### Windows环境使用方法

```batch
# 直接运行批处理脚本
fix-server-conflict.bat
```

### 工具功能说明

脚本提供三种处理方式：

1. **保存本地修改到临时分支**：

   - 将当前修改保存到一个以时间戳命名的临时分支
   - 然后强制更新master分支到最新版本
   - 适合需要保留本地修改并在之后进行合并的情况
2. **使用stash暂存**：

   - 使用git stash暂存当前修改
   - 拉取最新代码后再恢复暂存的修改
   - 适合简单的修改场景
3. **放弃所有本地修改**：

   - 永久放弃所有本地修改和未跟踪文件
   - 强制重置到远程仓库的最新版本
   - 谨慎使用！此操作不可恢复

## 四、服务器环境准备

### 4.1 系统更新与依赖安装

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

### 4.2 优化系统设置

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

## 五、项目部署

### 5.1 创建项目目录

```bash
# 创建项目目录
```bash
mkdir -p /opt/ethereum-attendance
cd /opt/ethereum-attendance
```

## 最近更新
- 优化Dockerfile构建过程，修复构建循环问题
- 简化智能合约编译命令，移除可能导致问题的详细调试输出
- 本地验证智能合约编译正常工作
- 修复Dockerfile中.env.example文件未正确复制的问题

### 5.2 克隆代码

```bash
# 克隆代码 - 注意：克隆后的主文件夹名是check
git clone https://github.com/ABSXDIVY/check.git
```

### 5.3 配置环境变量

```bash
# 在项目目录中执行
cd /opt/ethereum-attendance/check

# 创建环境配置文件
cp .env.example .env
cp server/.env.example server/.env
```

### 5.4 配置Ubuntu 24.04优化参数

编辑服务器环境配置文件，填入优化参数：

```bash
nano server/.env
```

配置内容：

```
# 以太坊网络配置
ETHEREUM_RPC_URL=http://ethereum-node:8545

# 服务器配置 - Ubuntu 24.04优化参数
PORT=3001
NODE_ENV=production

# Ubuntu 24.04特有的网络优化
SOCKET_TIMEOUT=30000
CONNECTION_LIMIT=100

# 以太坊连接优化 - 针对阿里云环境
ETH_CONNECTION_RETRIES=5
ETH_CONNECTION_RETRY_DELAY=1000
ETH_CONNECTION_TIMEOUT=5000

# CORS配置
ALLOWED_ORIGINS=*
```

### 5.5 Ubuntu 24.04专用Docker优化

```bash
# 为Ubuntu 24.04优化Docker性能
echo '{"default-address-pools":[{"base":"172.20.0.0/16","size":24}]}' > /etc/docker/daemon.json
systemctl restart docker

# 为Docker添加用户权限（可选）
usermod -aG docker $USER
```

### 5.6 启动服务

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

**重要配置更新**：

1. 已将docker-compose.yml版本从3.8降级为3.7，以提高兼容性
2. 优化了资源限制配置，移除了不支持的CPU保留参数(reservations.cpus)
3. 修改了CPU限制参数格式，从字符串格式('1')改为数字格式(1)

这些优化解决了启动服务时出现的警告和错误，确保系统在阿里云环境中稳定运行。

**注意事项：**

- 如果收到"No containers to restart"错误，说明容器尚未创建，请使用 `up -d`而非 `restart`命令
- 环境变量文件现已修复格式，所有值都添加了引号以解决Python-dotenv解析错误
- 如需停止服务，使用 `docker-compose down`
- 服务完全启动后，可以通过服务器IP地址访问（默认端口80）

## 六、前端连接配置

### 6.1 修改前端配置

如果需要将前端部署在单独的服务器上，修改前端API连接地址：

```bash
# 编辑前端API配置文件
cd /opt/ethereum-attendance/check/client
cp .env.example .env
nano .env
```

配置内容：

```
# 后端API地址（使用您的服务器公网IP）
REACT_APP_API_URL=http://您的服务器IP:3001/api

# 以太坊RPC节点地址
REACT_APP_ETHEREUM_RPC_URL=http://您的服务器IP:8545
```

### 6.2 重新构建前端

```bash
# 安装依赖
npm install

# 构建前端
npm run build
```

### 6.3 配置反向代理（可选）

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

## 七、系统维护

### 7.1 查看日志

```bash
# 查看容器日志
docker-compose logs

# 查看特定容器日志
docker-compose logs ethereum-node
docker-compose logs backend
docker-compose logs frontend
```

### 7.2 更新系统

```bash
# 拉取最新代码
cd /opt/ethereum-attendance/check
git pull

# 重新构建并启动服务
docker-compose up -d --build
```

### 7.3 备份数据

```bash
# 备份以太坊数据
cp -r /opt/ethereum-attendance/check/eth-data /path/to/backup/
```

## 八、故障排除

### 8.1 常见问题

1. **镜像拉取失败 - "not found"错误**

   - 确保已配置阿里云Docker镜像加速器
   - 项目已将Node.js版本从18-alpine更改为16-alpine，提高兼容性
   - 执行 `docker info | grep -A 1 "Registry Mirrors"`确认镜像源配置生效
2. **智能合约编译失败**

   - 确保所有必要的依赖包都已安装
   - Dockerfile已更新为安装完整的开发依赖和Hardhat插件
   - 如遇编译错误，检查solidity版本兼容性（当前使用0.8.20）
   - 查看详细编译日志获取具体错误信息
3. **npm依赖安装警告**

   - 部分依赖包显示废弃警告是正常现象，通常不影响功能
   - 项目已优化npm安装过程，使用npm ci提高稳定性
   - 如果出现依赖错误，确保使用最新的package-lock.json文件
4. **docker-compose警告 - "resources.reservations.cpus"不支持**

   - 项目已修复此问题，移除了不支持的CPU保留参数
   - 确保使用最新版本的docker-compose.yml文件
5. **服务无法启动**

   - 检查Docker和Docker Compose是否正确安装
   - 查看容器日志以获取详细错误信息
   - 确保所有必要的端口未被占用
6. **连接以太坊节点失败**

   - 确保以太坊节点容器正在运行
   - 检查网络配置是否正确
   - 验证ETH_CONNECTION_RETRIES等连接参数设置
7. **前端无法连接后端**

   - 确认后端服务正在运行
   - 检查CORS配置是否包含前端URL
   - 验证REACT_APP_BACKEND_URL环境变量设置正确
8. **服务无法启动**

   - 检查Docker和Docker Compose是否正确安装
   - 查看容器日志以获取详细错误信息
9. **连接以太坊节点失败**

   - 确保以太坊节点容器正在运行
   - 检查网络配置是否正确
10. **前端无法连接后端**

    - 确认后端服务正在运行
    - 检查CORS配置是否包含前端URL

### 8.2 性能优化

1. **优化Docker性能**

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

## 九、安全注意事项

1. **生产环境部署**

   - 不要在生产环境中使用开发模式的以太坊节点
   - 使用真实的以太坊网络或测试网络
   - 确保私钥安全存储
2. **网络安全**

   - 配置防火墙，只开放必要的端口
   - 使用HTTPS保护通信
   - 定期更新系统和依赖

## 十、Docker构建优化

### 10.1 构建优化措施

本项目已实施以下Docker构建优化措施：

1. **使用多阶段构建**:

   - 将智能合约编译和服务构建分离
   - 清理不必要的开发依赖
   - 减小最终镜像体积
2. **优化依赖安装**:

   - 使用 `npm ci`代替 `npm install`，确保版本一致性
   - 清理npm缓存减少镜像大小
   - 安装必要的构建依赖（git、python3、make、g++）
3. **构建上下文优化**:

   - 创建 `.dockerignore`文件排除不必要的文件
   - 选择性地复制文件，避免复制node_modules等大型目录
4. **镜像体积优化**:

   - 使用Alpine基础镜像减小镜像大小
   - 安装最小化的运行时依赖

### 10.2 环境一致性

1. **本地Docker配置**

   - 确保本地Docker版本与服务器兼容
   - 配置适当的镜像源以加速镜像拉取
2. **开发环境设置**

   - 使用相同版本的Node.js (16.x)
   - 保持依赖版本同步
3. **代码同步流程**

   - 本地开发完成后，先在本地构建测试
   - 推送代码前解决所有冲突
   - 更新服务器代码前备份重要数据
4. **部署验证**

   - 部署后验证所有服务是否正常运行
   - 检查日志确保没有错误
