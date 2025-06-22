// 统一错误处理中间件
const errorHandler = (error, req, res, next) => {
  console.error('服务器错误:', error);

  // MongoDB错误处理
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if (error.code === 11000) {
      return res.status(400).json({
        code: 400,
        message: '数据重复，请检查输入'
      });
    }
    return res.status(500).json({
      code: 500,
      message: '数据库操作失败'
    });
  }

  // JWT错误处理
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的访问令牌'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '访问令牌已过期'
    });
  }

  // 验证错误处理
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors: error.errors
    });
  }

  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 400,
      message: '文件大小超过限制'
    });
  }

  // AI服务错误
  if (error.isAIServiceError) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'AI服务调用失败'
    });
  }

  // 自定义业务错误
  if (error.isBusinessError) {
    return res.status(error.statusCode || 400).json({
      code: error.statusCode || 400,
      message: error.message
    });
  }

  // 默认服务器错误
  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
  });
};

// 自定义错误类
class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.isBusinessError = true;
    this.statusCode = statusCode;
  }
}

class AIServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIServiceError';
    this.isAIServiceError = true;
  }
}

module.exports = {
  errorHandler,
  BusinessError,
  AIServiceError
}; 