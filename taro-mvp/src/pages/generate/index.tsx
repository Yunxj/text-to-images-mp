import { useState } from 'react'
import { View, Text, Textarea, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const GeneratePage = () => {
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Taro.showToast({ title: '请输入描述文字', icon: 'none' })
      return
    }

    setIsGenerating(true)
    try {
      // 模拟生成过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟生成结果
      const mockImageUrl = `https://picsum.photos/400/400?random=${Date.now()}`
      setGeneratedImage(mockImageUrl)
      
      Taro.showToast({ title: '生成成功！', icon: 'success' })
    } catch (error) {
      console.error('生成失败:', error)
      Taro.showToast({ title: '生成失败，请重试', icon: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <View className='generate-page'>
      <View className='container'>
        <Text className='title'>AI图片生成</Text>
        
        {/* 文字输入区域 */}
        <View className='input-section'>
          <Text className='section-title'>描述你想要的图片</Text>
          <Textarea
            className='prompt-input'
            placeholder='例如：一只可爱的小猫咪在花园里玩耍'
            value={prompt}
            onInput={(e) => setPrompt(e.detail.value)}
            maxlength={200}
          />
          <Text className='input-tip'>{prompt.length}/200</Text>
        </View>

        {/* 生成按钮 */}
        <Button
          className='generate-btn'
          onClick={handleGenerate}
          loading={isGenerating}
          disabled={isGenerating}
        >
          {isGenerating ? '生成中...' : '生成图片'}
        </Button>

        {/* 结果展示区域 */}
        {generatedImage && (
          <View className='result-section'>
            <Text className='section-title'>生成结果</Text>
            <View className='generated-image-container'>
              <Image src={generatedImage} className='generated-image' mode='aspectFit' />
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

export default GeneratePage 