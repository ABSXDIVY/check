# 以太坊智能合约签到系统

## 项目简介

以太坊智能合约签到系统是一个基于区块链技术的课堂签到管理平台，利用以太坊区块链的不可篡改性确保签到数据的真实性和可靠性。

**⚠️ 重要提示：无需注册外部服务！** 本系统提供极致简化的部署体验：

- **一键部署**：通过Docker Compose一键启动完整系统，包括内置以太坊节点
- **容错设计**：即使以太坊节点未完全同步，系统也能在备用模式下正常运行
- **零配置**：默认配置已优化，可直接使用，无需注册Infura、Alchemy等外部服务
- **开箱即用**：自动部署合约并初始化测试账户，立即可用的完整功能体验
- **轻量高效**：内置轻量级以太坊节点，资源占用小，启动迅速

## 核心功能特性

### 区块链功能

- 基于以太坊智能合约的学生签到记录存储
- 防篡改的签到数据，确保记录的真实性和完整性
- 学生身份验证和权限管理
- 课程管理和签到时间控制
- 批量签到和单个签到功能
- 签到状态查询功能

### 用户管理功能

- 用户注册功能（支持未注册用户连接钱包后进行注册）
- 注册状态自动检测
- 用户信息验证和存储
- 钱包地址关联
- 注册状态UI反馈
- **紧急访问功能**：支持密钥认证获取管理员或系统权限
  - 使用密钥"admin"获取管理员权限
  - 使用密钥"xjtuse"获取系统最高权限
  - 开发模式下支持模拟响应，无需区块链节点运行

### 技术架构

### 智能合约

- **智能合约**：Solidity 0.8.20
- **开发框架**：Hardhat
- **测试框架**：Mocha & Chai

### 后端

- **服务器**：Node.js + Express
- **以太坊交互**：ethers.js

### 前端

- **框架**：React 18
- **UI组件**：Ant Design
- **状态管理**：React Hooks
- **以太坊交互**：ethers.js
- **路由**：React Router

### 部署

- **容器化**：Docker & Docker Compose
- **依赖管理**：npm

## 项目结构

```
├── contracts/          # Solidity智能合约
│   └── Attendance.sol  # 签到记录智能合约
├── scripts/            # 部署脚本
│   └── deploy.js       # 合约部署脚本
├── test/               # 测试文件
│   └── attendance.test.js  # 合约测试
├── artifacts/          # 编译后的合约文件
├── cache/              # 编译缓存
├── hardhat.config.js   # Hardhat配置
├── package.json        # 项目依赖
├── server/             # 后端服务
│   ├── server.js       # 服务器入口
│   ├── routes/         # API路由
│   ├── controllers/    # 控制器
│   └── utils/          # 工具函数
├── client/             # 前端应用
│   ├── public/         # 静态资源
│   ├── src/            # 源代码
│   │   ├── components/ # UI组件
│   │   ├── pages/      # 页面组件
│   │   └── services/   # API服务
│   └── package.json    # 前端依赖
├── Dockerfile          # Docker构建文件
├── docker-compose.yml  # Docker Compose配置
├── .env.example        # 环境变量示例
└── Readme.md           # 项目说明文档
```

## 智能合约主要功能

1. **学生管理**

   - 注册学生信息（姓名、学号）
   - 验证学生身份
2. **课程管理**

   - 创建课程（名称、时间范围）
   - 课程激活/停用
   - 注意：为了测试方便，当前版本注释掉了"开始时间必须晚于当前时间"的限制
3. **签到功能**

   - 学生自主签到
   - 管理员批量签到
   - 签到时间范围验证
   - 重复签到防止
4. **查询功能**

   - 检查学生签到状态

## 阿里云部署全流程指南

### Ubuntu 24.04 64位专属部署指南

**为Ubuntu 24.04 LTS 64位系统优化的完整部署流程，包含前端连接配置！**

#### 一、服务器环境准备

1. **阿里云服务器配置**：

   - 选择ECS云服务器，推荐配置：2核4G或以上
   - 操作系统：Ubuntu 24.04 LTS 64位
   - 安全组开放端口：80/tcp、3001/tcp、22/tcp、8545/tcp、30303/tcp
2. **系统更新与依赖安装**：

   ```bash
   # 连接服务器后，以root用户执行
   # 更新系统软件包
   apt update && apt upgrade -y

   # 安装必要的基础软件
   apt install -y apt-transport-https ca-certificates curl software-properties-common git

   # 优化系统参数（可选）
   sysctl -w net.ipv4.tcp_fin_timeout=30
   sysctl -w vm.swappiness=10
   ```

#### 二、Docker与Docker Compose安装

```bash
# 安装Docker（Ubuntu 24.04专用命令）
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io

# 启动Docker服务并设置开机自启
systemctl enable docker && systemctl start docker

# 安装Docker Compose（最新版本）
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 三、项目部署

1. **克隆项目代码**：

   ```bash
   # 创建项目目录
   mkdir -p /opt/ethereum-attendance
   cd /opt/ethereum-attendance

   # 克隆代码
   git clone https://github.com/ABSXDIVY/check.git .
   ```
2. **环境配置**：

   ```bash
   # 创建环境配置文件 - 完整命令格式
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
   cd /opt/ethereum-attendance

   # 一键启动完整系统（以太坊节点 + 后端 + 前端）
   docker-compose up -d

   # 查看启动状态
   docker-compose ps
   ```

#### 四、前端连接服务器配置

##### 4.1 服务器端配置（后端API地址）

1. **修改Docker Compose中的CORS配置**：

   ```bash
   # 编辑docker-compose.yml
   nano docker-compose.yml
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
   cd client
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

```bash
# 安装监控工具
apt install -y htop glances

# 设置日志轮转（Ubuntu 24.04优化）
cat > /etc/logrotate.d/docker-containers << 'EOF'
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  delaycompress
  missingok
  copytruncate
}
EOF
```

