// API 基础配置
// ✅ 已配置为实际的Vercel部署地址
// const API_BASE_URL = 'http://localhost:3000/api'  // 开发环境
const API_BASE_URL = 'https://text-to-images-mp-fvep.vercel.app/api'  // 生产环境

// 🎉 配置完成！Vercel URL: https://text-to-images-mp-rotv.vercel.app

// 获取存储的token
function getToken() {
  return wx.getStorageSync('user_token') || null
}

// 设置token
function setToken(token) {
  wx.setStorageSync('user_token', token)
}

// 通用请求方法
function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header = {
      'Content-Type': 'application/json',
      ...(options.header || {})
    }
    
    if (token) {
      header.Authorization = `Bearer ${token}`
    }

    wx.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        console.log('API请求成功:', res)
        
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data.data)
          } else {
            reject(new Error(res.data.message || '请求失败'))
          }
        } else if (res.statusCode === 401) {
          // token过期或无效，清除token并跳转登录
          wx.removeStorageSync('user_token')
          reject(new Error('请先登录'))
        } else {
          reject(new Error(`请求失败 ${res.statusCode}`))
        }
      },
      fail: (error) => {
        console.error('API请求失败:', error)
        reject(new Error('网络请求失败'))
      }
    })
  })
}

// 用户相关API
const userAPI = {
  // 游客登录
  guestLogin() {
    return request({
      url: '/auth/guest',
      method: 'POST',
      data: {
        deviceId: wx.getStorageSync('device_id') || 'default_device_id'
      }
    })
  },
  
  // 微信登录
  wxLogin(code) {
    return request({
      url: '/auth/wx-login',
      method: 'POST',
      data: { code }
    })
  },
  
  // 获取用户信息
  getUserInfo() {
    return request({
      url: '/user/profile',
      method: 'GET'
    })
  }
}

// AI生成相关API
const aiAPI = {
  // 生成图片
  generateImage(params) {
    return request({
      url: '/ai/generate',
      method: 'POST',
      data: {
        prompt: params.text,
        character: params.character?.name || '',
        style: params.textType || 'simple',
        emotion: params.emotion || '',
        mode: params.mode || 'single'
      }
    })
  },
  
  // 获取生成历史
  getHistory(page = 1, pageSize = 10) {
    return request({
      url: `/ai/history?page=${page}&pageSize=${pageSize}`,
      method: 'GET'
    })
  },
  
  // 检查服务状态
  checkServiceStatus() {
    return request({
      url: '/ai/status',
      method: 'GET'
    })
  }
}

// 作品相关API
const workAPI = {
  // 获取作品列表
  getWorks(page = 1, pageSize = 10) {
    return request({
      url: `/work?page=${page}&pageSize=${pageSize}`,
      method: 'GET'
    })
  },
  
  // 保存作品
  saveWork(workData) {
    return request({
      url: '/work',
      method: 'POST',
      data: workData
    })
  },
  
  // 删除作品
  deleteWork(workId) {
    return request({
      url: `/work/${workId}`,
      method: 'DELETE'
    })
  }
}

// 导出API
module.exports = {
  userAPI,
  aiAPI,
  workAPI,
  setToken,
  getToken
} 