// profile.js
Page({
  data: {
    userInfo: {},
    userId: '220497',
    workCount: 1,
    credits: 16,
    isVip: false,
    isGuest: true,
    recentWorks: [],
    showVipModal: false,
    showExchangeModal: false,
    exchangeCode: ''
  },

  onLoad() {
    this.loadUserInfo()
    this.loadUserWorks()
  },

  onShow() {
    this.loadUserData()
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        isVip: app.globalData.isVip,
        isGuest: app.globalData.userInfo.userType === 'guest'
      })
    } else {
      this.setData({
        userInfo: null,
        isGuest: true
      })
    }
  },

  // 加载用户数据
  loadUserData() {
    const app = getApp()
    this.setData({
      credits: app.globalData.credits || 16,
      isVip: app.globalData.isVip || false
    })
  },

  // 加载用户作品
  loadUserWorks() {
    // 模拟从本地存储或服务器获取用户作品
    const works = wx.getStorageSync('userWorks') || []
    const recentWorks = works.slice(0, 6) // 只显示最近6个作品
    
    this.setData({
      recentWorks: recentWorks.map(work => ({
        ...work,
        createTime: this.formatTime(work.createTime)
      })),
      workCount: works.length
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前'
    } else {
      return Math.floor(diff / 86400000) + '天前'
    }
  },

  // 导航到其他页面
  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({
      url: url
    })
  },

  // 预览作品
  previewWork(e) {
    const work = e.currentTarget.dataset.work
    const images = [work.image]
    
    wx.previewImage({
      urls: images,
      current: work.image
    })
  },

  // 显示VIP弹窗
  showVipModal() {
    this.setData({
      showVipModal: true
    })
  },

  // 隐藏VIP弹窗
  hideVipModal() {
    this.setData({
      showVipModal: false
    })
  },

  // 购买VIP
  buyVip() {
    wx.showToast({
      title: '支付功能开发中',
      icon: 'none'
    })
    // 这里集成微信支付
    // 支付成功后更新用户VIP状态
  },

  // 加入交流群
  joinGroup() {
    wx.showModal({
      title: '加入交流群',
      content: '请添加客服微信：AI-Helper-2024',
      showCancel: true,
      cancelText: '取消',
      confirmText: '复制微信号',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'AI-Helper-2024',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 显示兑换码弹窗
  showExchangeModal() {
    this.setData({
      showExchangeModal: true
    })
  },

  // 隐藏兑换码弹窗
  hideExchangeModal() {
    this.setData({
      showExchangeModal: false,
      exchangeCode: ''
    })
  },

  // 兑换码输入
  onExchangeCodeInput(e) {
    this.setData({
      exchangeCode: e.detail.value
    })
  },

  // 兑换兑换码
  exchangeCode() {
    const code = this.data.exchangeCode.trim()
    if (!code) {
      wx.showToast({
        title: '请输入兑换码',
        icon: 'none'
      })
      return
    }

    // 模拟兑换码验证
    this.validateExchangeCode(code)
  },

  // 验证兑换码
  validateExchangeCode(code) {
    // 模拟验证过程
    wx.showLoading({
      title: '验证中...'
    })

    setTimeout(() => {
      wx.hideLoading()
      
      // 模拟兑换结果
      const validCodes = ['VIP2024', 'CREDITS100', 'WELCOME']
      
      if (validCodes.includes(code)) {
        wx.showToast({
          title: '兑换成功！',
          icon: 'success'
        })
        
        // 更新用户数据
        if (code === 'VIP2024') {
          const app = getApp()
          app.globalData.isVip = true
          this.setData({
            isVip: true
          })
        } else if (code === 'CREDITS100') {
          const app = getApp()
          app.globalData.credits += 100
          this.setData({
            credits: app.globalData.credits
          })
        }
        
        this.hideExchangeModal()
      } else {
        wx.showToast({
          title: '兑换码无效',
          icon: 'none'
        })
      }
    }, 1500)
  },

  // 显示教程
  showTutorial() {
    wx.showToast({
      title: '教程功能开发中',
      icon: 'none'
    })
  },

  // 意见反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '请通过以下方式联系我们：\n微信：AI-Helper-2024\n邮箱：feedback@ai-helper.com',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'AI绘图助手 v1.0.0\n让每个人都能轻松创作精美图片\n\n技术支持：AI-Helper团队',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护，详细的隐私政策请访问我们的官网查看。',
      showCancel: true,
      cancelText: '取消',
      confirmText: '查看详情',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '请在浏览器中查看',
            icon: 'none'
          })
        }
      }
    })
  },

  // 微信登录
  async wxLogin() {
    try {
      wx.showLoading({
        title: '授权中...'
      })

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
          userInfo: result.result.data.userInfo,
          isGuest: false,
          isVip: result.result.data.userInfo.isVip
        })
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
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
    }
  },



  // 分享功能
  onShareAppMessage() {
    return {
      title: '发现一个超好用的AI绘图工具！',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.jpg'
    }
  }
}) 