##### 5.2 防火墙配置（Ubuntu 24.04 ufw）

```bash
# 启用防火墙
ufw enable

# 开放必要端口
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 3001/tcp
ufw allow 8545/tcp
ufw allow 30303/tcp

# 查看防火墙状态
ufw status
```

##### 5.3 自动更新设置

```bash
# 配置自动安全更新
apt install -y unattended-upgrades

dpkg-reconfigure -plow unattended-upgrades
```

#### 六、常见问题与故障排除（Ubuntu 24.04专用）

##### 6.1 Docker相关问题

```bash
# 如果Docker服务无法启动
systemctl status docker
journalctl -xeu docker.service

# 解决Docker网络问题（Ubuntu 24.04常见）
ip link set docker0 down
brctl delbr docker0
systemctl restart docker
```

##### 6.2 以太坊节点连接问题

```bash
# 检查节点是否正常运行
docker exec -it ethereum-node curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

# 查看以太坊节点日志
docker logs -f ethereum-node
```

##### 6.3 前端连接后端失败

```bash
# 检查后端服务状态
docker-compose ps backend

# 查看后端API是否可访问
curl http://localhost:3001/api/health

# 检查网络连通性
netstat -tuln | grep 3001
```

### Windows Server部署指南（适合Windows用户）

**专为Windows用户优化的部署方案，无需熟悉Linux命令！**

1. **阿里云Windows服务器准备**：

   - 登录阿里云控制台，选择ECS云服务器
   - 操作系统选择：Windows Server 2019/2022 数据中心版
   - 推荐配置：2核4G或以上
   - 安全组开放端口：80/tcp、3001/tcp、22/tcp、8545/tcp、30303/tcp
2. **环境配置**：

   ```powershell
   # 以管理员身份运行PowerShell
   # 安装Git
   winget install --id Git.Git -e --source winget

   # 安装Docker Desktop for Windows
   # 访问 https://www.docker.com/products/docker-desktop 下载并安装
   # 安装完成后重启系统
   ```
3. **部署项目**：

   ```powershell
   # 创建项目目录
   mkdir C:\ethereum-attendance
   cd C:\ethereum-attendance

   # 克隆代码（如果能访问GitHub）
   git clone 您的代码仓库URL .

   # 或者手动复制代码到该目录
   ```
4. **启动服务**：

   ```powershell
   # 以管理员身份运行PowerShell
   cd C:\ethereum-attendance

   # 启动Docker Desktop（已安装并运行则跳过）
   & "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   Start-Sleep -Seconds 30

   # 启动所有服务
   docker-compose up -d
   ```
5. **验证部署**：

   ```powershell
   # 检查服务状态
   docker-compose ps

   # 访问应用 - 浏览器访问: http://localhost 或 http://您的服务器IP
   ```

### 方案一：【推荐】简易一键部署（无需注册任何外部服务）

**⚠️ 无需注册Infura、Alchemy或购买ETH测试币！** 这是最简单的部署方式，适合所有用户。

1. **阿里云服务器准备**：

   - 登录阿里云控制台，选择ECS云服务器
   - 推荐配置：2核4G或以上，Ubuntu 20.04 LTS 64位
   - 安全组开放端口：80/tcp、3001/tcp、22/tcp、8545/tcp、30303/tcp
2. **环境配置（一键安装）**：

   ```bash
   # 更新系统并安装所有必要软件
   sudo apt update && sudo apt upgrade -y && sudo apt install git -y

   # 一键安装Docker和Docker Compose
   curl -fsSL https://get.docker.com | sudo sh
   sudo systemctl enable docker && sudo systemctl start docker
   ```
3. **部署项目（两步完成）**：

   ```bash
   # 创建目录并克隆代码
   mkdir -p ~/ethereum-attendance && cd ~/ethereum-attendance
   git clone 您的代码仓库URL .

   # 一键启动完整系统
   sudo docker-compose up -d
   ```
4. **验证部署**：

   ```bash
   # 检查服务状态
   sudo docker-compose ps

   # 访问应用 - 启动后约2分钟即可使用
   # 浏览器访问: http://您的服务器IP
   ```

**系统特性：**

- **内置轻量级以太坊节点**：无需外部服务，自动在服务器本地运行
- **自动部署合约**：系统启动时自动部署智能合约，无需手动操作
- **容错设计**：即使以太坊节点未完全同步，系统也能在备用模式下正常运行
- **内置测试账户**：自动生成10个测试账户，每个账户拥有10000 ETH测试币
- **自动恢复机制**：服务异常时会自动重启，确保系统稳定运行

**使用提示：**

- 首次启动后约2分钟即可访问系统使用基础功能
- 无需等待区块链完全同步，系统已优化为边同步边可用
- 内置的以太坊节点资源占用小，适合2核4G配置的云服务器

### 方案二：标准部署（适合进阶用户）

如果您需要连接到公共以太坊网络或已拥有Infura/Alchemy账户，可以选择此方案。

1. **阿里云服务器准备**：

   - 登录阿里云控制台，选择ECS云服务器
   - 推荐配置：2核4G或以上，Ubuntu 20.04 LTS 64位
   - 安全组开放端口：80/tcp、3001/tcp、22/tcp
2. **环境配置**：

   ```bash
   # 更新系统并安装软件
   sudo apt update && sudo apt upgrade -y && sudo apt install git -y

   # 安装Docker和Docker Compose
   curl -fsSL https://get.docker.com | sudo sh
   sudo systemctl enable docker && sudo systemctl start docker
   ```
3. **克隆项目代码**：

   ```bash
   mkdir -p ~/ethereum-attendance && cd ~/ethereum-attendance
   git clone 您的代码仓库URL .
   ```
