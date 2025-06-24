// 智谱AI集成测试脚本
// 用于验证API密钥和接口配置是否正确

const https = require('https')

// 配置
const API_KEY = '437d675ba4764a11b6ad9d593c1341fe.0xdif28y8zidmdtn'
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/images/generations'

// 测试用例
const testCases = [
  {
    name: '基础测试',
    prompt: '可爱的小猫咪',
    style: 'cartoon'
  },
  {
    name: '复杂场景测试',
    prompt: '美丽的风景，山川河流',
    style: 'realistic'
  }
]

// 测试函数
async function testZhipuAI(prompt, style) {
  return new Promise((resolve, reject) => {
    const requestData = {
      model: 'cogview-3',
      prompt: `${style} style, ${prompt}, high quality, detailed`,
      size: '1024x1024',
      quality: 'standard',
      n: 1
    }

    const postData = JSON.stringify(requestData)
    
    const options = {
      hostname: 'open.bigmodel.cn',
      path: '/api/paas/v4/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 60000 // 60秒超时
    }

    console.log(`🚀 测试开始: ${prompt}`)
    console.log(`📝 优化提示词: ${requestData.prompt}`)
    
    const startTime = Date.now()
    
    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        const endTime = Date.now()
        const duration = endTime - startTime
        
        try {
          const result = JSON.parse(data)
          
          if (res.statusCode === 200) {
            console.log(`✅ 成功! 耗时: ${duration}ms`)
            console.log(`🖼️ 图片URL: ${result.data?.[0]?.url || '未返回URL'}`)
            resolve({
              success: true,
              duration,
              result,
              imageUrl: result.data?.[0]?.url
            })
          } else {
            console.log(`❌ API错误: ${res.statusCode}`)
            console.log(`📄 响应: ${data}`)
            reject(new Error(`API请求失败: ${res.statusCode} - ${result.error?.message || data}`))
          }
        } catch (parseError) {
          console.log(`❌ 解析错误: ${parseError.message}`)
          console.log(`📄 原始响应: ${data}`)
          reject(new Error(`响应解析失败: ${parseError.message}`))
        }
      })
    })

    req.on('error', (error) => {
      console.log(`❌ 网络错误: ${error.message}`)
      reject(new Error(`网络请求失败: ${error.message}`))
    })

    req.on('timeout', () => {
      console.log(`⏰ 请求超时`)
      req.destroy()
      reject(new Error('请求超时'))
    })

    req.write(postData)
    req.end()
  })
}

// 运行测试
async function runTests() {
  console.log('🔬 智谱AI集成测试开始')
  console.log(`🔑 API密钥: ${API_KEY.substring(0, 8)}...`)
  console.log(`🌐 API端点: ${API_URL}`)
  console.log('=' * 50)

  let successCount = 0
  let totalTests = testCases.length

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`\n📋 测试 ${i + 1}/${totalTests}: ${testCase.name}`)
    
    try {
      const result = await testZhipuAI(testCase.prompt, testCase.style)
      successCount++
      
      if (result.imageUrl) {
        console.log(`📸 可以在浏览器中查看生成的图片: ${result.imageUrl}`)
      }
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`)
    }
    
    // 避免请求过于频繁
    if (i < testCases.length - 1) {
      console.log('⏱️ 等待2秒后继续下一个测试...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('\n' + '=' * 50)
  console.log(`📊 测试结果: ${successCount}/${totalTests} 成功`)
  
  if (successCount === totalTests) {
    console.log('🎉 所有测试通过！智谱AI集成成功！')
    console.log('💡 提示: 现在您可以在小程序中体验真实的AI图片生成了')
  } else {
    console.log('⚠️ 部分测试失败，请检查:')
    console.log('   1. API密钥是否正确')
    console.log('   2. 账户余额是否充足')
    console.log('   3. 网络连接是否正常')
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testZhipuAI, runTests } 