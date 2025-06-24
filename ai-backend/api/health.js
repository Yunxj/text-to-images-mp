// 简单的健康检查API
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    message: 'API服务正常运行'
  });
}; 