4. **配置环境变量**：

   ```bash
   # 编辑后端环境配置文件
   cd server
   cp .env.example .env
   nano .env
   ```

   在.env文件中填入：

   ```dotenv
   # 以太坊网络配置（使用您的Infura/Alchemy API URL）
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/您的API密钥
   CONTRACT_ADDRESS=您部署的合约地址
   PRIVATE_KEY=您的钱包私钥

   # 服务器配置
   PORT=3001
   NODE_ENV=production

   # CORS配置
   ALLOWED_ORIGINS=http://您的服务器IP
   ```
5. **修改Docker Compose配置**：

   ```bash
   # 返回项目根目录
   cd ..

   # 编辑docker-compose.yml文件，注释掉ethereum-node服务部分
   nano docker-compose.yml
   ```
6. **启动服务**：

   ```bash
   # 仅启动后端和前端服务
   sudo docker-compose up -d backend frontend
   ```
7. **验证部署**：

   ```bash
   # 检查服务状态
   sudo docker-compose ps
   ```

## Windows本地开发环境部署

如果您想在本地Windows电脑上开发或测试系统，可以按照以下步骤操作：

1. **环境准备**：

   ```powershell
   # 以管理员身份运行PowerShell
   # 安装Git
   winget install --id Git.Git -e --source winget

   # 安装Node.js（包含npm）
   winget install --id OpenJS.NodeJS -e --source winget

   # 安装Docker Desktop for Windows
   # 访问 https://www.docker.com/products/docker-desktop 下载并安装
   # 安装完成后重启系统
   ```
2. **获取项目代码**：

   ```powershell
   # 克隆代码
   git clone 您的代码仓库URL
   cd 项目目录
   ```
3. **本地开发模式启动**：

   ```powershell
   # 启动Docker Desktop（已安装并运行则跳过）
   & "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   Start-Sleep -Seconds 30

   # 启动完整开发环境（以太坊节点 + 后端 + 前端）
   docker-compose up -d
   ```
4. **Windows特有的故障排除**：

   ```powershell
   # 如果遇到端口占用问题，查找并停止占用端口的进程
   netstat -ano | findstr :80
   taskkill /PID 进程ID /F

   # 如果Docker启动失败，尝试重启Docker服务
   Restart-Service docker
   ```

## 使用Docker Compose部署

### 本地开发环境部署

#### 快速启动（推荐）

```bash
# 一键启动完整系统（以太坊节点 + 后端 + 前端）
docker-compose up -d
```

**特点：**

- 内置轻量级以太坊开发节点，无需外部服务
- 自动部署合约和初始化测试账户
- 系统启动后约2分钟即可使用

#### 查看服务状态

```bash
# 查看所有服务运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并清理所有数据
docker-compose down -v
```

### 开发环境说明

1. **以太坊节点**：使用开发模式运行，资源占用小，启动迅速
2. **测试账户**：自动创建10个测试账户，每个账户拥有10000 ETH测试币
3. **合约部署**：系统启动时自动部署智能合约
4. **容错机制**：即使以太坊节点未准备好，系统也能在备用模式下运行

### 部署优势

- **无需注册外部服务**：内置以太坊开发节点，不需要Infura或Alchemy账号
- **无需购买测试币**：开发节点提供充足的测试ETH
- **零配置启动**：默认配置已优化，可直接使用
- **一键部署**：简单命令完成全部部署流程
- **本地运行**：完全本地化运行，不依赖外部网络连接
- **轻量高效**：针对开发环境优化，资源占用小

## 注意事项

1. **首次启动时间**：系统首次启动时需要初始化以太坊节点和部署合约，约需2分钟准备时间
2. **资源要求**：推荐2核4G配置以上的服务器以获得最佳体验
3. **端口占用**：请确保服务器未被其他服务占用以下端口：80、3001、8545、30303
4. **自动恢复**：Docker服务配置了健康检查和自动重启机制，确保系统稳定运行
5. **开发模式限制**：内置的以太坊开发节点生成的链上数据在容器重启后不会持久化，仅适用于开发和演示环境

## 系统使用

部署完成后，您可以通过以下方式访问系统：

1. **管理员功能**：访问系统后使用密钥"admin"获取管理员权限
2. **系统权限**：使用密钥"xjtuse"获取最高系统权限
3. **学生功能**：普通用户可直接使用学生签到功能

## 技术支持

如遇到部署或使用问题，请检查以下项目：

1. 确认服务器防火墙已开放必要端口
2. 检查Docker服务是否正常运行
3. 查看容器日志以获取详细错误信息：`docker-compose logs -f`

## 部署架构说明

系统采用Docker Compose实现多容器协同部署：

- **以太坊节点容器**：运行内置的轻量级以太坊开发节点，提供区块链服务
- **后端服务容器**：Node.js应用，提供API接口，连接以太坊节点
- **前端服务容器**：Nginx服务器，托管React前端应用
- **网络配置**：使用Docker bridge网络连接所有服务容器

## 常见问题解答

**Q: 系统启动后多久可以使用？**
A: 首次启动约需2分钟准备时间，包括初始化以太坊节点和部署智能合约。

**Q: 是否需要购买ETH测试币？**
A: 不需要！内置的以太坊开发节点会自动生成测试账户，每个账户拥有10000 ETH测试币。

**Q: 为什么使用开发模式而不是公共测试网？**
A: 开发模式提供更快的启动时间、更低的资源占用，适合快速部署和演示环境，无需等待区块链同步。

**Q: 部署后如何访问系统？**
A: 在浏览器中输入 `http://您的服务器IP` 即可访问系统。

**Q: 系统支持哪些浏览器？**
A: 支持所有现代浏览器，包括Chrome、Firefox、Edge等最新版本。

## 项目维护

如需对项目进行维护或扩展，请参考以下建议：

1. **定期更新**：保持Docker镜像和依赖包的更新
2. **监控日志**：定期检查系统日志以发现潜在问题
3. **数据备份**：对于生产环境，建议实现数据备份机制
4. **性能监控**：监控系统资源使用情况，确保性能稳定
5. **安全审计**：定期进行安全审计，确保系统安全

## 许可证

本项目采用MIT许可证开源。

### 本地开发环境部署

