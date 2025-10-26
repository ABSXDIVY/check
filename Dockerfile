# 构建智能合约和后端服务的基础镜像
# 使用更稳定的Node.js版本以确保在阿里云环境下可用性
FROM node:16-alpine AS base

# 设置工作目录
WORKDIR /app

# 切换到阿里云的Alpine镜像源以加速构建
RUN echo 'https://mirrors.aliyun.com/alpine/v3.16/main/' > /etc/apk/repositories && \
    echo 'https://mirrors.aliyun.com/alpine/v3.16/community/' >> /etc/apk/repositories

# 安装构建依赖
RUN apk add --no-cache git python3 make g++

# 复制根目录package.json和package-lock.json（使用缓存优化）
COPY package*.json ./

# 安装所有依赖（包括开发依赖）用于编译合约
# 注意：这一步已经包含了hardhat和相关依赖，无需重复安装
RUN npm ci --no-audit --no-fund

# 复制项目文件（排除node_modules等不必要文件）
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY hardhat.config.js ./
COPY .env.example ./

# 创建.env文件并设置必要的环境变量
RUN cp .env.example .env && \
    sed -i 's/GOERLI_URL=.*/GOERLI_URL="http:\/\/localhost:8545"/' .env && \
    sed -i 's/PRIVATE_KEY=.*/PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000001"/' .env && \
    echo "LOCAL_NODE_URL=http://localhost:8545" >> .env

# 编译智能合约
RUN npx hardhat compile --force

# 无需清理node_modules和重新安装生产依赖，因为我们只需要编译后的合约文件
# 这种方法可以避免重复安装依赖，节省构建时间

# === 后端服务镜像 ===
FROM node:16-alpine AS backend

# 保持Node.js版本一致性，避免跨版本兼容性问题
WORKDIR /app

# 切换到阿里云的Alpine镜像源以加速构建
RUN echo 'https://mirrors.aliyun.com/alpine/v3.16/main/' > /etc/apk/repositories && \
    echo 'https://mirrors.aliyun.com/alpine/v3.16/community/' >> /etc/apk/repositories

# 安装必要的依赖
RUN apk add --no-cache curl

# 复制服务器package.json和package-lock.json（使用缓存优化）
COPY server/package*.json ./

# 使用npm ci代替npm install以确保一致性和速度，添加标志进一步加速
RUN npm ci --production --no-audit --no-fund && \
    npm cache clean --force

# 复制编译后的合约文件
COPY --from=base /app/artifacts ./artifacts

# 复制后端源代码
COPY server/src ./src

# 复制.env.example文件（实际部署时需使用真实.env文件）
COPY server/.env.example ./

# 暴露后端服务端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production

# 启动后端服务
CMD ["npm", "start"]

# === 前端服务镜像 ===
FROM node:16-alpine AS frontend

# 保持Node.js版本一致性，避免跨版本兼容性问题
WORKDIR /app

# 切换到阿里云的Alpine镜像源以加速构建
RUN echo 'https://mirrors.aliyun.com/alpine/v3.16/main/' > /etc/apk/repositories && \
    echo 'https://mirrors.aliyun.com/alpine/v3.16/community/' >> /etc/apk/repositories

# 安装构建依赖
RUN apk add --no-cache git python3 make g++

# 复制前端代码和package.json（使用缓存优化）
COPY client/package*.json ./

# 使用npm ci优化安装过程，添加标志加速安装
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# 复制前端源代码
COPY client/ ./

# 构建前端应用
RUN npm run build

# 使用nginx作为前端服务器
FROM nginx:alpine

# 复制构建后的前端文件到nginx
COPY --from=frontend /app/build /usr/share/nginx/html

# 暴露80端口
EXPOSE 80

# 默认命令由nginx镜像提供