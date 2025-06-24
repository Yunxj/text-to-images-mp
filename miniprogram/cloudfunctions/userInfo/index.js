// 云函数：用户信息管理
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
      case 'getUserInfo':
        return await getUserInfo(data, wxContext)
      case 'updateUserInfo':
        return await updateUserInfo(data, wxContext)
      case 'updateCredits':
        return await updateCredits(data, wxContext)
      default:
        return {
          code: 400,
          message: '未知的操作类型'
        }
    }
  } catch (error) {
    console.error('用户信息云函数错误:', error)
    return {
      code: 500,
      message: error.message || '服务器内部错误'
    }
  }
}

// 获取用户信息
async function getUserInfo(data, wxContext) {
  const { userId } = data
  
  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在')
  }

  return {
    code: 200,
    data: {
      id: user._id,
      openid: user.openid,
      nickname: user.nickname,
      avatar: user.avatar,
      vipLevel: user.vipLevel || 0,
      credits: user.credits || 0,
      generateCount: user.generateCount || 0,
      userType: user.userType || 'wechat',
      isVip: (user.vipLevel || 0) > 0,
      createdAt: user.createdAt,
      lastLoginTime: user.lastLoginTime
    }
  }
}

// 更新用户信息
async function updateUserInfo(data, wxContext) {
  const { userId, nickname, avatar } = data
  
  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在')
  }

  const updateData = {}
  if (nickname !== undefined) updateData.nickname = nickname
  if (avatar !== undefined) updateData.avatar = avatar
  updateData.updatedAt = new Date()

  await db.collection('users').doc(user._id).update({
    data: updateData
  })

  return {
    code: 200,
    message: '用户信息更新成功',
    data: {
      updated: Object.keys(updateData)
    }
  }
}

// 更新用户积分
async function updateCredits(data, wxContext) {
  const { userId, amount, operation = 'add', reason = '系统调整' } = data
  
  if (!amount || amount <= 0) {
    throw new Error('积分变动数量必须大于0')
  }

  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在')
  }

  // 计算新的积分
  let newCredits
  if (operation === 'add') {
    newCredits = (user.credits || 0) + amount
  } else if (operation === 'subtract') {
    newCredits = Math.max(0, (user.credits || 0) - amount)
  } else {
    throw new Error('无效的操作类型')
  }

  // 更新用户积分
  await db.collection('users').doc(user._id).update({
    data: {
      credits: newCredits,
      updatedAt: new Date()
    }
  })

  // 记录积分变动日志
  await db.collection('creditLogs').add({
    data: {
      userId: user._id,
      openid: user.openid,
      operation,
      amount,
      oldCredits: user.credits || 0,
      newCredits,
      reason,
      createdAt: new Date()
    }
  })

  return {
    code: 200,
    message: '积分更新成功',
    data: {
      oldCredits: user.credits || 0,
      newCredits,
      changed: operation === 'add' ? amount : -amount
    }
  }
} 