如果需要在本地开发环境中运行完整服务：

```bash
# 修改环境变量为开发模式
NODE_ENV=development docker-compose up -d
```

### 停止和清理服务

```bash
# 停止服务
docker-compose down

# 清理未使用的镜像和卷
docker system prune -f
```

## 阿里云部署全流程指南

### 方案一：【推荐】简易一键部署（无需注册任何外部服务）

**⚠️ 无需注册Infura、Alchemy或购买ETH测试币！** 这是最简单的部署方式，适合所有用户。

1. **阿里云服务器准备**：

   - 登录阿里云控制台，选择ECS云服务器
   - 推荐配置：2核4G或以上，Ubuntu 20.04 LTS 64位
   - 安全组开放端口：80/tcp、3001/tcp、22/tcp、8545/tcp、30303/tcp
2. **环境配置（一键安装）**：

   ```bash
   # 更新系统并安装所有必要软件
   sudo apt update && sudo apt upgrade -y && sudo apt install git -y

   # 一键安装Docker和Docker Compose
   curl -fsSL https://get.docker.com | sudo sh
   sudo systemctl enable docker && sudo systemctl start docker
   ```
3. **部署项目（两步完成）**：

   ```bash
   # 创建目录并克隆代码
   mkdir -p ~/ethereum-attendance && cd ~/ethereum-attendance
   git clone 您的代码仓库URL .

   # 一键启动完整系统
   sudo docker-compose up -d
   ```
4. **验证部署**：

   ```bash
   # 检查服务状态
   sudo docker-compose ps

   # 访问应用 - 启动后约2分钟即可使用
   # 浏览器访问: http://您的服务器IP
   ```

**系统特性：**

- **内置轻量级以太坊节点**：无需外部服务，自动在服务器本地运行
- **自动部署合约**：系统启动时自动部署智能合约，无需手动操作
- **容错设计**：即使以太坊节点未完全同步，系统也能在备用模式下正常运行
- **内置测试账户**：自动生成10个测试账户，每个账户拥有10000 ETH测试币
- **自动恢复机制**：服务异常时会自动重启，确保系统稳定运行

**使用提示：**

- 首次启动后约2分钟即可访问系统使用基础功能
- 无需等待区块链完全同步，系统已优化为边同步边可用
- 内置的以太坊节点资源占用小，适合2核4G配置的云服务器

### 方案二：标准部署（适合进阶用户）

如果您需要连接到公共以太坊网络或已拥有Infura/Alchemy账户，可以选择此方案。

1. **阿里云服务器准备**：

   - 登录阿里云控制台，选择ECS云服务器
   - 推荐配置：2核4G或以上，Ubuntu 20.04 LTS 64位
   - 安全组开放端口：80/tcp、3001/tcp、22/tcp
2. **环境配置**：

   ```bash
   # 更新系统并安装软件
   sudo apt update && sudo apt upgrade -y && sudo apt install git -y

   # 安装Docker和Docker Compose
   curl -fsSL https://get.docker.com | sudo sh
   sudo systemctl enable docker && sudo systemctl start docker
   ```
3. **克隆项目代码**：

   ```bash
   mkdir -p ~/ethereum-attendance && cd ~/ethereum-attendance
   git clone 您的代码仓库URL .
   ```
4. **配置环境变量**：

   ```bash
   # 编辑后端环境配置文件
   cd server
   cp .env.example .env
   nano .env
   ```

   在.env文件中填入：

   ```dotenv
   # 以太坊网络配置（使用您的Infura/Alchemy API URL）
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/您的API密钥
   CONTRACT_ADDRESS=您部署的合约地址
   PRIVATE_KEY=您的钱包私钥

   # 服务器配置
   PORT=3001
   NODE_ENV=production

   # CORS配置
   ALLOWED_ORIGINS=http://您的服务器IP
   ```
5. **修改Docker Compose配置**：

   ```bash
   # 返回项目根目录
   cd ..

   # 编辑docker-compose.yml文件，注释掉ethereum-node服务部分
   nano docker-compose.yml
   ```
6. **启动服务**：

   ```bash
   # 仅启动后端和前端服务
   sudo docker-compose up -d backend frontend
   ```
7. **验证部署**：

   ```bash
   # 检查服务状态
   sudo docker-compose ps
   ```

### 部署后操作

1. **查看服务日志**：

   ```bash
   sudo docker-compose logs -f
   ```
2. **停止服务**：

   ```bash
   sudo docker-compose down
   ```
3. **更新项目**：

   ```bash
   cd ~/ethereum-attendance
   git pull
   sudo docker-compose down
   sudo docker-compose up -d --build
   ```

### 常见问题排查

1. **以太坊节点同步慢**：

   - 方案一使用内置节点时，首次同步需要较长时间
   - 可以考虑增加服务器配置或切换到方案二
2. **服务无法启动**：

   - 检查端口是否被占用
   - 查看日志确认错误原因
   - 验证配置文件是否正确

### 六、域名配置（可选）

1. **购买域名**：

   - 在阿里云域名服务中购买合适的域名
   - 完成域名实名认证
2. **配置DNS解析**：

   - 进入阿里云域名控制台
   - 添加A记录，将域名指向您的服务器IP地址
   - 等待DNS生效（通常需要10-30分钟）
