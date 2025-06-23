import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.css'

export default function AiImageMini () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='ai-image-mini'>
      <Text>Hello world!</Text>
    </View>
  )
}
