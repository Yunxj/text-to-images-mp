import { defineAppConfig } from '@tarojs/taro'

export default defineAppConfig({
  pages: [
    'pages/generate/index',
    'pages/works/index', 
    'pages/profile/index'
  ],
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