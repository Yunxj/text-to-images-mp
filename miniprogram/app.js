// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'text-to-images-mp-9ekbr0131f377e', // 替换为你的云环境ID
        traceUser: true,
      })
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    this.globalData.userInfo = null
    this.autoLogin()
  },

  // 自动登录
  async autoLogin() {
    try {
      // 优先尝试获取用户信息进行微信登录
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
        console.log('从缓存恢复用户信息:', userInfo)
        return
      }

      // 尝试游客登录
      await this.guestLogin()
    } catch (error) {
      console.error('自动登录失败:', error)
      // 即使登录失败也不阻塞页面加载
      this.globalData.userInfo = {
        id: 'temp_user',
        nickname: '临时用户',
        credits: 10,
        userType: 'guest'
      }
    }
  },

  // 游客登录
  async guestLogin() {
    try {
      // 生成或获取设备ID
      let deviceId = wx.getStorageSync('device_id')
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        wx.setStorageSync('device_id', deviceId)
      }

      // 调用云函数进行游客登录
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'guestLogin',
          data: { deviceId }
        }
      })

      if (result.result.code === 200) {
        this.globalData.userInfo = result.result.data.userInfo
        wx.setStorageSync('userInfo', this.globalData.userInfo)
        console.log('游客登录成功:', this.globalData.userInfo)
      } else {
        throw new Error(result.result.message)
      }
    } catch (error) {
      console.error('游客登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  },

  // 微信登录（已弃用，请直接在页面中调用登录逻辑）
  // 这个方法保留用于兼容，但建议直接在页面中处理登录
  async wxLogin(code, userInfo) {
    try {
      // 调用云函数进行微信登录
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'wxLogin',
          data: {
            code: code,
            userInfo: userInfo
          }
        }
      })

      if (result.result.code === 200) {
        this.globalData.userInfo = result.result.data.userInfo
        wx.setStorageSync('userInfo', this.globalData.userInfo)
        
        console.log('微信登录成功:', this.globalData.userInfo)
        return this.globalData.userInfo
      } else {
        throw new Error(result.result.message)
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  },

  globalData: {
    userInfo: null,
    credits: 0, // 用户积分
    isVip: false, // 是否VIP
    generateCount: 0 // 今日生成次数
  }
}) 