import { defineAppConfig } from '@tarojs/taro'

export default defineAppConfig({
  pages: [
    'pages/generate/index',
    'pages/works/index', 
    'pages/profile/index'
  ],
  tabBar: {
    color: '#666666',
    selectedColor: '#6366f1',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/generate/index',
        text: '生成',
        iconPath: 'assets/icons/generate.png',
        selectedIconPath: 'assets/icons/generate-active.png'
      },
      {
        pagePath: 'pages/works/index', 
        text: '作品',
        iconPath: 'assets/icons/works.png',
        selectedIconPath: 'assets/icons/works-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'AI绘图大师',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5'
  },
  style: 'v2',
  sitemapLocation: 'sitemap.json'
}) 