3. **配置HTTPS**（推荐）：
   使用Certbot为Nginx配置免费的SSL证书：

   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx -y

   # 获取SSL证书
   sudo certbot --nginx -d 您的域名
   ```

   按照提示完成配置，Certbot会自动更新Nginx配置。
4. **更新前端配置**：
   确保前端应用中的API请求地址使用域名而不是IP地址。

### 七、监控与维护

1. **设置定时备份**：

   ```bash
   # 创建备份脚本
   nano ~/backup.sh
   ```

   脚本内容示例：

   ```bash
   #!/bin/bash
   TIMESTAMP=$(date +"%Y%m%d%H%M%S")
   BACKUP_DIR="/home/ubuntu/backups"
   mkdir -p $BACKUP_DIR
   cd ~/projects/ethereum-attendance
   docker-compose down
   tar -czf $BACKUP_DIR/ethereum-attendance-$TIMESTAMP.tar.gz .
   docker-compose up -d
   # 保留最近7天的备份
   find $BACKUP_DIR -name "ethereum-attendance-*.tar.gz" -mtime +7 -delete
   ```

   设置定时任务：

   ```bash
   chmod +x ~/backup.sh
   crontab -e
   ```

   添加以下内容（每天凌晨3点执行备份）：

   ```
   0 3 * * * /home/ubuntu/backup.sh
   ```
2. **监控系统状态**：

   ```bash
   # 监控系统资源使用情况
   sudo apt install htop -y
   htop

   # 监控Docker容器状态
   sudo docker stats
   ```
3. **更新项目**：

   ```bash
   # 拉取最新代码
   cd ~/projects/ethereum-attendance
   git pull

   # 重新构建并启动服务
   sudo docker-compose down
   sudo docker-compose up -d --build
   ```

### 八、常见问题排查

1. **服务无法启动**：

   - 检查Docker Compose配置
   - 查看日志确认错误原因
   - 验证端口是否被占用
2. **合约连接失败**：

   - 确认Infura API密钥有效
   - 验证私钥格式正确
   - 检查网络连接和防火墙设置
3. **前端无法访问后端API**：

   - 确认CORS配置正确
   - 检查后端服务是否正常运行
   - 验证网络连接和端口配置

### 九、安全建议

1. **定期更新系统和依赖**：

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. **限制SSH访问**：

   - 配置密钥登录，禁用密码登录
   - 修改默认SSH端口
   - 使用防火墙限制SSH访问IP
3. **保护敏感信息**：

   - 不要将私钥提交到代码仓库
   - 考虑使用阿里云KMS等密钥管理服务
   - 定期轮换密钥和凭证
4. **配置防火墙**：

   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 3001/tcp
   ```

## 权限系统说明

### 权限级别

1. **用户级别 (ACCESS_LEVEL_USER)** - 默认访问级别
2. **管理员级别 (ACCESS_LEVEL_ADMIN)** - 可执行管理操作
3. **系统级别 (ACCESS_LEVEL_SYSTEM)** - 最高权限级别

### 权限管理功能

1. **合约所有者权限**：

   - 添加/移除管理员
   - 转移合约所有权
   - 撤销紧急访问权限
2. **管理员权限**：

   - 注册学生
   - 更新学生信息
   - 创建课程
   - 激活/停用课程
   - 手动签到
   - 批量签到
   - 生成测试数据
3. **紧急访问功能**：

   - 使用密钥"admin"获取管理员权限
   - 使用密钥"xjtuse"获取系统最高权限

### 权限检查实现

系统通过智能合约中的权限修饰器实现访问控制：

- `onlyOwner` - 仅合约所有者可访问
- `onlyAdmin` - 管理员或所有者可访问
- `onlySystem` - 系统管理员可访问
- `onlyRegisteredStudent` - 已注册学生可访问

### 生产环境注意事项

1. **私钥安全**：确保私钥不被泄露，考虑使用密钥管理服务
2. **环境设置**：确保NODE_ENV设置为production以使用真实合约
3. **权限控制**：生产环境中将严格遵循智能合约的权限设置
4. **日志监控**：部署后监控系统日志，及时发现并处理异常

## 故障排查

### 常见问题

1. **合约连接失败**：

   - 检查ETHEREUM_RPC_URL是否正确
   - 确认私钥和合约地址配置正确
   - 验证网络连接状态
2. **权限错误**：

   - 确保使用的钱包地址具有正确的权限级别
   - 检查合约中的管理员设置
   - 尝试使用紧急访问功能获取权限
3. **学生数据不显示**：

   - 确保学生已正确注册
   - 验证查询权限是否正确
   - 检查前端请求是否正确发送

## 安全最佳实践

1. 生产环境中移除所有测试账号和默认密钥
2. 定期更新依赖包以修复安全漏洞
3. 使用HTTPS协议保护传输层安全
4. 实现请求频率限制防止DoS攻击
5. 定期备份重要数据

## 重要更新说明

- **错误消息国际化**：所有错误消息已从中文改为英文，以避免Solidity编译问题
- **测试兼容性**：更新了测试代码以兼容ethers.js v6语法
- **以太坊节点持久化**：添加了节点自动重启和持久运行机制
- **用户注册信息保存修复**：在开发模式下实现了内存存储机制，解决了注册后信息丢失的问题
  - 添加了 `devModeUsersStore`内存存储对象
  - 修改了 `registerUser`函数，在开发模式下保存用户信息
  - 更新了 `getUserInfo`和 `checkUserRegistration`函数，从内存存储中读取用户数据
  - 确保开发环境下用户注册状态能够正确持久化和查询

## 以太坊节点管理

### 启动持久化节点

项目提供了专用脚本来确保以太坊开发节点持续运行：

```bash
# 在项目根目录运行
powershell -ExecutionPolicy Bypass -File start-eth-node.ps1
```

### 节点特性

- **自动重启**：如果节点意外关闭，将自动在5秒后重启
- **日志记录**：所有节点活动记录到 `logs/node.log`文件
- **开发环境**：提供10个测试账户，每个账户拥有10000 ETH测试币

### 注意事项

