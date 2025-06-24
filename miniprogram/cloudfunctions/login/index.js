// 云函数：用户登录
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'wxLogin':
        return await wxLogin(data, wxContext)
      case 'guestLogin':
        return await guestLogin(data, wxContext)
      default:
        return {
          code: 400,
          message: '未知的操作类型'
        }
    }
  } catch (error) {
    console.error('登录云函数错误:', error)
    return {
      code: 500,
      message: error.message || '服务器内部错误'
    }
  }
}

// 微信登录
async function wxLogin(data, wxContext) {
  const { userInfo } = data
  const openid = wxContext.OPENID
  
  if (!openid) {
    throw new Error('无法获取用户OpenID')
  }

  // 查找现有用户
  const userQuery = await db.collection('users').where({
    openid: openid
  }).get()

  let user
  if (userQuery.data.length > 0) {
    // 用户已存在，更新信息
    user = userQuery.data[0]
    await db.collection('users').doc(user._id).update({
      data: {
        nickname: userInfo?.nickName || user.nickname,
        avatar: userInfo?.avatarUrl || user.avatar,
        lastLoginTime: new Date()
      }
    })
  } else {
    // 创建新用户
    const newUser = {
      openid: openid,
      nickname: userInfo?.nickName || '微信用户',
      avatar: userInfo?.avatarUrl || '',
      vipLevel: 0,
      credits: 100, // 新用户赠送积分
      generateCount: 0,
      userType: 'wechat',
      createdAt: new Date(),
      lastLoginTime: new Date()
    }
    
    const result = await db.collection('users').add({
      data: newUser
    })
    
    user = { ...newUser, _id: result._id }
  }

  return {
    code: 200,
    message: '登录成功',
    data: {
      userInfo: {
        id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        vipLevel: user.vipLevel || 0,
        credits: user.credits || 0,
        generateCount: user.generateCount || 0,
        isVip: (user.vipLevel || 0) > 0
      }
    }
  }
}

// 游客登录
async function guestLogin(data, wxContext) {
  const { deviceId } = data
  
  if (!deviceId) {
    throw new Error('缺少设备ID')
  }

  // 查找现有游客用户
  const guestQuery = await db.collection('users').where({
    deviceId: deviceId,
    userType: 'guest'
  }).get()

  let user
  if (guestQuery.data.length > 0) {
    // 游客已存在
    user = guestQuery.data[0]
    await db.collection('users').doc(user._id).update({
      data: {
        lastLoginTime: new Date()
      }
    })
  } else {
    // 创建新游客
    const newGuest = {
      deviceId: deviceId,
      nickname: `游客${Date.now().toString().slice(-6)}`,
      avatar: '',
      vipLevel: 0,
      credits: 10, // 游客限制积分
      generateCount: 0,
      userType: 'guest',
      createdAt: new Date(),
      lastLoginTime: new Date()
    }
    
    const result = await db.collection('users').add({
      data: newGuest
    })
    
    user = { ...newGuest, _id: result._id }
  }

  return {
    code: 200,
    message: '游客登录成功',
    data: {
      userInfo: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        userType: user.userType,
        vipLevel: user.vipLevel || 0,
        credits: user.credits || 0,
        generateCount: user.generateCount || 0,
        isVip: false
      }
    }
  }
} 