# 构建智能合约和后端服务的基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制根目录package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 编译智能合约
RUN npx hardhat compile

# === 后端服务镜像 ===
FROM node:18-alpine AS backend

# 设置工作目录
WORKDIR /app

# 复制后端package.json和package-lock.json
COPY server/package*.json ./

# 安装后端依赖
RUN npm install

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
FROM node:18-alpine AS frontend

# 设置工作目录
WORKDIR /app

# 复制前端package.json和package-lock.json
COPY client/package*.json ./

# 安装前端依赖
RUN npm install

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