- **不要关闭终端**：保持启动节点的终端窗口处于打开状态
- **检查日志**：如果遇到问题，请查看 `logs/node.log`文件了解详情
- **仅用于开发**：这是开发测试节点，所有账户和私钥都是公开的，仅用于开发和测试环境
- **功能验证**：所有测试用例全部通过，验证了合约的完整性和正确性
- **用户注册功能**：新增用户注册系统，支持未注册用户连接钱包后进行注册
- **注册状态管理**：自动检测用户注册状态并提供相应的UI反馈
- **后端API扩展**：新增用户管理相关API端点
- **学生列表显示修复**：修复了学生列表无法显示的问题，通过在后端实现内存存储机制，实时跟踪已注册的学生地址，确保学生管理页面能够正确显示所有注册学生信息
- **智能合约兼容性**：解决了智能合约不直接支持获取所有学生方法的问题，通过服务器端缓存机制确保功能正常运行
- **API数据响应修复**：修改了 `getAllStudents`函数逻辑，优先从内存存储中获取学生数据，确保 `/api/students`接口能够正确返回已注册的学生列表
- **前端服务稳定性优化**：创建了自定义Node.js静态服务器脚本 `static-server.js`，解决了前端服务启动后一段时间自动退出的问题
- **静态文件部署**：提供了更稳定的前端部署方案，使用构建后的静态文件和自定义静态服务器

## 安装与部署

### 本地开发环境设置

1. **克隆项目**

```bash
git clone <项目仓库地址>
cd ethereum-attendance-system
```

2. **安装依赖**

```bash
# 安装智能合约依赖
npm install

# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
cd ..
```

3. **编译智能合约**

```bash
npm run compile
```

4. **运行测试**

```bash
npm test
```

5. **启动本地以太坊节点**

```bash
npm run node
```

6. **部署合约到本地节点**

在另一个终端中运行：

```bash
npm run deploy:local
```

7. **启动后端服务**

在另一个终端中运行：

```bash
cd server
npm run dev
```

8. **启动前端应用**

**注意：** 直接使用 `npm start`可能会导致前端服务不稳定，建议使用以下推荐的静态服务器方式：

**方式一：使用构建后的静态文件和自定义服务器（推荐）**

```bash
# 1. 构建前端应用
cd client
npm run build

# 2. 使用自定义静态服务器启动（稳定）
node static-server.js
```

**方式二：使用开发服务器（仅用于开发）**

在另一个终端中运行：

```bash
cd client
npm start
```

### Docker容器化部署

1. **构建Docker镜像**

```bash
docker-compose build
```

2. **启动容器**

```bash
docker-compose up -d
```

3. **查看部署状态**

```bash
docker-compose logs deployer
```

4. **停止容器**

```bash
docker-compose down
```

## 项目部署说明

## 后端部署

1. 进入服务器目录

   ```bash
   cd server
   ```
2. 安装依赖

   ```bash
   npm install
   ```
3. 配置环境变量

   - 修改 `.env` 文件中的配置
   - 注意：即使没有以太坊节点运行，系统也能在备用模式下正常工作
4. 启动服务器

   ```bash
   npm start
   ```

## 前端部署

1. 进入客户端目录

   ```bash
   cd client
   ```
2. 安装依赖

   ```bash
   npm install
   ```
3. 构建项目

   ```bash
   npm run build
   ```
4. 使用自定义静态服务器启动前端

   ```bash
   node static-server.js
   ```

   前端将运行在 http://localhost:3005

## 重要更新

### 2024-10-26 角色基础访问控制(RBAC)实现

1. **完整的RBAC权限系统**

   - 实现了三层角色权限架构：合约所有者(Owner) > 管理员(Admin) > 学生(Student)
   - 创建了专用的角色验证中间件，确保API端点的安全访问
   - 所有管理功能都有严格的权限验证
2. **API权限控制**

   - 添加管理员需要管理员权限
   - 移除管理员需要合约所有者权限
   - 创建课程、停用课程需要管理员权限
   - 批量签到需要管理员权限
   - 获取所有学生信息需要管理员权限
   - 获取未签到学生列表需要管理员权限
   - 个人签到和查询功能保持开放访问
3. **权限验证中间件**

   - 创建了 `middleware/auth.js`，包含三个核心中间件：
     - `requireAdminRole`：验证用户是否为管理员或合约所有者
     - `requireOwnerRole`：验证用户是否为合约所有者
     - `requireAuth`：基本身份验证
   - 权限验证与智能合约紧密集成，确保权限检查的准确性和安全性

### 2024-05-15 关键修复

1. **API稳定性增强**

   - 修复了 `/api/students` 端点无法正确返回学生数据的问题
   - 改进了 `/api/ethereum/status` 端点，使其在以太坊网络不可用时仍能返回友好响应
   - 即使本地没有运行以太坊节点(8545端口)，系统也能在备用模式下正常工作
2. **前端服务优化**

   - 实现了稳定的自定义Node.js静态服务器
   - 解决了前端服务自动退出的问题
   - 支持SPA路由，确保页面切换正常
3. **备用模式**

   - 系统设计为可以在没有以太坊网络的情况下使用
   - 学生数据将存储在内存中
   - 前端会自动适应备用模式运行

## 环境变量配置

### 根目录环境变量

复制 `.env.example`文件并重命名为 `.env`，根据实际情况修改配置：

```bash
cp .env.example .env
```

## API接口说明

### 用户管理API

1. **检查用户注册状态**

   - 端点：`POST /api/users/check`
   - 功能：检查指定钱包地址是否已注册，并获取角色信息
   - 请求体：`{"walletAddress": "0x..."}`
   - 响应：`{"success": true, "isRegistered": true/false, "isAdmin": true/false, "isOwner": true/false}`
2. **用户注册**

   - 端点：`POST /api/users/register`
   - 功能：注册新用户
   - 请求体：`{"walletAddress": "0x...", "name": "张三", "email": "student@example.com", "studentId": "20230001"}`
   - 响应：`{"success": true, "message": "用户注册成功", "user": {...}}`
3. **获取用户信息**

   - 端点：`GET /api/users/:address`
   - 功能：获取指定钱包地址的用户信息
   - 响应：`{"success": true, "user": {...}}`
4. **添加管理员**

   - 端点：`POST /api/users/add-admin`
   - **权限要求**：需要管理员权限
   - 功能：将指定钱包地址添加为管理员
   - 请求体：`{"adminAddress": "0x...", "walletAddress": "0x..."}`
   - 响应：`{"success": true, "message": "管理员添加成功"}`
