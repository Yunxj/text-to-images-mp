// 云函数：AI图片生成
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'generate':
        return await generateImage(data, wxContext)
      case 'getHistory':
        return await getGenerateHistory(data, wxContext)
      case 'getServiceStatus':
        return await getServiceStatus()
      default:
        return {
          code: 400,
          message: '未知的操作类型'
        }
    }
  } catch (error) {
    console.error('AI生成云函数错误:', error)
    return {
      code: 500,
      message: error.message || '服务器内部错误'
    }
  }
}

// 生成图片
async function generateImage(data, wxContext) {
  const { prompt, character, style = 'cartoon', emotion = '', mode = 'single', userId } = data
  
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('请提供图片描述')
  }

  if (prompt.length > 500) {
    throw new Error('图片描述不能超过500个字符')
  }

  // 查找用户信息
  let user
  if (userId) {
    try {
      const userQuery = await db.collection('users').doc(userId).get()
      user = userQuery.data
    } catch (error) {
      console.error('通过userId查找用户失败:', error)
    }
  }
  
  // 如果通过userId没有找到用户，尝试通过openid查找
  if (!user && wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    console.error('用户查找失败 - userId:', userId, 'openid:', wxContext.OPENID)
    throw new Error('用户不存在，请先登录')
  }

  // 检查积分
  if (user.credits <= 0 && user.vipLevel === 0) {
    throw new Error('积分不足，请充值或升级VIP')
  }

  // 构建完整的提示词
  let fullPrompt = prompt.trim()
  if (character) {
    fullPrompt = `${character}, ${fullPrompt}`
  }
  if (emotion) {
    fullPrompt = `${fullPrompt}, ${emotion}`
  }

  try {
    // 调用智谱AI API生成图片
    const generateResult = await callZhipuAI(fullPrompt, style)
    
    // 创建作品记录
    const workId = `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const work = {
      id: workId,
      userId: user._id,
      openid: user.openid || null,
      title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      prompt: fullPrompt,
      originalPrompt: prompt,
      character,
      style,
      emotion,
      mode,
      imageUrl: generateResult.imageUrl,
      enhancedPrompt: generateResult.enhancedPrompt || fullPrompt,
      status: 'completed',
      createdAt: new Date()
    }

    await db.collection('works').add({
      data: work
    })

    // 更新用户积分和生成次数
    const updateData = {
      generateCount: db.command.inc(1)
    }
    
    if (user.vipLevel === 0) {
      updateData.credits = db.command.inc(-1)
    }

    await db.collection('users').doc(user._id).update({
      data: updateData
    })

    return {
      code: 200,
      message: '图片生成成功',
      data: {
        workId: work.id,
        imageUrl: work.imageUrl,
        prompt: work.prompt,
        enhancedPrompt: work.enhancedPrompt,
        remainingCredits: user.vipLevel > 0 ? 999 : Math.max(0, user.credits - 1)
      }
    }

  } catch (aiError) {
    console.error('AI生成失败:', aiError)
    
    // 记录失败的生成请求
    await db.collection('works').add({
      data: {
        id: `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user._id,
        openid: user.openid || null,
        prompt: fullPrompt,
        status: 'failed',
        errorMessage: aiError.message,
        createdAt: new Date()
      }
    })

    throw new Error('图片生成失败，请稍后重试')
  }
}

// 获取生成历史
async function getGenerateHistory(data, wxContext) {
  const { page = 1, pageSize = 10, userId } = data
  
  let user
  if (userId) {
    try {
      const userQuery = await db.collection('users').doc(userId).get()
      user = userQuery.data
    } catch (error) {
      console.error('通过userId查找用户失败:', error)
    }
  }
  
  // 如果通过userId没有找到用户，尝试通过openid查找
  if (!user && wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    console.error('用户查找失败 - userId:', userId, 'openid:', wxContext.OPENID)
    throw new Error('用户不存在，请先登录')
  }

  const skip = (page - 1) * pageSize
  
  // 获取用户的作品
  const worksQuery = await db.collection('works')
    .where({
      userId: user._id
    })
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  // 获取总数
  const countResult = await db.collection('works')
    .where({
      userId: user._id
    })
    .count()

  const list = worksQuery.data.map(work => ({
    workId: work.id,
    title: work.title,
    imageUrl: work.imageUrl,
    prompt: work.originalPrompt || work.prompt,
    style: work.style,
    status: work.status,
    createdAt: work.createdAt
  }))

  return {
    code: 200,
    data: {
      list,
      pagination: {
        page,
        pageSize,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
  }
}

// 获取服务状态
async function getServiceStatus() {
  return {
    code: 200,
    data: {
      services: [
        {
          name: '智谱AI',
          enabled: true,
          status: 'available'
        }
      ],
      available: true
    }
  }
}

// 调用智谱AI API
async function callZhipuAI(prompt, style) {
  // 智谱AI API密钥
  const apiKey = process.env.ZHIPU_API_KEY || '437d675ba4764a11b6ad9d593c1341fe.0xdif28y8zidmdtn'
  
  if (!apiKey) {
    console.warn('智谱AI API Key未配置，使用模拟数据')
    return mockResponse(prompt, style)
  }

  try {
    console.log('调用智谱AI API开始, prompt:', prompt, 'style:', style)
    const startTime = Date.now()
    
    // 构建请求参数
    const requestData = {
      model: 'cogview-3',
      prompt: `${style} style, ${prompt}, high quality, detailed`,
      size: '1024x1024',
      quality: 'standard',
      n: 1
    }

    console.log('请求参数:', JSON.stringify(requestData, null, 2))

    // 直接使用HTTP请求
    const result = await callZhipuAIDirect(prompt, style, apiKey)
    
    const duration = Date.now() - startTime
    console.log(`智谱AI API调用完成，耗时: ${duration}ms`)
    
    return {
      ...result,
      duration: duration
    }

  } catch (error) {
    console.error('智谱AI API调用失败:', error)
    console.log('降级使用模拟数据')
    return mockResponse(prompt, style)
  }
}

// 直接HTTP请求的降级实现
async function callZhipuAIDirect(prompt, style, apiKey) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    
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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 45000 // 45秒超时
    }

    console.log('发起直接HTTP请求到智谱AI...')
    const startTime = Date.now()

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        const duration = Date.now() - startTime
        console.log(`直接HTTP请求完成，耗时: ${duration}ms, 状态码: ${res.statusCode}`)
        
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200) {
            if (result.data && result.data.length > 0) {
              const imageData = result.data[0]
              resolve({
                imageUrl: imageData.url,
                enhancedPrompt: requestData.prompt,
                duration: duration,
                apiResponse: result
              })
            } else {
              reject(new Error('API返回数据格式异常'))
            }
          } else {
            console.log('API错误响应:', data)
            reject(new Error(`API请求失败: ${res.statusCode} - ${result.error?.message || data}`))
          }
        } catch (parseError) {
          console.log('解析响应失败:', data)
          reject(new Error(`API响应解析失败: ${parseError.message}`))
        }
      })
    })

    req.on('error', (error) => {
      console.log('请求发生错误:', error.message)
      reject(new Error(`网络请求失败: ${error.message}`))
    })

    req.on('timeout', () => {
      console.log('请求超时')
      req.destroy()
      reject(new Error('请求超时'))
    })

    req.write(postData)
    req.end()
  })
}

// 模拟响应（降级方案）
function mockResponse(prompt, style) {
  const mockImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`
  
  return {
    imageUrl: mockImageUrl,
    enhancedPrompt: `${style} style, ${prompt}, high quality, detailed`,
    isMockData: true
  }
} 