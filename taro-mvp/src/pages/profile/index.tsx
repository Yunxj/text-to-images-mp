import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface UserInfo {
  id: string
  nickname: string
  avatarUrl: string
  isVip: boolean
  vipExpireTime?: string
  totalWorks: number
  totalCredits: number
}

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // 模拟用户数据
  const mockUserInfo: UserInfo = {
    id: 'user001',
    nickname: 'AI绘画爱好者',
    avatarUrl: 'https://picsum.photos/100/100?random=avatar',
    isVip: false,
    totalWorks: 15,
    totalCredits: 120
  }

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    setLoading(true)
    try {
      // 模拟获取用户信息
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUserInfo(mockUserInfo)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    Taro.showToast({ title: '登录功能开发中', icon: 'none' })
  }

  const handleUpgradeVip = () => {
    Taro.showModal({
      title: '升级VIP',
      content: '升级VIP可享受更多高质量生图、无限制使用等特权',
      confirmText: '立即升级',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: 'VIP功能开发中', icon: 'none' })
        }
      }
    })
  }

  const menuItems = [
    { id: 'history', title: '生成历史', icon: '📝', desc: '查看所有生成记录' },
    { id: 'favorites', title: '我的收藏', icon: '⭐', desc: '收藏的精美作品' },
    { id: 'settings', title: '设置', icon: '⚙️', desc: '个性化设置' },
    { id: 'feedback', title: '意见反馈', icon: '💬', desc: '告诉我们你的想法' },
    { id: 'about', title: '关于我们', icon: 'ℹ️', desc: 'AI绘图大师介绍' }
  ]

  const handleMenuClick = (itemId: string) => {
    switch (itemId) {
      case 'history':
        Taro.switchTab({ url: '/pages/works/index' })
        break
      case 'settings':
        Taro.showToast({ title: '设置功能开发中', icon: 'none' })
        break
      case 'feedback':
        Taro.showToast({ title: '反馈功能开发中', icon: 'none' })
        break
      case 'about':
        Taro.showModal({
          title: 'AI绘图大师',
          content: '版本 1.0.0\n基于最新AI技术，让创意变为现实',
          showCancel: false
        })
        break
      default:
        Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className='profile-page'>
        <View className='loading-container'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!userInfo) {
    return (
      <View className='profile-page'>
        <View className='login-container'>
          <Text className='login-title'>欢迎使用AI绘图大师</Text>
          <Text className='login-desc'>登录后可保存作品、享受更多功能</Text>
          <Button className='login-btn' onClick={handleLogin}>
            立即登录
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className='profile-page'>
      <View className='container'>
        {/* 用户信息卡片 */}
        <View className='user-card'>
          <View className='user-info'>
            <Image src={userInfo.avatarUrl} className='user-avatar' />
            <View className='user-details'>
              <Text className='user-name'>{userInfo.nickname}</Text>
              <View className='user-status'>
                {userInfo.isVip ? (
                  <Text className='vip-badge'>VIP用户</Text>
                ) : (
                  <Button size='mini' className='upgrade-btn' onClick={handleUpgradeVip}>
                    升级VIP
                  </Button>
                )}
              </View>
            </View>
          </View>
          
          {/* 用户统计 */}
          <View className='user-stats'>
            <View className='stat-item'>
              <Text className='stat-number'>{userInfo.totalWorks}</Text>
              <Text className='stat-label'>作品数</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-number'>{userInfo.totalCredits}</Text>
              <Text className='stat-label'>积分</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View className='menu-section'>
          {menuItems.map(item => (
            <View 
              key={item.id} 
              className='menu-item'
              onClick={() => handleMenuClick(item.id)}
            >
              <View className='menu-icon'>{item.icon}</View>
              <View className='menu-content'>
                <Text className='menu-title'>{item.title}</Text>
                <Text className='menu-desc'>{item.desc}</Text>
              </View>
              <View className='menu-arrow'>›</View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default ProfilePage 