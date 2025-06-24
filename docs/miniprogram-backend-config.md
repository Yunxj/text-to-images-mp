# 📱 小程序后端服务配置指南

## 🎯 配置概览

既然你的Vercel已经部署成功，小程序代码也上传了，现在需要完成以下配置让它们连接起来：

## 📋 配置清单

### ✅ 1. 获取你的Vercel部署URL

在Vercel控制台中找到你的部署URL，格式类似：
```
https://your-project-name-xxx.vercel.app
```

### ✅ 2. 更新小程序API配置

#### 原生小程序配置 (`miniprogram/utils/api.js`)
```javascript
// 将这行：
const API_BASE_URL = 'https://your-project.vercel.app/api'

// 替换为你的实际URL：
const API_BASE_URL = 'https://your-actual-vercel-url.vercel.app/api'
```

#### Taro版本配置 (`taro-mvp/src/services/api.ts`)
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api'
  : 'https://your-actual-vercel-url.vercel.app/api'
```

### ✅ 3. 微信小程序域名配置

在微信小程序管理后台配置合法域名：

1. 登录 [微信小程序管理后台](https://mp.weixin.qq.com)
2. 进入 `开发` -> `开发管理` -> `开发设置`
3. 在 `服务器域名` 中添加：

```
request合法域名：https://your-actual-vercel-url.vercel.app
```

### ✅ 4. 测试后端服务

使用以下方法测试你的后端是否正常：

#### 浏览器测试
访问：`https://your-actual-vercel-url.vercel.app/health`

预期返回：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

#### 命令行测试
```bash
curl https://your-actual-vercel-url.vercel.app/health
```

### ✅ 5. 测试小程序API调用

在小程序开发工具中测试：

```javascript
// 在小程序页面中调用
const { aiAPI } = require('../../utils/api')

// 测试服务状态
aiAPI.checkServiceStatus()
  .then(result => {
    console.log('API连接成功:', result)
  })
  .catch(error => {
    console.error('API连接失败:', error)
  })
```

### ✅ 6. 配置环境变量

确保Vercel中已配置所有必要的环境变量：

```bash
DEEPSEEK_API_KEY=你的DeepSeek密钥
ZHIPU_API_KEY=你的智谱AI密钥
JWT_SECRET=你的JWT密钥
NODE_ENV=production
```

## 🚀 完整流程示例

### Step 1: 获取Vercel URL
假设你的Vercel URL是：`https://ai-image-backend-abc123.vercel.app`

### Step 2: 更新API配置
```javascript
// miniprogram/utils/api.js
const API_BASE_URL = 'https://ai-image-backend-abc123.vercel.app/api'
```

### Step 3: 配置小程序域名
在微信小程序后台添加：`https://ai-image-backend-abc123.vercel.app`

### Step 4: 测试连接
访问：`https://ai-image-backend-abc123.vercel.app/health`

### Step 5: 上传小程序代码
在微信开发者工具中重新上传代码

## 🐛 常见问题

### Q1: 小程序报"不在以下 request 合法域名列表中"
**解决方案**：在微信小程序后台配置合法域名

### Q2: API调用返回401错误
**解决方案**：检查JWT_SECRET环境变量是否配置正确

### Q3: 提示"网络请求失败"
**解决方案**：
1. 检查Vercel部署是否成功
2. 确认API_BASE_URL配置正确
3. 测试后端健康检查接口

### Q4: CORS跨域问题
**解决方案**：后端已配置CORS，如有问题检查Vercel部署日志

## 📞 支持

如果遇到问题，请提供：
1. Vercel部署URL
2. 小程序错误截图
3. 浏览器访问/health接口的结果

---

🎉 **配置完成后，你的AI图片生成小程序就可以完整使用了！** 