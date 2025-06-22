import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface WorkItem {
  id: string
  imageUrl: string
  prompt: string
  character?: string
  createdAt: string
}

const WorksPage = () => {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟数据
  const mockData: WorkItem[] = [
    {
      id: '1',
      imageUrl: 'https://picsum.photos/300/300?random=1',
      prompt: '可爱的小猫咪在花园里玩耍',
      character: '小猫咪',
      createdAt: '2024-12-21 14:30'
    },
    {
      id: '2', 
      imageUrl: 'https://picsum.photos/300/300?random=2',
      prompt: '美丽的公主穿着华丽的礼服',
      character: '公主',
      createdAt: '2024-12-21 13:15'
    },
    {
      id: '3',
      imageUrl: 'https://picsum.photos/300/300?random=3', 
      prompt: '帅气的超级英雄在城市上空飞行',
      character: '超人',
      createdAt: '2024-12-21 12:00'
    }
  ]

  useEffect(() => {
    loadWorks()
  }, [])

  const loadWorks = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setWorks(mockData)
    } catch (error) {
      console.error('加载作品失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (work: WorkItem) => {
    Taro.previewImage({
      urls: [work.imageUrl],
      current: work.imageUrl
    })
  }

  const handleShare = (work: WorkItem) => {
    Taro.showActionSheet({
      itemList: ['保存到相册', '分享给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 保存到相册
          Taro.saveImageToPhotosAlbum({
            filePath: work.imageUrl,
            success: () => {
              Taro.showToast({ title: '保存成功', icon: 'success' })
            }
          })
        } else if (res.tapIndex === 1) {
          // 分享功能
          Taro.showToast({ title: '分享功能开发中', icon: 'none' })
        }
      }
    })
  }

  if (loading) {
    return (
      <View className='works-page'>
        <View className='loading-container'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (works.length === 0) {
    return (
      <View className='works-page'>
        <View className='empty-container'>
          <Text className='empty-text'>还没有作品哦</Text>
          <Text className='empty-tip'>快去生成你的第一张图片吧！</Text>
          <Button 
            className='goto-generate-btn'
            onClick={() => Taro.switchTab({ url: '/pages/generate/index' })}
          >
            去生成
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className='works-page'>
      <View className='container'>
        <View className='stats-bar'>
          <Text className='stats-text'>共 {works.length} 件作品</Text>
        </View>
        
        <View className='works-grid'>
          {works.map(work => (
            <View key={work.id} className='work-item'>
              <View className='work-image-container'>
                <Image 
                  src={work.imageUrl} 
                  className='work-image'
                  mode='aspectFill'
                  onClick={() => handlePreview(work)}
                />
              </View>
              
              <View className='work-info'>
                <Text className='work-prompt'>{work.prompt}</Text>
                {work.character && (
                  <Text className='work-character'>角色：{work.character}</Text>
                )}
                <Text className='work-time'>{work.createdAt}</Text>
              </View>
              
              <View className='work-actions'>
                <Button 
                  size='mini'
                  className='action-btn'
                  onClick={() => handlePreview(work)}
                >
                  预览
                </Button>
                <Button 
                  size='mini'
                  className='action-btn'
                  onClick={() => handleShare(work)}
                >
                  分享
                </Button>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default WorksPage 