5. **移除管理员**

   - 端点：`POST /api/users/remove-admin`
   - **权限要求**：需要合约所有者权限
   - 功能：移除指定钱包地址的管理员权限
   - 请求体：`{"adminAddress": "0x...", "walletAddress": "0x..."}`
   - 响应：`{"success": true, "message": "管理员移除成功"}`

### 学生管理API

1. **学生注册**

   - 端点：`POST /api/students/register`
   - 功能：在智能合约中注册学生
   - 请求体：`{"studentAddress": "0x...", "name": "张三", "studentId": "20230001"}`
   - 响应：包含交易哈希和学生信息
2. **获取所有学生信息**

   - 端点：`GET /api/students`
   - **权限要求**：需要管理员权限
   - 功能：获取系统中所有已注册的学生信息
   - 响应：学生信息列表
3. **获取未签到学生列表**

   - 端点：`GET /api/students/remaining/:courseId`
   - **权限要求**：需要管理员权限
   - 功能：获取指定课程中尚未签到的学生列表
   - 响应：未签到学生信息列表

### 课程管理API

1. **创建课程**

   - 端点：`POST /api/courses`
   - **权限要求**：需要管理员权限
   - 功能：创建新的签到课程
   - 请求体：`{"name": "数学课后辅导", "startTime": 1699315200, "endTime": 1730851200, "walletAddress": "0x..."}`
2. **获取所有课程**

   - 端点：`GET /api/courses`
   - 功能：获取所有课程列表
3. **停用课程**

   - 端点：`POST /api/courses/:id/deactivate`
   - **权限要求**：需要管理员权限
   - 功能：停用指定课程
   - 请求体：`{"walletAddress": "0x..."}`

### 签到功能API

1. **记录签到**

   - 端点：`POST /api/attendance`
   - 功能：记录单个学生签到
   - 请求体：`{"courseId": "1", "walletAddress": "0x..."}`
2. **批量签到**

   - 端点：`POST /api/attendance/batch`
   - **权限要求**：需要管理员权限
   - 功能：批量记录多个学生签到
   - 请求体：`{"courseId": "1", "studentIds": ["20230001", "20230002"], "walletAddress": "0x..."}`
3. **检查签到状态**

   - 端点：`GET /api/attendance/:studentAddress/:courseId`
   - 功能：检查特定学生在特定课程的签到状态
4. **获取签到记录**

   - 端点：`GET /api/attendance/records/:courseId`
   - **权限要求**：需要管理员权限
   - 功能：获取指定课程的所有签到记录
   - 响应：签到记录列表

主要环境变量说明：

- `GOERLI_URL`：Goerli测试网节点URL（使用Infura或Alchemy）
- `PRIVATE_KEY`：部署合约的以太坊账户私钥
- `LOCAL_NODE_URL`：本地开发节点URL

### 后端环境变量 (server/.env)

创建后端环境变量文件：

```bash
cd server
cp .env.example .env
```

主要环境变量说明：

- `ETHEREUM_RPC_URL`：以太坊RPC节点URL
- `CONTRACT_ADDRESS`：部署的合约地址
- `PRIVATE_KEY`：后端使用的账户私钥
- `PORT`：服务器端口号
- `CORS_ORIGIN`：允许的跨域来源

### 前端环境变量 (client/.env)

创建前端环境变量文件：

```bash
cd ../client
cp .env.example .env
```

主要环境变量说明：

- `REACT_APP_API_URL`：后端API URL
- `REACT_APP_ETHEREUM_RPC_URL`：以太坊RPC节点URL
- `REACT_APP_CONTRACT_ADDRESS`：部署的合约地址
- `REACT_APP_ETHEREUM_CHAIN_ID`：以太坊链ID
- `REACT_APP_APP_NAME`：应用名称

## 智能合约使用说明

### 合约部署后主要操作

1. **注册学生**

   - 调用 `registerStudent(address _student, string _name, string _studentId)`函数
   - 只有合约所有者可以执行
2. **创建课程**

   - 调用 `createCourse(string _name, uint256 _startTime, uint256 _endTime)`函数
   - 返回新创建的课程ID
3. **学生签到**

   - 学生调用 `recordAttendance(uint256 _courseId)`函数
   - 必须在课程时间范围内
   - 每个学生每个课程只能签到一次
4. **批量签到**

   - 管理员调用 `batchRecordAttendance(address[] _students, uint256 _courseId)`函数
   - 可以一次为多个学生签到
5. **查询签到状态**

   - 调用 `checkAttendance(address _student, uint256 _courseId)`函数
   - 返回布尔值表示是否已签到
6. **停用课程**

   - 调用 `deactivateCourse(uint256 _courseId)`函数
   - 停用后学生无法再签到

## 安全考虑

1. **权限控制**：关键操作（注册学生、创建课程、批量签到）仅限管理员执行
2. **数据验证**：所有输入数据都经过严格验证
3. **时间控制**：确保签到只能在规定时间范围内进行
4. **防重复签到**：每个学生每个课程只能签到一次

## 角色权限管理

- 学生：仅可查看和管理自己的签到记录
- 管理员：可管理学生、课程和签到记录，生成测试数据
- 系统管理员：拥有系统全部权限，包括管理员管理和测试数据生成
- 所有者：拥有最高权限，可添加/移除管理员

## 紧急访问系统

- 支持密钥认证获取权限
- 输入密钥"admin"可获取管理员权限
- 输入密钥"xjtuse"可获取系统管理员权限
- 权限证明会记录在区块链上

## 测试数据生成

- 管理员和系统管理员可一键生成测试数据
- 可自定义生成数据数量（1-50条）
- 生成的数据包括随机学生、课程和签到记录

## 测试覆盖

项目包含完整的单元测试，测试内容包括：

- 学生注册功能
- 课程创建功能
- 签到功能
- 批量签到功能
- 课程管理功能
- 权限控制验证

