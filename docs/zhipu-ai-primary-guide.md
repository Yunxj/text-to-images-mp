# 智谱AI主要服务配置指南

## 概述

本项目已完全切换为以智谱AI（GLM-4V CogView-3）作为主要的图像生成服务，提供稳定、高质量的AI图像生成功能。

## 智谱AI服务优势

### 🎯 技术优势
- **稳定可靠**: 智谱AI提供企业级稳定服务
- **中文优化**: 对中文语言理解更好，生成效果更佳
- **高质量**: GLM-4V CogView-3模型生成的图像质量优秀
- **成本合理**: 约0.1元/张，性价比高

### 🚀 集成优势
- **简单配置**: 只需API密钥，无需复杂的端点配置
- **快速响应**: 平均生成时间较短
- **良好文档**: 官方文档完善，API稳定

## 配置步骤

### 1. 获取智谱AI API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册并登录账户
3. 进入控制台，创建API密钥
4. 复制生成的API密钥

### 2. 环境变量配置

在项目根目录的 `.env` 文件中设置：

```bash
# 智谱AI配置（主要图像生成服务）
ZHIPU_API_KEY=your_zhipu_api_key_here

# DeepSeek配置（提示词生成服务）
DEEPSEEK_API_KEY=sk-33eee9a37ac841d9b6424700de95c546

# 其他基础配置
JWT_SECRET=ai-text-to-image-secret-key-2024
DATABASE_URL=./data/ai-image-app.db
PORT=3000
NODE_ENV=development
```

### 3. 服务架构

```
用户输入 → DeepSeek (提示词优化) → 智谱AI (图像生成) → 返回结果
```

## 服务状态说明

### ✅ 智谱AI可用时
- 使用智谱AI GLM-4V CogView-3生成高质量图像
- 生成时间：通常15-30秒
- 图像尺寸：1024x1024
- 输出格式：URL链接

### ⚠️ 智谱AI不可用时
- 自动回退到模拟模式
- 使用占位图片确保服务连续性
- 不影响系统其他功能

## 技术实现

### 服务配置
```javascript
{
  name: 'zhipu',
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'cogview-3',
  type: 'image_generator',
  enabled: !!process.env.ZHIPU_API_KEY,
  priority: 1,
  description: '智谱AI GLM-4V CogView-3 - 主要图像生成服务'
}
```

### API调用格式
```javascript
const requestData = {
  model: 'cogview-3',
  prompt: enhancedPrompt,
  size: "1024x1024",
  n: 1,
  quality: "standard",
  response_format: "url"
};
```

## 使用示例

### 启动服务
```bash
cd ai-backend
npm run dev
```

### 测试图像生成
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "prompt": "美丽的樱花盛开的春天",
    "style": "油画风格"
  }'
```

## 错误处理

### 常见错误及解决方案

#### 1. API密钥错误 (401)
```
错误: API密钥无效或过期
解决: 检查ZHIPU_API_KEY是否正确设置
```

#### 2. 请求参数错误 (400)
```
错误: 请求参数错误，可能是prompt格式问题
解决: 检查输入提示词是否符合要求
```

#### 3. 请求频率限制 (429)
```
错误: 请求频率过高，触发限流
解决: 稍等片刻后重试，或升级API套餐
```

#### 4. 网络连接问题
```
错误: 网络连接问题，无法访问智谱AI服务
解决: 检查网络连接，确认服务可访问性
```

## 监控和日志

### 服务状态检查
访问: `http://localhost:3000/api/ai/status`

返回示例：
```json
{
  "services": [
    {
      "name": "deepseek",
      "type": "prompt_generator",
      "enabled": true
    },
    {
      "name": "zhipu",
      "type": "image_generator", 
      "enabled": true
    }
  ]
}
```

### 日志输出
```
步骤1: 使用 deepseek 生成提示词
DeepSeek生成的提示词: A beautiful cherry blossom scene in spring...
步骤2: 使用 zhipu 生成图片
智谱AI CogView-3图片生成API...
智谱AI生成图片成功，URL: https://...
两步生成完成，作品ID: 507f1f77bcf86cd799439011
```

## 成本预估

- **智谱AI图像生成**: 约0.1元/张
- **DeepSeek提示词优化**: 约0.001元/次
- **总成本**: 约0.101元/张图片

## 下一步发展

1. **质量优化**: 继续优化提示词生成算法
2. **速度提升**: 实现图像生成缓存机制
3. **功能扩展**: 支持更多图像尺寸和风格
4. **成本控制**: 实现智能的请求频率控制

## 支持与反馈

如遇到问题，请检查：
1. API密钥是否正确配置
2. 网络连接是否正常
3. 服务日志中的错误信息
4. 账户余额是否充足

---

**智谱AI主要服务配置完成！现在您可以享受稳定、高质量的AI图像生成服务。** 