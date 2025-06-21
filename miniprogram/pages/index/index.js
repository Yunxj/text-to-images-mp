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
    this.loadUserData()
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

  // 加载用户数据
  loadUserData() {
    const app = getApp()
    this.setData({
      remainingCount: app.globalData.isVip ? 999 : (10 - app.globalData.generateCount)
    })
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
        title: '请选择角色',
        icon: 'none'
      })
      return
    }

    // 检查生成次数
    if (this.data.remainingCount <= 0) {
      this.setData({
        showVipModal: true
      })
      return
    }

    this.setData({
      isGenerating: true
    })

    try {
      // 调用AI生成接口
      const result = await this.callAIGenerateAPI({
        text: inputText,
        character: selectedCharacter,
        mode: currentMode,
        textType: currentTextType,
        emotion: emotionText
      })

      // 生成成功，跳转到结果页
      wx.navigateTo({
        url: `/pages/result/result?images=${JSON.stringify(result.images)}&prompt=${inputText}`
      })

      // 更新生成次数
      this.updateGenerateCount()

    } catch (error) {
      console.error('生成图片失败:', error)
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({
        isGenerating: false
      })
    }
  },

  // 调用AI生成API（模拟）
  callAIGenerateAPI(params) {
    return new Promise((resolve, reject) => {
      // 模拟API调用
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90%成功率
          resolve({
            images: params.mode === 'single' ? [
              '/images/generated/sample1.jpg'
            ] : [
              '/images/generated/sample1.jpg',
              '/images/generated/sample2.jpg'
            ]
          })
        } else {
          reject(new Error('生成失败'))
        }
      }, 3000) // 模拟3秒生成时间
    })
  },

  // 更新生成次数
  updateGenerateCount() {
    const app = getApp()
    app.globalData.generateCount += 1
    
    this.setData({
      remainingCount: app.globalData.isVip ? 999 : (10 - app.globalData.generateCount)
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

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'AI绘图助手 - 文字秒变精美图片',
      path: '/pages/index/index'
    }
  }
}) 