const { aiAPI, userAPI } = require('../../utils/cloudApi')

Page({
  data: {
    // 生成模式
    currentMode: 'single',
    
    // 输入文本
    inputText: '',
    inputFocus: false,
    
    // 文案类型
    currentTextType: 'simple',
    
    // 角色相关
    currentCharacterTab: 'recommend',
    selectedCharacter: {},
    characters: {
      recommend: [],
      recent: [],
      person: [],
      pet: []
    },
    currentCharacters: [],
    
    // 表情动作
    emotionText: '',
    
    // 生成相关
    isGenerating: false,
    remainingCount: 3,
    
    // 弹窗
    showVipModal: false
  },

  onLoad() {
    this.initCharacters()
    this.initUser()
  },

  // 初始化角色数据
  initCharacters() {
    const recommendCharacters = [
      { id: 1, name: '可爱小女孩', image: '/images/characters/girl1.jpg' },
      { id: 2, name: '商务男士', image: '/images/characters/man1.jpg' },
      { id: 3, name: '老奶奶', image: '/images/characters/grandma.jpg' },
      { id: 4, name: '小和尚', image: '/images/characters/monk.jpg' },
      { id: 5, name: '玫玫', image: '/images/characters/girl2.jpg' },
      { id: 6, name: '小小', image: '/images/characters/girl3.jpg' }
    ]

    const personCharacters = Array.from({ length: 20 }, (_, i) => ({
      id: i + 10,
      name: `角色${i + 1}`,
      image: `/images/characters/person${i + 1}.jpg`
    }))

    const petCharacters = Array.from({ length: 15 }, (_, i) => ({
      id: i + 100,
      name: `萌宠${i + 1}`,
      image: `/images/characters/pet${i + 1}.jpg`
    }))

    this.setData({
      'characters.recommend': recommendCharacters,
      'characters.person': personCharacters,
      'characters.pet': petCharacters,
      currentCharacters: recommendCharacters,
      selectedCharacter: recommendCharacters[0]
    })
  },

  // 初始化用户
  async initUser() {
    try {
      const app = getApp()
      if (app.globalData.userInfo) {
        this.setData({
          remainingCount: app.globalData.userInfo.isVip ? 999 : Math.max(0, app.globalData.userInfo.credits || 0)
        })
      } else {
        // 如果没有用户信息，等待登录完成
        setTimeout(() => {
          this.initUser()
        }, 1000)
      }
    } catch (error) {
      console.error('用户初始化失败:', error)
      this.setData({
        remainingCount: 0
      })
    }
  },

  // 切换生成模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      currentMode: mode
    })
  },

  // 文本输入处理
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  onInputFocus() {
    this.setData({
      inputFocus: true
    })
  },

  onInputBlur() {
    this.setData({
      inputFocus: false
    })
  },

  // 选择文案类型
  selectTextType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      currentTextType: type
    })
  },

  // 切换角色分类
  switchCharacterTab(e) {
    const tab = e.currentTarget.dataset.tab
    const characters = this.data.characters[tab] || []
    
    this.setData({
      currentCharacterTab: tab,
      currentCharacters: characters
    })
  },

  // 选择角色
  selectCharacter(e) {
    const character = e.currentTarget.dataset.character
    this.setData({
      selectedCharacter: character
    })

    // 添加到最近使用
    this.addToRecent(character)
  },

  // 添加到最近使用
  addToRecent(character) {
    let recent = this.data.characters.recent
    // 移除已存在的
    recent = recent.filter(item => item.id !== character.id)
    // 添加到开头
    recent.unshift(character)
    // 限制数量
    if (recent.length > 10) {
      recent = recent.slice(0, 10)
    }
    
    this.setData({
      'characters.recent': recent
    })
  },

  // 显示更多角色
  showMoreCharacters() {
    wx.showToast({
      title: '更多角色正在开发中',
      icon: 'none'
    })
  },

  // 表情动作输入
  onEmotionChange(e) {
    this.setData({
      emotionText: e.detail.value
    })
  },

  // 生成图片
  async generateImage() {
    const { inputText, selectedCharacter, currentMode, currentTextType, emotionText } = this.data

    // 验证输入
    if (!inputText.trim()) {
      wx.showToast({
        title: '请输入图片描述',
        icon: 'none'
      })
      return
    }

    if (!selectedCharacter.id) {
      wx.showToast({
        title: '请选择一个角色',
        icon: 'none'
      })
      return
    }

    this.setData({
      isGenerating: true
    })

    try {
      // 使用云开发API生成图片
      const result = await aiAPI.generateImage({
        text: inputText,
        character: selectedCharacter,
        textType: currentTextType,
        emotion: emotionText,
        mode: currentMode
      })

      console.log('生成成功:', result)

      // 跳转到结果页面
      wx.navigateTo({
        url: `/pages/result/result?workId=${result.workId}&imageUrl=${encodeURIComponent(result.imageUrl)}&prompt=${encodeURIComponent(result.prompt)}&optimizedPrompt=${encodeURIComponent(result.enhancedPrompt || result.prompt)}`
      })

      // 更新剩余次数
      this.updateRemainingCount()

    } catch (error) {
      console.error('生成失败:', error)
      wx.showToast({
        title: error.message || '生成失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({
        isGenerating: false

      })

    }
  },

  // 更新剩余生成次数
  async updateRemainingCount() {
    try {
      // 重新获取用户信息
      const userInfo = await userAPI.getUserInfo()
      const app = getApp()
      app.globalData.userInfo = userInfo
      
      this.setData({
        remainingCount: userInfo.isVip ? 999 : Math.max(0, userInfo.credits || 0)
      })
    } catch (error) {
      console.error('更新用户信息失败:', error)
    }
  },

  showVipModal() {
    this.setData({
      showVipModal: true
    })
  },

  hideVipModal() {
    this.setData({
      showVipModal: false
    })
  },

  onShareAppMessage() {
    return {
      title: 'AI绘图助手 - 文字生成精美图片',
      path: '/pages/index/index'
    }
  }
}) 