## 部署到测试网

如需部署到Goerli等测试网，请：

1. 在 `.env`文件中配置测试网URL和私钥
2. 在 `hardhat.config.js`中取消注释测试网配置
3. 运行部署命令：
   ```bash
   npx hardhat run scripts/deploy.js --network goerli
   ```

## 未来功能规划

1. 集成身份认证系统
2. 添加数据分析和统计功能
3. 优化智能合约，降低gas费用
4. 支持多校区、多课程类型的扩展
5. 添加移动端支持
6. 实现链下数据存储，降低链上存储成本

## 技术支持

如有任何问题或建议，请提交issue或联系项目维护者。

## 系统使用流程与命令详解

### 本地开发环境使用流程

#### 1. 准备环境

```bash
# 克隆项目（如果尚未克隆）
git clone <项目仓库地址>
cd HK2

# 安装项目依赖
npm install

# 编译智能合约
npx hardhat compile
```

#### 2. 启动本地以太坊节点

```bash
# 方式一：使用npm脚本（如果package.json中已配置）
npm run node

# 方式二：直接使用hardhat命令
npx hardhat node
```

**注意：** 节点启动后会显示多个测试账户及其私钥，这些账户每个都有10000 ETH用于开发测试。第一个账户默认是合约所有者账户。

#### 3. 部署智能合约

**在新的终端窗口中执行：**

```bash
# 部署合约到本地节点
npx hardhat run scripts/deploy.js --network localhost
```

部署成功后会显示合约地址，需要记录此地址用于配置环境变量。

#### 4. 配置环境变量

```bash
# 配置根目录环境变量
cp .env.example .env
# 编辑.env文件，填入相关配置

# 配置后端环境变量
cd server
cp .env.example .env
# 编辑server/.env文件，填入合约地址等配置
cd ..

# 配置前端环境变量
cd client
cp .env.example .env
# 编辑client/.env文件，填入合约地址等配置
cd ..
```

#### 5. 启动后端服务

**在新的终端窗口中执行：**

```bash
cd server
npm install  # 如果尚未安装依赖
npm run dev   # 开发模式启动
```

后端服务默认在3001端口启动。

#### 6. 启动前端应用

**在新的终端窗口中执行：**

```bash
cd client
npm install  # 如果尚未安装依赖
npm start    # 启动React开发服务器
```

前端应用默认在3000端口启动。

#### 7. 连接MetaMask钱包

1. 打开浏览器，访问 http://localhost:3000
2. 确保MetaMask已安装
3. 连接MetaMask到本地开发网络：
   - 网络名称：Localhost 8545
   - RPC URL：http://127.0.0.1:8545
   - 链ID：1337
   - 货币符号：ETH
4. 导入测试账户（使用本地节点启动时显示的私钥）

#### 8. 系统功能使用

- **管理员操作**（使用第一个测试账户）：

  - 注册学生
  - 创建课程
  - 批量签到
  - 管理课程状态
- **学生操作**：

  - 连接钱包
  - 查看已注册课程
  - 进行课程签到
  - 查询签到记录

### Docker容器化部署流程

#### 1. 准备工作

```bash
# 确保Docker和Docker Compose已安装
docker --version
docker-compose --version

# 配置环境变量
cp .env.example .env
# 编辑.env文件，填入相关配置
```

#### 2. 构建和启动容器

```bash
# 构建Docker镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps
```

#### 3. 查看部署日志

```bash
# 查看部署脚本执行情况
docker-compose logs deployer

# 查看后端服务日志
docker-compose logs server

# 查看前端服务日志
docker-compose logs client
```

#### 4. 访问应用

- 前端应用：http://localhost:3000
- 后端API：http://localhost:3001

#### 5. 停止和清理

```bash
# 停止容器
docker-compose down

# 停止并移除所有容器、网络和卷
docker-compose down -v
```

### 智能合约交互命令

#### 编译和测试

```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 查看测试覆盖率
npx hardhat coverage
```

#### 部署和验证

```bash
# 部署到本地网络
npx hardhat run scripts/deploy.js --network localhost

# 部署到测试网（需要配置.env）
# 首先在hardhat.config.js中取消注释测试网配置
npx hardhat run scripts/deploy.js --network goerli
```

### 常见问题与解决方案

#### 1. 部署合约时连接失败

```bash
# 错误：Cannot connect to the network localhost
# 解决方案：确保本地以太坊节点正在运行
npx hardhat node  # 在另一个终端启动节点
```

#### 2. 合约地址未正确配置

```bash
# 问题：应用无法连接到合约
# 解决方案：更新环境变量中的合约地址
# 1. 检查最新部署的合约地址
# 2. 更新server/.env和client/.env中的CONTRACT_ADDRESS
# 3. 重启服务
```

#### 3. MetaMask连接问题

- 确保使用正确的链ID：1337（本地开发）
- 确保RPC URL设置为：http://127.0.0.1:8545
- 如果遇到连接问题，尝试重置账户（设置 > 高级 > 重置账户）

#### 4. 服务启动顺序问题

确保按以下顺序启动服务：

1. 本地以太坊节点
2. 部署智能合约
3. 启动后端服务
4. 启动前端应用

### 系统使用最佳实践

1. **开发前准备**：每次开发前确保重新启动本地节点和部署合约
2. **环境变量管理**：不要将实际私钥提交到代码仓库，使用.gitignore排除.env文件
3. **测试账户使用**：仅在开发环境使用测试账户，不要在主网使用这些账户
4. **定期更新**：定期更新依赖包以修复安全漏洞
5. **备份数据**：开发过程中重要数据应及时备份

## 安全注意事项

- 私钥不应硬编码在代码中，应通过环境变量配置
- 生产环境中应使用安全的RPC节点
- 前端应用部署时应使用HTTPS
- 定期更新依赖包以修复安全漏洞

## 许可证

本项目采用MIT许可证。
