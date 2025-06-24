Page({
  data: {
    prompt: '',
    optimizedPrompt: '',
    imageUrl: '',
    workId: null,
    imageLoaded: false
  },

  onLoad(options) {
    console.log('结果页面参数:', options)
    
    const prompt = decodeURIComponent(options.prompt || '')
    const optimizedPrompt = decodeURIComponent(options.optimizedPrompt || '')
    const imageUrl = decodeURIComponent(options.imageUrl || '')
    const workId = options.workId || null

    this.setData({
      prompt: prompt,
      optimizedPrompt: optimizedPrompt,
      imageUrl: imageUrl,
      workId: workId
    })
  },

  // 图片加载完成
  onImageLoad() {
    console.log('图片加载成功')
    this.setData({
      imageLoaded: true
    })
  },

  // 图片加载失败
  onImageError(e) {
    console.error('图片加载失败:', e)
    this.setData({
      imageLoaded: false
    })
    wx.showToast({
      title: '图片加载失败',
      icon: 'none'
    })
  },

  // 预览图片
  previewImage() {
    if (this.data.imageUrl && this.data.imageLoaded) {
      wx.previewImage({
        current: this.data.imageUrl,
        urls: [this.data.imageUrl]
      })
    }
  },

  // 复制提示词
  copyPrompt() {
    wx.setClipboardData({
      data: this.data.optimizedPrompt,
      success: () => {
        wx.showToast({
          title: '提示词已复制',
          icon: 'success'
        })
      }
    })
  },

  // 保存到作品
  async saveToWorks() {
    if (!this.data.workId) {
      wx.showToast({
        title: '作品ID无效',
        icon: 'none'
      })
      return
    }

    wx.showToast({
      title: '作品已保存',
      icon: 'success'
    })
  },

  // 重新生成
  regenerate() {
    wx.navigateBack()
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `我用AI生成了图片：${this.data.prompt}`,
      path: '/pages/index/index',
      imageUrl: this.data.imageUrl
    }
  }
})
