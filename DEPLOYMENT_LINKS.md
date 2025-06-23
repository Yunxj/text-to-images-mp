# 🚀 一键部署链接

## Vercel一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/text-to-images-mp&project-name=ai-image-backend&repository-name=ai-image-backend&env=DEEPSEEK_API_KEY,ZHIPU_API_KEY,JWT_SECRET,NODE_ENV&envDescription=API配置和JWT密钥&envLink=https://github.com/yourusername/text-to-images-mp%23environment-variables&root-directory=ai-backend)

## Railway一键部署  
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ai-image-backend)

## Render一键部署
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/text-to-images-mp)

## 环境变量配置

无论选择哪个平台，都需要配置以下环境变量：

```bash
DEEPSEEK_API_KEY=sk-33eee9a37ac841d9b6424700de95c546
ZHIPU_API_KEY=你的智谱AI密钥
JWT_SECRET=my-super-secret-jwt-key-2024  
NODE_ENV=production
```

## 部署后步骤

1. 获取部署URL（如：https://your-app.vercel.app）
2. 更新小程序API地址
3. 在微信小程序后台配置域名
4. 测试API接口

## 测试部署是否成功

```bash
curl https://your-app.vercel.app/api/health
```

预期返回：
```json
{
  "code": 200, 
  "message": "API服务正常"
}
``` 