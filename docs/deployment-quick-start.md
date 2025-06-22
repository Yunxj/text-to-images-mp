# 🚀 部署快速开始指南

## 📋 准备工作（5分钟）

### 1. 环境要求
```bash
# 检查Node.js版本（需要18+）
node --version

# 检查npm版本
npm --version

# 检查Git
git --version
```

### 2. 克隆项目
```bash
git clone https://github.com/yourusername/text-to-images-mp.git
cd text-to-images-mp
npm install
```

## 🎯 一键部署（30分钟）

### 快速部署命令
```bash
# 一键部署所有组件
npm run deploy

# 或者分步部署
npm run db:setup        # 数据库部署
npm run deploy:backend  # 后端部署  
npm run deploy:h5       # H5部署
```

### 部署选项
运行 `npm run deploy` 后，选择部署模式：

1. **🚀 完整部署** - 数据库 + 后端 + 前端（推荐新项目）
2. **🗄️ 仅数据库** - 只部署MongoDB Atlas
3. **🖥️ 仅后端** - 只部署Serverless API
4. **📱 仅前端** - 只部署小程序和H5
5. **⚙️ 自定义** - 自选组件

## 📊 部署时间预估

| 组件 | 时间 | 说明 |
|------|------|------|
| 数据库 | 5-10分钟 | MongoDB Atlas配置 |
| 后端 | 10-15分钟 | Serverless函数部署 |
| H5前端 | 5-10分钟 | 静态资源上传CDN |
| 小程序 | 1-3天 | 需要微信审核 |

## 🔧 配置信息准备

### MongoDB Atlas
- 注册账号：https://www.mongodb.com/atlas
- 创建免费集群
- 获取连接字符串

### AI服务密钥
- DeepSeek：https://platform.deepseek.com/
- 豆包：https://console.volcengine.com/ark/
- 通义千问：https://dashscope.aliyun.com/
- 文心一言：https://console.bce.baidu.com/qianfan/

### 云服务（选择一个）
- **Vercel**：https://vercel.com/ （推荐，免费）
- **腾讯云**：https://cloud.tencent.com/ （国内用户）
- **AWS**：https://aws.amazon.com/ （海外用户）

### 微信小程序
- AppID：微信公众平台获取
- AppSecret：微信公众平台获取

## 📱 部署流程详解

### 第一步：数据库部署
```bash
npm run db:setup
```
按提示输入：
- MongoDB连接字符串
- 数据库名称
- 选择环境（开发/生产）

### 第二步：后端部署
```bash
npm run deploy:backend
```
选择部署平台：
- Vercel（推荐新手）
- 腾讯云SCF（国内用户）
- AWS Lambda（海外用户）

配置环境变量：
- MONGODB_URI
- DEEPSEEK_API_KEY
- DOUBAO_API_KEY
- WECHAT_APP_ID
- WECHAT_APP_SECRET

### 第三步：前端部署
```bash
npm run deploy:h5
```
配置CDN：
- 腾讯云COS
- 阿里云OSS
- 或其他CDN服务

### 第四步：小程序发布
1. 使用微信开发者工具打开项目
2. 配置AppID和服务器域名
3. 上传代码到微信平台
4. 提交审核（1-3天）
5. 审核通过后发布

## ✅ 部署验证

### 1. 数据库连接测试
```bash
# 检查数据库连接
curl -X GET "你的API地址/api/health"
```

### 2. API接口测试
```bash
# 测试用户注册
curl -X POST "你的API地址/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

### 3. 前端访问测试
- H5地址：https://你的域名.com
- 小程序：微信搜索小程序名称

## 🔗 访问地址汇总

部署完成后，你将获得以下访问地址：

### API地址
- Vercel: `https://your-project.vercel.app/api`
- 腾讯云: `https://service-xxx.bj.apigw.tencentcs.com/release/api`
- AWS: `https://xxx.execute-api.us-east-1.amazonaws.com/prod/api`

### H5地址
- 腾讯云COS: `https://bucket-name.cos.region.myqcloud.com`
- 阿里云OSS: `https://bucket-name.oss-region.aliyuncs.com`
- 自定义域名: `https://your-domain.com`

### 小程序
- 开发版：微信开发者工具预览
- 体验版：扫码体验
- 正式版：微信搜索

## 🎛️ 环境变量配置

### 生产环境 (.env.production)
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DEEPSEEK_API_KEY=sk-xxxxx
DOUBAO_API_KEY=xxxxx
TONGYI_API_KEY=sk-xxxxx
WENXIN_API_KEY=xxxxx
WECHAT_APP_ID=wxxxxxxxxx
WECHAT_APP_SECRET=xxxxxxxx
COS_SECRET_ID=xxxxx
COS_SECRET_KEY=xxxxx
COS_BUCKET=ai-image-bucket
COS_REGION=ap-beijing
```

### 开发环境 (.env.development)
```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai_image_dev
DEEPSEEK_API_KEY=sk-xxxxx
# ... 其他配置
```

## 🚨 常见问题

### 1. 数据库连接失败
```bash
# 检查网络访问
ping cluster.mongodb.net

# 检查IP白名单
# MongoDB Atlas -> Network Access -> Add IP Address
```

### 2. Serverless部署失败
```bash
# 检查权限配置
# 确保API密钥有足够权限

# 重新部署
npm run deploy:backend
```

### 3. 小程序审核被拒
- 检查服务器域名配置
- 确保隐私政策完整
- 功能描述准确
- 内容合规检查

### 4. H5访问404
```bash
# 检查CDN配置
# 确保index.html存在
# 检查路由配置
```

## 📞 技术支持

### 文档资源
- 📖 [完整部署指南](./deployment-complete-guide.md)
- 🏗️ [技术架构文档](./tech-solution-v2.md)
- 📊 [数据库设计](./database-deployment-guide.md)

### 在线支持
- 🐛 [GitHub Issues](https://github.com/yourusername/text-to-images-mp/issues)
- 💬 [讨论区](https://github.com/yourusername/text-to-images-mp/discussions)
- 📧 Email: your-email@example.com

### 紧急联系
如遇到紧急问题，请：
1. 查看错误日志
2. 搜索已知问题
3. 提交详细的Issue
4. 联系技术支持

---

🎉 **恭喜！** 按照以上步骤，您的AI文字生成图片应用就可以快速上线了！

记住：
- ⚡ 完整部署约需30-60分钟
- 🔄 支持增量部署和回滚
- 📊 实时监控部署状态
- 🛠️ 自动化脚本简化操作 