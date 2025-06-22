const jwt = require('jsonwebtoken');
const database = require('../config/sqlite');

// JWT身份验证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 获取用户信息
    const usersCollection = database.collection('users');
    const user = await usersCollection.findOne({ id: decoded.id });
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '访问令牌已过期'
      });
    } else {
      console.error('身份验证错误:', error);
      return res.status(500).json({
        code: 500,
        message: '身份验证失败'
      });
    }
  }
};

// 可选的身份验证中间件（用于某些可以匿名访问的接口）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const usersCollection = database.collection('users');
      const user = await usersCollection.findOne({ id: decoded.id });
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
}; 