// creative.js
Page({
  data: {
    searchKeyword: '',
    
    // 教程视频
    tutorialVideos: [
      {
        id: 1,
        title: '怎么用有图有槽怎么赚钱？',
        desc: '用有图有槽怎么赚钱',
        cover: '/images/tutorials/money-tutorial.jpg',
        videoUrl: '/videos/money-tutorial.mp4',
        description: '通过AI生成图片，您可以用于自媒体创作、朋友圈营销、电商商品图等多种商业用途。本教程将详细介绍如何利用我们的工具实现收益最大化。'
      },
      {
        id: 2,
        title: '怎么做单图/双图？',
        desc: '怎么用有图有槽做图？',
        cover: '/images/tutorials/create-tutorial.jpg',
        videoUrl: '/videos/create-tutorial.mp4', 
        description: '学习如何使用我们的AI工具创作单图和双图。从文字描述到角色选择，从风格定制到最终导出，让您快速掌握创作技巧。'
      }
    ],

    // 创意模板
    templates: [
      {
        id: 1,
        title: '用AI做鸡汤图文',
        subtitle: '流量巨大🔥涨粉快',
        badge: '流量大涨粉快的鸡汤图文，怎么做？',
        cover: '/images/templates/chicken-soup.jpg',
        preview: '/images/templates/chicken-soup-preview.jpg',
        category: 'social',
        tags: ['鸡汤', '励志', '文案'],
        prompt: '温暖治愈的老奶奶形象，慈祥的笑容，温馨的厨房背景',
        textStyle: 'warm'
      },
      {
        id: 2,
        title: '用AI做古风插画',
        subtitle: '涨粉也太快了！',
        badge: '用AI做古风插画🔥涨粉也太快了！',
        cover: '/images/templates/ancient-style.jpg',
        preview: '/images/templates/ancient-style-preview.jpg',
        category: 'art',
        tags: ['古风', '插画', '国风'],
        prompt: '古风美少女，汉服，水墨画风格，唯美意境',
        textStyle: 'classical'
      },
      {
        id: 3,
        title: '用AI做西游记插画',
        subtitle: '商直太火了！',
        badge: '用AI做西游记插画🔥商直太火了！',
        cover: '/images/templates/journey-west.jpg',
        preview: '/images/templates/journey-west-preview.jpg',
        category: 'story',
        tags: ['西游记', '神话', '插画'],
        prompt: '西游记人物，孙悟空，唐僧，猪八戒，沙僧，传统插画风格',
        textStyle: 'mythical'
      },
      {
        id: 4,
        title: '用AI做露语录',
        subtitle: '发工资了',
        badge: '用AI做露语录💰发工资了',
        cover: '/images/templates/quotes.jpg',
        preview: '/images/templates/quotes-preview.jpg',
        category: 'quotes',
        tags: ['语录', '文案', '励志'],
        prompt: '简约现代背景，精美文字排版，励志语录',
        textStyle: 'modern'
      },
      {
        id: 5,
        title: '职场励志文案',
        subtitle: '打工人必备',
        badge: '职场加油站💪',
        cover: '/images/templates/workplace.jpg',
        preview: '/images/templates/workplace-preview.jpg',
        category: 'work',
        tags: ['职场', '励志', '奋斗'],
        prompt: '职场精英形象，现代办公环境，积极向上氛围',
        textStyle: 'professional'
      },
      {
        id: 6,
        title: '情感治愈系',
        subtitle: '温暖人心',
        badge: '温暖治愈💕',
        cover: '/images/templates/healing.jpg',
        preview: '/images/templates/healing-preview.jpg',
        category: 'emotion',
        tags: ['治愈', '温暖', '情感'],
        prompt: '温暖柔和的色调，治愈系插画风格，温馨氛围',
        textStyle: 'healing'
      }
    ],

    // 模态框相关
    showTutorialModal: false,
    currentTutorial: {},
    showTemplateModal: false,
    currentTemplate: {},

    // 分页相关
    hasMore: true,
    page: 1,
    pageSize: 6
  },

  onLoad() {
    this.initData()
  },

  // 初始化数据
  initData() {
    // 模拟异步加载数据
    setTimeout(() => {
      this.setData({
        templates: this.data.templates.slice(0, 6)
      })
    }, 500)
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 执行搜索
  onSearch() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }

    // 模拟搜索
    wx.showLoading({
      title: '搜索中...'
    })

    setTimeout(() => {
      wx.hideLoading()
      
      // 过滤模板
      const filteredTemplates = this.data.templates.filter(template => 
        template.title.includes(keyword) || 
        template.tags.some(tag => tag.includes(keyword))
      )

      if (filteredTemplates.length > 0) {
        this.setData({
          templates: filteredTemplates,
          hasMore: false
        })
      } else {
        wx.showToast({
          title: '没有找到相关内容',
          icon: 'none'
        })
      }
    }, 1000)
  },

  // 播放教程
  playTutorial(e) {
    const tutorial = e.currentTarget.dataset.tutorial
    this.setData({
      currentTutorial: tutorial,
      showTutorialModal: true
    })
  },

  // 关闭教程弹窗
  closeTutorialModal() {
    this.setData({
      showTutorialModal: false,
      currentTutorial: {}
    })
  },

  // 使用模板
  useTemplate(e) {
    const template = e.currentTarget.dataset.template
    this.setData({
      currentTemplate: template,
      showTemplateModal: true
    })
  },

  // 关闭模板弹窗
  closeTemplateModal() {
    this.setData({
      showTemplateModal: false,
      currentTemplate: {}
    })
  },

  // 确认使用模板
  confirmUseTemplate() {
    const template = this.data.currentTemplate
    
    // 跳转到首页并传递模板数据
    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        // 通过事件或全局数据传递模板信息
        const app = getApp()
        app.globalData.selectedTemplate = template
        
        // 触发首页的模板应用事件
        wx.nextTick(() => {
          const pages = getCurrentPages()
          const indexPage = pages.find(page => page.route === 'pages/index/index')
          if (indexPage && indexPage.applyTemplate) {
            indexPage.applyTemplate(template)
          }
        })
      }
    })

    this.closeTemplateModal()
  },

  // 加载更多模板
  loadMoreTemplates() {
    if (!this.data.hasMore) return

    wx.showLoading({
      title: '加载中...'
    })

    // 模拟加载更多数据
    setTimeout(() => {
      wx.hideLoading()
      
      const newTemplates = [
        {
          id: 7,
          title: '节日祝福图',
          subtitle: '节日必备',
          badge: '节日祝福🎉',
          cover: '/images/templates/festival.jpg',
          preview: '/images/templates/festival-preview.jpg',
          category: 'festival',
          tags: ['节日', '祝福', '庆祝'],
          prompt: '节日庆祝氛围，温馨祝福，喜庆色彩',
          textStyle: 'festive'
        },
        {
          id: 8,
          title: '美食分享图',
          subtitle: '吃货专属',
          badge: '美食诱惑😋',
          cover: '/images/templates/food.jpg',
          preview: '/images/templates/food-preview.jpg',
          category: 'food',
          tags: ['美食', '分享', '生活'],
          prompt: '精美美食摄影，诱人色彩，生活美学',
          textStyle: 'delicious'
        }
      ]

      this.setData({
        templates: [...this.data.templates, ...newTemplates],
        hasMore: false,
        page: this.data.page + 1
      })
    }, 1500)
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '发现这些超火的AI创意模板！',
      path: '/pages/creative/creative',
      imageUrl: '/images/share-creative.jpg'
    }
  }
}) 