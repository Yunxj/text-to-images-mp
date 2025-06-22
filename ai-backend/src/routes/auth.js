const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/sqlite');
const { BusinessError } = require('../middleware/errorHandler');

const router = express.Router();

// 微信小程序登录
router.post('/login', async (req, res, next) => {
  try {
    const { code, userInfo } = req.body;
    
    if (!code) {
      throw new BusinessError('缺少微信登录code');
    }

    // 这里应该调用微信API获取用户信息
    // 现在使用模拟的方式处理
    const mockWxUser = {
      openid: `mock_openid_${Date.now()}`,
      unionid: `mock_unionid_${Date.now()}`,
      session_key: 'mock_session_key'
    };

    const usersCollection = database.collection('users');
    
    // 查找现有用户（使用email作为唯一标识）
    let user = await usersCollection.findOne({ email: `${mockWxUser.openid}@wechat.temp` });
    
    if (!user) {
      // 创建新用户
      user = {
        email: `${mockWxUser.openid}@wechat.temp`, // 临时邮箱
        password: 'wechat_login', // 微信登录无密码
        nickname: userInfo?.nickName || '微信用户',
        avatar: userInfo?.avatarUrl || '',
        vip_level: 0,
        credits: 100 // 新用户赠送积分
      };
      
      const result = await usersCollection.insertOne(user);
      user.id = result.insertedId;
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: user.id || user._id,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id || user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          vipLevel: user.vip_level || 0,
          credits: user.credits || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 刷新token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new BusinessError('缺少刷新令牌');
    }

    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');
    
    const usersCollection = database.collection('users');
    const user = await usersCollection.findOne({ id: decoded.id });
    
    if (!user) {
      throw new BusinessError('用户不存在', 401);
    }

    // 生成新的访问令牌
    const newToken = jwt.sign(
      { 
        userId: user._id,
        openid: user.openid 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      code: 200,
      message: '令牌刷新成功',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '刷新令牌无效或已过期'
      });
    }
    next(error);
  }
});

// 游客登录（可选功能）
router.post('/guest', async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      throw new BusinessError('缺少设备ID');
    }

    const usersCollection = database.collection('users');
    
    // 查找现有游客用户
    let user = await usersCollection.findOne({ device_id: deviceId, user_type: 'guest' });
    
    if (!user) {
      // 创建游客用户
      user = {
        email: `guest_${uuidv4()}@temp.com`,
        password: 'guest_login',
        nickname: `游客${Date.now().toString().slice(-6)}`,
        avatar: '',
        vip_level: 0,
        credits: 10, // 游客限制积分
        device_id: deviceId,
        user_type: 'guest'
      };
      
      const result = await usersCollection.insertOne(user);
      user.id = result.insertedId;
          }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        userType: 'guest'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' } // 游客token有效期较短
    );

    res.json({
      code: 200,
      message: '游客登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          userType: user.user_type,
          vipLevel: user.vip_level,
          credits: user.credits
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 