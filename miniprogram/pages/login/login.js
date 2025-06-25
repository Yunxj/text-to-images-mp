Page({
  data: {
    isLoading: false,
    hasUserInfo: false,
    userInfo: null
  },

  onLoad(options) {
    // 检查是否已有用户信息
    this.checkUserLogin()
    
    // 如果有重定向参数，保存起来
    if (options.redirect) {
      this.setData({
        redirectUrl: decodeURIComponent(options.redirect)
      })
    }
    
    // 如果用户已登录，直接跳转到首页
    const app = getApp()
    setTimeout(() => {
      if (app.globalData.userInfo) {
        console.log('用户已登录，跳转到首页')
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }
    }, 500) // 给一点延迟，确保app初始化完成
  },

  // 检查用户登录状态
  checkUserLogin() {
    const app = getApp()
    if (app.globalData.userInfo && app.globalData.userInfo.userType !== 'guest') {
      this.setData({
        hasUserInfo: true,
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 微信授权登录
  async wxLogin() {
    if (this.data.isLoading) return
    
    this.setData({ isLoading: true })
    
    try {
      wx.showLoading({
        title: '授权中...'
      })

      // 直接在这里调用微信登录，不通过app.js间接调用
      // 1. 获取微信登录code
      const loginRes = await wx.login()
      if (!loginRes.code) {
        throw new Error('获取微信登录code失败')
      }

      // 2. 获取用户信息 - 必须在用户点击事件中直接调用
      const userProfile = await wx.getUserProfile({
        desc: '用于完善会员资料'
      })

      wx.hideLoading()
      wx.showLoading({
        title: '登录中...'
      })

      // 3. 调用云函数进行微信登录
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'wxLogin',
          data: {
            code: loginRes.code,
            userInfo: userProfile.userInfo
          }
        }
      })

      wx.hideLoading()

      if (result.result.code === 200) {
        const app = getApp()
        app.globalData.userInfo = result.result.data.userInfo
        wx.setStorageSync('userInfo', app.globalData.userInfo)

        this.setData({
          hasUserInfo: true,
          userInfo: result.result.data.userInfo
        })
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 延迟跳转到首页，让用户看到成功提示
        setTimeout(() => {
          wx.switchTab ? wx.reLaunch({
            url: '/pages/index/index'
          }) : wx.navigateTo({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        throw new Error(result.result.message || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      wx.hideLoading() // 确保hideLoading被调用
      
      let errorMessage = '登录失败，请重试'
      if (error.errMsg && error.errMsg.includes('getUserProfile:fail')) {
        if (error.errMsg.includes('deny')) {
          errorMessage = '您拒绝了授权，无法登录'
        } else if (error.errMsg.includes('user TAP gesture')) {
          errorMessage = '请直接点击登录按钮'
        }
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 游客模式继续
  guestLogin() {
    const app = getApp()
    if (app.globalData.userInfo && app.globalData.userInfo.userType === 'guest') {
      // 已是游客模式，直接跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      })
    } else {
      // 执行游客登录
      app.guestLogin().then(() => {
        wx.showToast({
          title: '以游客身份继续',
          icon: 'success'
        })
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 1000)
      }).catch(error => {
        console.error('游客登录失败:', error)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      })
    }
  },

  // 返回上一页或首页
  navigateBack() {
    if (this.data.redirectUrl) {
      wx.redirectTo({
        url: this.data.redirectUrl
      })
    } else {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    }
  },

  // 查看隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护。使用本小程序即表示您同意我们收集和使用您的个人信息以提供更好的服务。我们承诺严格保护您的个人隐私安全。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 查看用户协议
  showTerms() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用本AI图像生成小程序。使用本服务即表示您同意遵守相关使用条款和规范。请合理使用AI功能，不得生成违法违规内容。',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
}) 