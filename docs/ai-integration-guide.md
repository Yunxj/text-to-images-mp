# 🤖 AI服务集成指南

## 当前状态

### ✅ 已完成功能
- 用户登录系统（游客/微信登录）
- 云函数架构搭建
- 前端界面和交互逻辑
- 数据库设计和配置
- 作品管理系统

### 🔄 当前使用模拟AI服务
目前 `callZhipuAI` 函数使用的是模拟实现：
```javascript
// 当前模拟实现
async function callZhipuAI(prompt, style) {
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const mockImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`
  
  return {
    imageUrl: mockImageUrl,
    enhancedPrompt: `${style} style, ${prompt}, high quality, detailed`
  }
}
```

## 🎯 集成真实AI服务

### 选项1：智谱AI (GLM-4V)
智谱AI提供图片生成服务，适合中国开发者使用。

#### 1. 申请API Key
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册账号并申请API Key
3. 查看[图片生成API文档](https://open.bigmodel.cn/dev/api#cogview)

#### 2. 配置环境变量
在云开发控制台添加环境变量：
```
ZHIPU_API_KEY=your_api_key_here
ZHIPU_API_URL=https://open.bigmodel.cn/api/paas/v4/
```

#### 3. 更新云函数实现
```javascript
async function callZhipuAI(prompt, style) {
  const apiKey = process.env.ZHIPU_API_KEY
  
  if (!apiKey) {
    console.warn('智谱AI API Key未配置，使用模拟数据')
    return mockResponse(prompt, style)
  }

  try {
    const response = await wx.cloud.callFunction({
      name: 'zhipuAPI',
      data: {
        model: 'cogview-3',
        prompt: `${style} style, ${prompt}, high quality, detailed`,
        size: '512x512'
      }
    })

    return {
      imageUrl: response.result.data[0].url,
      enhancedPrompt: response.result.prompt
    }
  } catch (error) {
    console.error('智谱AI调用失败:', error)
    return mockResponse(prompt, style)
  }
}
```

### 选项2：Midjourney API
通过第三方服务调用Midjourney。

#### 1. 选择服务商
- [GoAPI](https://goapi.ai/) - 提供Midjourney API
- [Replicate](https://replicate.com/) - AI模型托管平台

#### 2. 实现示例
```javascript
async function callMidjourneyAPI(prompt, style) {
  const response = await fetch('https://api.goapi.ai/midjourney/v1/imagine', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MIDJOURNEY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: `${prompt} --style ${style} --quality 2`,
      webhook_url: 'your_webhook_endpoint'
    })
  })
  
  return await response.json()
}
```

### 选项3：Stable Diffusion
开源解决方案，可以自部署。

#### 1. 使用云服务
- [Stability AI API](https://platform.stability.ai/)
- [Replicate Stable Diffusion](https://replicate.com/stability-ai/stable-diffusion)

#### 2. 实现示例
```javascript
async function callStableDiffusion(prompt, style) {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text_prompts: [{ text: `${style} style, ${prompt}` }],
      cfg_scale: 7,
      height: 512,
      width: 512,
      samples: 1
    })
  })
  
  const result = await response.json()
  return {
    imageUrl: `data:image/png;base64,${result.artifacts[0].base64}`,
    enhancedPrompt: prompt
  }
}
```

## 🔧 快速修复当前显示问题

### 1. 更新结果页面样式
确保图片能正确显示：

```wxss
.generated-image {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.image-card {
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

### 2. 添加图片加载状态
```javascript
// 结果页面添加图片加载处理
onImageLoad() {
  console.log('图片加载成功')
},

onImageError(e) {
  console.error('图片加载失败:', e)
  wx.showToast({
    title: '图片加载失败',
    icon: 'none'
  })
}
```

### 3. 临时使用更好的占位图
```javascript
// 暂时使用更稳定的占位图服务
const mockImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`
// 或者使用
const mockImageUrl = `https://source.unsplash.com/512x512/?${encodeURIComponent(prompt)}`
```

## 📅 实施计划

### 阶段1：修复显示问题 (1小时)
- [x] 修复参数传递
- [ ] 测试图片显示
- [ ] 优化用户体验

### 阶段2：接入AI服务 (1-2天)
- [ ] 选择AI服务商
- [ ] 申请API密钥
- [ ] 实现真实API调用
- [ ] 错误处理和降级方案

### 阶段3：优化和扩展 (3-5天)
- [ ] 多种AI模型支持
- [ ] 图片质量控制
- [ ] 批量生成功能
- [ ] 高级参数配置

## 💡 推荐方案

对于中国开发者，推荐使用**智谱AI**：
- 国内访问稳定
- 中文支持良好
- 价格相对合理
- 文档完善

## 🚀 立即开始

1. 先测试当前修复是否解决显示问题
2. 如果需要真实AI服务，按照上述智谱AI集成步骤操作
3. 有问题随时查看文档或寻求支持

---

**注意**：集成真实AI服务会产生API调用费用，建议先少量测试，确认效果后再大规模使用。 