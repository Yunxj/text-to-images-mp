// 认证相关工具函数
const auth = {
  
  // 检查用户是否已登录
  checkLogin() {
    const app = getApp()
    return app.globalData.userInfo && app.globalData.userInfo.userType !== 'guest'
  },

  // 检查是否为游客模式
  isGuest() {
    const app = getApp()
    return !app.globalData.userInfo || app.globalData.userInfo.userType === 'guest'
  },

  // 获取当前用户信息
  getUserInfo() {
    const app = getApp()
    return app.globalData.userInfo
  },

  // 要求用户登录（如果未登录则跳转到登录页）
  requireLogin(options = {}) {
    if (!this.checkLogin()) {
      const currentPage = getCurrentPages().pop()
      const currentRoute = currentPage ? `/${currentPage.route}` : ''
      
      // 构建重定向URL
      let redirectUrl = currentRoute
      if (options.redirect) {
        redirectUrl = options.redirect
      }
      
      // 跳转到登录页面
      wx.navigateTo({
        url: `/pages/login/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`
      })
      
      return false
    }
    return true
  },

  // 显示登录提示
  showLoginModal(options = {}) {
    const { 
      title = '需要登录', 
      content = '使用此功能需要先登录，是否立即登录？',
      success 
    } = options
    
    wx.showModal({
      title,
      content,
      showCancel: true,
      cancelText: '取消',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          this.requireLogin()
        }
        if (success) {
          success(res)
        }
      }
    })
  },

  // 微信登录（注意：此方法已弃用，请直接在页面中调用登录逻辑）
  // getUserProfile 必须在用户直接点击事件中调用，不能通过工具函数间接调用
  async wxLogin() {
    throw new Error('请直接在页面的点击事件中调用微信登录逻辑，不要通过工具函数间接调用')
  },

  // 游客登录
  async guestLogin() {
    try {
      const app = getApp()
      return await app.guestLogin()
    } catch (error) {
      console.error('游客登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
      throw error
    }
  },

  // 退出登录
  logout() {
    const app = getApp()
    
    // 清除本地存储的用户信息
    wx.removeStorageSync('userInfo')
    
    // 重置全局用户信息
    app.globalData.userInfo = null
    app.globalData.credits = 0
    app.globalData.isVip = false
    
    // 显示提示
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
    
    // 重新执行游客登录
    setTimeout(() => {
      app.guestLogin()
    }, 1000)
  },

  // 检查并获取用户积分
  getCredits() {
    const userInfo = this.getUserInfo()
    return userInfo ? userInfo.credits || 0 : 0
  },

  // 检查用户是否为VIP
  isVip() {
    const userInfo = this.getUserInfo()
    return userInfo ? userInfo.isVip || false : false
  },

  // 更新用户信息
  updateUserInfo(newInfo) {
    const app = getApp()
    if (app.globalData.userInfo) {
      app.globalData.userInfo = { ...app.globalData.userInfo, ...newInfo }
      wx.setStorageSync('userInfo', app.globalData.userInfo)
    }
  }
}

module.exports = auth 