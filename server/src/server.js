const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ethers = require('ethers');
const path = require('path');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
// 解析CORS域名列表
const corsOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : '*';
app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 以太坊配置
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
let contract;
let signer;

// 尝试连接到合约
if (process.env.CONTRACT_ADDRESS && process.env.PRIVATE_KEY) {
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  // 这里将在路由文件中导入ABI并初始化合约
}

// 导入路由
const apiRoutes = require('./routes/api');

// 使用API路由
app.use('/api', apiRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Network: ${process.env.NODE_ENV}`);
});

module.exports = { app, provider, signer };