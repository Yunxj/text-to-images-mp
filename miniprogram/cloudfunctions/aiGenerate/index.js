// 云函数：AI图片生成
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 每日AI生成限制配置
const DAILY_LIMITS = {
  free: 50,     // 免费用户每日50次
  vip: 200,     // VIP用户每日200次
  admin: 1000   // 管理员每日1000次
}

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
      case 'getDailyUsage':
        return await getDailyUsage(data, wxContext)
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

// 获取今日使用次数统计
async function getDailyUsage(data, wxContext) {
  const { userId } = data
  
  let user
  if (userId) {
    try {
      const userQuery = await db.collection('users').doc(userId).get()
      user = userQuery.data
    } catch (error) {
      console.error('通过userId查找用户失败:', error)
    }
  }
  
  if (!user && wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在，请先登录')
  }

  // 获取今日使用统计
  const dailyUsage = await getTodayUsageCount(user._id)
  const userType = getUserType(user)
  const dailyLimit = DAILY_LIMITS[userType]
  
  return {
    code: 200,
    data: {
      todayUsed: dailyUsage,
      dailyLimit: dailyLimit,
      remaining: Math.max(0, dailyLimit - dailyUsage),
      userType: userType,
      resetTime: getNextResetTime()
    }
  }
}

// 检查今日生成次数
async function checkDailyLimit(userId, userType) {
  const todayUsage = await getTodayUsageCount(userId)
  const dailyLimit = DAILY_LIMITS[userType]
  
  console.log(`用户 ${userId} 今日已使用: ${todayUsage}/${dailyLimit}`)
  
  if (todayUsage >= dailyLimit) {
    throw new Error(`今日生成次数已达上限（${dailyLimit}次），明日0点重置`)
  }
  
  return {
    used: todayUsage,
    limit: dailyLimit,
    remaining: dailyLimit - todayUsage
  }
}

// 获取今日使用次数
async function getTodayUsageCount(userId) {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  
  try {
    const usageQuery = await db.collection('works')
      .where({
        userId: userId,
        status: db.command.neq('failed'), // 不计算失败的生成
        createdAt: db.command.gte(startOfDay).and(db.command.lt(endOfDay))
      })
      .count()
    
    return usageQuery.total || 0
  } catch (error) {
    console.error('获取今日使用次数失败:', error)
    return 0
  }
}

// 获取用户类型
function getUserType(user) {
  if (user.userType === 'admin') return 'admin'
  if (user.vipLevel > 0) return 'vip'
  return 'free'
}

// 获取下次重置时间
function getNextResetTime() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
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

  // 获取用户类型并检查每日限制
  const userType = getUserType(user)
  console.log(`用户类型: ${userType}, VIP等级: ${user.vipLevel}`)
  
  try {
    const limitCheck = await checkDailyLimit(user._id, userType)
    console.log('每日限制检查通过:', limitCheck)
  } catch (limitError) {
    console.error('每日限制检查失败:', limitError.message)
    throw limitError
  }

  // 检查积分（VIP用户不消耗积分）
  if (userType === 'free' && user.credits <= 0) {
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

    // 保存作品记录 - 增加错误处理和重试机制
    let workSaved = false
    let retryCount = 0
    const maxRetries = 3

    while (!workSaved && retryCount < maxRetries) {
      try {
        console.log(`尝试保存作品记录，第${retryCount + 1}次...`)
        await db.collection('works').add({
          data: work
        })
        workSaved = true
        console.log('✅ 作品记录保存成功')
      } catch (saveError) {
        retryCount++
        console.error(`❌ 作品记录保存失败 (尝试${retryCount}/${maxRetries}):`, saveError)
        
        if (retryCount >= maxRetries) {
          // 最后一次尝试失败，记录详细错误信息
          console.error('🚨 作品记录保存彻底失败，用户数据可能丢失!')
          
          // 尝试保存紧急备份记录
          try {
            await db.collection('emergency_backup').add({
              data: {
                ...work,
                backupReason: 'works_collection_save_failed',
                originalError: saveError.message,
                retryCount: retryCount,
                timestamp: new Date()
              }
            })
            console.log('💾 紧急备份记录已保存')
          } catch (backupError) {
            console.error('🆘 连紧急备份都失败了:', backupError)
          }
          
          throw new Error('数据保存失败，请稍后重试')
        } else {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }
      }
    }

    // 更新用户积分和生成次数 - 增加错误处理
    try {
      const updateData = {
        generateCount: db.command.inc(1)
      }
      
      // 只有免费用户需要扣除积分
      if (userType === 'free') {
        updateData.credits = db.command.inc(-1)
      }

      await db.collection('users').doc(user._id).update({
        data: updateData
      })
      console.log('✅ 用户信息更新成功')
    } catch (userUpdateError) {
      console.error('⚠️  用户信息更新失败，但作品已保存:', userUpdateError)
      // 用户信息更新失败不影响作品记录，继续执行
    }

    // 获取更新后的今日使用次数
    let updatedUsage = 0
    try {
      updatedUsage = await getTodayUsageCount(user._id)
    } catch (countError) {
      console.error('⚠️  获取今日使用次数失败:', countError)
      // 使用默认值，不影响主流程
    }
    
    const dailyLimit = DAILY_LIMITS[userType]

    return {
      code: 200,
      message: '图片生成成功',
      data: {
        workId: work.id,
        imageUrl: work.imageUrl,
        prompt: work.prompt,
        enhancedPrompt: work.enhancedPrompt,
        remainingCredits: userType === 'free' ? Math.max(0, user.credits - 1) : 999,
        dailyUsage: {
          used: updatedUsage,
          limit: dailyLimit,
          remaining: Math.max(0, dailyLimit - updatedUsage)
        }
      }
    }

  } catch (aiError) {
    console.error('AI生成失败:', aiError)
    
    // 记录失败的生成请求 - 增加错误处理
    try {
      const failedWork = {
        id: `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user._id,
        openid: user.openid || null,
        prompt: fullPrompt,
        originalPrompt: prompt,
        character,
        style,
        emotion,
        mode,
        status: 'failed',
        errorMessage: aiError.message,
        createdAt: new Date()
      }

      await db.collection('works').add({
        data: failedWork
      })
      console.log('✅ 失败记录已保存')
    } catch (failSaveError) {
      console.error('❌ 连失败记录都保存不了:', failSaveError)
      
      // 尝试保存到紧急备份
      try {
        await db.collection('emergency_backup').add({
          data: {
            userId: user._id,
            prompt: fullPrompt,
            status: 'failed',
            errorMessage: aiError.message,
            backupReason: 'failed_record_save_failed',
            timestamp: new Date()
          }
        })
        console.log('💾 失败记录的紧急备份已保存')
      } catch (backupError) {
        console.error('🆘 失败记录的紧急备份也失败了:', backupError)
      }
    }

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