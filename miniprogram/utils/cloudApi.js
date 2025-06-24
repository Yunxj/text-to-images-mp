// 云开发API调用工具
// 替代原有的HTTP API调用方式

// 通用云函数调用方法
function callCloudFunction(name, action, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data: {
        action,
        data
      },
      success: (res) => {
        console.log(`云函数 ${name}/${action} 调用成功:`, res)
        
        if (res.result.code === 200) {
          resolve(res.result.data)
        } else {
          reject(new Error(res.result.message || '请求失败'))
        }
      },
      fail: (error) => {
        console.error(`云函数 ${name}/${action} 调用失败:`, error)
        reject(new Error('网络请求失败'))
      }
    })
  })
}

// 用户相关API
const userAPI = {
  // 游客登录
  guestLogin(deviceId) {
    return callCloudFunction('login', 'guestLogin', { deviceId })
  },
  
  // 微信登录
  wxLogin(code, userInfo) {
    return callCloudFunction('login', 'wxLogin', { code, userInfo })
  },
  
  // 获取用户信息
  getUserInfo(userId = null) {
    // 如果没有指定userId，尝试从全局获取
    if (!userId) {
      const app = getApp()
      userId = app.globalData.userInfo?.id
    }
    return callCloudFunction('userInfo', 'getUserInfo', { userId })
  },

  // 更新用户信息
  updateUserInfo(data) {
    // 自动添加用户ID
    const app = getApp()
    const userId = app.globalData.userInfo?.id
    return callCloudFunction('userInfo', 'updateUserInfo', { ...data, userId })
  },

  // 更新积分
  updateCredits(amount, operation = 'add', reason = '系统调整') {
    // 自动添加用户ID
    const app = getApp()
    const userId = app.globalData.userInfo?.id
    return callCloudFunction('userInfo', 'updateCredits', {
      amount,
      operation,
      reason,
      userId
    })
  }
}

// AI生成相关API
const aiAPI = {
  // 生成图片
  generateImage(params) {
    // 获取全局用户信息
    const app = getApp()
    const userInfo = app.globalData.userInfo
    
    return callCloudFunction('aiGenerate', 'generate', {
      prompt: params.text,
      character: params.character?.name || '',
      style: params.textType || 'cartoon',
      emotion: params.emotion || '',
      mode: params.mode || 'single',
      userId: userInfo?.id // 传递用户ID
    })
  },
  
  // 获取生成历史
  getHistory(page = 1, pageSize = 10) {
    // 获取全局用户信息
    const app = getApp()
    const userInfo = app.globalData.userInfo
    
    return callCloudFunction('aiGenerate', 'getHistory', {
      page,
      pageSize,
      userId: userInfo?.id // 传递用户ID
    })
  },
  
  // 检查服务状态
  checkServiceStatus() {
    return callCloudFunction('aiGenerate', 'getServiceStatus')
  },

  // 获取每日使用量统计
  getDailyUsage() {
    // 获取全局用户信息
    const app = getApp()
    const userInfo = app.globalData.userInfo
    
    return callCloudFunction('aiGenerate', 'getDailyUsage', {
      userId: userInfo?.id
    })
  }
}

// 作品相关API
const workAPI = {
  // 获取作品列表
  getWorks(page = 1, pageSize = 10) {
    // 获取全局用户信息
    const app = getApp()
    const userInfo = app.globalData.userInfo
    
    return callCloudFunction('workManage', 'getWorks', {
      page,
      pageSize,
      userId: userInfo?.id // 传递用户ID
    })
  },
  
  // 获取单个作品
  getWork(workId) {
    return callCloudFunction('workManage', 'getWork', { workId })
  },

  // 保存作品（收藏/取消收藏）
  saveWork(workId, isFavorite) {
    return callCloudFunction('workManage', 'saveWork', {
      workId,
      isFavorite
    })
  },
  
  // 删除作品
  deleteWork(workId) {
    return callCloudFunction('workManage', 'deleteWork', { workId })
  },

  // 更新作品信息
  updateWork(workId, title) {
    return callCloudFunction('workManage', 'updateWork', {
      workId,
      title
    })
  }
}

// 云存储相关API
const storageAPI = {
  // 上传图片到云存储
  uploadImage(filePath, fileName) {
    return new Promise((resolve, reject) => {
      const cloudPath = `images/${Date.now()}_${fileName}`
      
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: (res) => {
          console.log('图片上传成功:', res)
          resolve({
            fileID: res.fileID,
            cloudPath
          })
        },
        fail: (error) => {
          console.error('图片上传失败:', error)
          reject(new Error('图片上传失败'))
        }
      })
    })
  },

  // 获取文件下载链接
  getFileURL(fileID) {
    return new Promise((resolve, reject) => {
      wx.cloud.getTempFileURL({
        fileList: [fileID],
        success: (res) => {
          if (res.fileList && res.fileList.length > 0) {
            resolve(res.fileList[0].tempFileURL)
          } else {
            reject(new Error('获取文件链接失败'))
          }
        },
        fail: (error) => {
          console.error('获取文件链接失败:', error)
          reject(new Error('获取文件链接失败'))
        }
      })
    })
  },

  // 删除云存储文件
  deleteFile(fileID) {
    return new Promise((resolve, reject) => {
      wx.cloud.deleteFile({
        fileList: [fileID],
        success: (res) => {
          console.log('文件删除成功:', res)
          resolve(res)
        },
        fail: (error) => {
          console.error('文件删除失败:', error)
          reject(new Error('文件删除失败'))
        }
      })
    })
  }
}

// 云数据库相关API（用于简单查询）
const dbAPI = {
  // 获取数据库引用
  getDB() {
    return wx.cloud.database()
  },

  // 获取集合引用
  getCollection(name) {
    return wx.cloud.database().collection(name)
  }
}

// 导出API
module.exports = {
  userAPI,
  aiAPI,
  workAPI,
  storageAPI,
  dbAPI,
  callCloudFunction
} 