// 简单的Node.js静态服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3005;
const DIRECTORY = path.join(__dirname, 'build');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf'
};

// 创建服务器
const server = http.createServer((req, res) => {
  console.log(`请求: ${req.url}`);
  
  // 处理SPA路由，所有非文件请求都返回index.html
  let filePath = path.join(DIRECTORY, req.url);
  
  // 检查是否是目录
  if (req.url === '/') {
    filePath = path.join(DIRECTORY, 'index.html');
  } else {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果是API请求，返回404
      if (req.url.startsWith('/api')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'API端点不存在' }));
        return;
      }
      // 否则返回index.html用于SPA路由
      filePath = path.join(DIRECTORY, 'index.html');
    }
  }

  // 读取文件
  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.error(`错误: ${error.message}`);
      res.writeHead(500);
      res.end('服务器错误');
      return;
    }

    // 设置MIME类型
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`静态服务器运行在 http://localhost:${PORT}`);
  console.log(`服务器PID: ${process.pid}`);
  console.log(`按 Ctrl+C 停止服务器`);
});

// 捕获退出信号
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 捕获未处理的错误
process.on('uncaughtException', (error) => {
  console.error(`未捕获的错误: ${error.message}`);
  console.error(error.stack);
});