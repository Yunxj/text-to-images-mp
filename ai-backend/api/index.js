// Vercel API 入口文件 - 使用Serverless函数方式
module.exports = (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 获取路径
  const { url } = req;
  console.log('收到请求:', req.method, url);

  // 路由处理
  if (url === '/' || url === '') {
    res.status(200).json({
      message: 'AI图片生成后端服务',
      status: 'Running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  } else if (url === '/health' || url.endsWith('/health')) {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      message: 'API服务正常运行'
    });
  } else if (url.startsWith('/api/')) {
    // API路由处理
    res.status(200).json({
      message: 'API路由',
      path: url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else {
    // 404处理
    res.status(404).json({
      code: 404,
      message: 'API接口不存在',
      path: url,
      method: req.method
    });
  }
}; 