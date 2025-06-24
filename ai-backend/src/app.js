const express = require('express');
const cors = require('cors');
const serverlessExpress = require('@codegenie/serverless-express');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/user');
const workRoutes = require('./routes/work');
const uploadRoutes = require('./routes/upload');

// 导入中间件
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// 创建Express应用
const app = express();

// 基础中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static('public'));

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/works', authenticateToken, workRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use(errorHandler);

// 本地开发启动
if (require.main === module && process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}

// Serverless导出
const handler = serverlessExpress({ app });

// 导出配置
module.exports = app;
module.exports.default = app;
module.exports.handler = handler; 