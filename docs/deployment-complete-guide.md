# 完整部署发布指南

## 🚀 部署架构概览

```
部署流程图：
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端部署       │    │   后端部署       │    │   数据库部署     │
│                │    │                │    │                │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │微信小程序  │  │    │  │ Serverless │  │    │  │ MongoDB   │  │
│  │审核发布   │  │    │  │ 函数部署   │  │    │  │ Atlas     │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                │    │                │    │                │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ H5页面    │  │    │  │ API网关    │  │    │  │ 数据初始化 │  │
│  │ CDN部署   │  │    │  │ 域名配置   │  │    │  │ 索引优化   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📅 部署时间规划

### 总体时间：3-5天
- **Day 1**: 数据库部署 (2-4小时)
- **Day 2**: 后端部署 (4-6小时)  
- **Day 3**: 前端构建和测试 (4-6小时)
- **Day 4**: 小程序审核提交 (1小时 + 1-3天审核)
- **Day 5**: 域名配置和上线 (2-3小时)

## 🗄️ 第一步：数据库部署

### 1.1 MongoDB Atlas 部署

#### 快速部署（推荐）
```bash
# 1. 安装依赖
npm install mongodb

# 2. 运行自动化脚本
npm run db:setup

# 3. 按提示输入连接信息
# 选择生产环境配置
```

#### 手动部署步骤
```yaml
步骤1: 注册MongoDB Atlas
  - 访问: https://www.mongodb.com/atlas
  - 注册免费账号
  - 邮箱验证

步骤2: 创建生产集群
  - Provider: AWS
  - Region: Asia Pacific (Singapore) 
  - Tier: M0 (免费) 或 M2 ($9/月)
  - Cluster Name: ai-image-prod

步骤3: 配置安全访问
  - Database User: 创建强密码用户
  - Network Access: 配置IP白名单
  - 获取连接字符串

步骤4: 初始化数据
  - 运行初始化脚本
  - 创建索引
  - 插入基础数据
```

#### 生产环境配置
```javascript
// 生产数据库配置
{
  uri: "mongodb+srv://admin:strong_password@ai-image-prod.xxxxx.mongodb.net/ai_image_prod",
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority'
  }
}
```

### 1.2 数据库备份策略
```bash
# 设置自动备份
# MongoDB Atlas 免费版包含2天备份
# M2及以上版本支持7天备份

# 手动备份脚本
mongoexport --uri="mongodb+srv://..." --collection=users --out=backup/users.json
mongoexport --uri="mongodb+srv://..." --collection=works --out=backup/works.json
```

## 🖥️ 第二步：后端部署 (Serverless)

### 2.1 准备部署环境

#### 选择云服务商
```yaml
推荐选项:
  1. 腾讯云 SCF (国内用户推荐)
     - 免费额度: 100万次调用/月
     - 延迟: 低 (国内)
     - 备案: 需要

  2. AWS Lambda (海外用户推荐)  
     - 免费额度: 100万次调用/月
     - 延迟: 中等
     - 备案: 不需要

  3. Vercel (快速部署推荐)
     - 免费额度: 100GB带宽/月
     - 延迟: 低
     - 备案: 不需要
```

### 2.2 腾讯云SCF部署（推荐国内用户）

#### 安装和配置
```bash
# 1. 安装Serverless CLI
npm install -g serverless

# 2. 安装腾讯云插件
npm install serverless-tencent

# 3. 配置腾讯云密钥
serverless config credentials --provider tencent --key your_secret_id --secret your_secret_key
```

#### 创建后端项目
```bash
# 1. 创建后端目录
mkdir backend
cd backend

# 2. 初始化NestJS项目
npm i -g @nestjs/cli
nest new ai-image-backend

# 3. 安装Serverless适配器
npm install @nestjs/platform-express
npm install aws-serverless-express
npm install serverless-http
```

#### Serverless配置文件
```yaml
# serverless.yml
service: ai-image-backend

provider:
  name: tencent
  runtime: Nodejs18.15
  region: ap-beijing
  credentials: ~/.tencent/credentials

functions:
  api:
    handler: dist/lambda.handler
    events:
      - apigw:
          path: /{proxy+}
          method: ANY
          cors: true
    environment:
      NODE_ENV: production
      MONGODB_URI: ${env:MONGODB_URI}
      DEEPSEEK_API_KEY: ${env:DEEPSEEK_API_KEY}
      DOUBAO_API_KEY: ${env:DOUBAO_API_KEY}
    timeout: 30
    memorySize: 512

plugins:
  - serverless-tencent
  - serverless-plugin-typescript

custom:
  typescript:
    tsConfigFileLocation: './tsconfig.json'
```

#### Lambda适配器
```typescript
// src/lambda.ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import { createServer, proxy } from 'aws-serverless-express';

let server;

async function createNestServer() {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter);
  app.enableCors();
  app.setGlobalPrefix('api');
  
  await app.init();
  return createServer(expressApp);
}

export const handler = async (event, context) => {
  if (!server) {
    server = await createNestServer();
  }
  return proxy(server, event, context, 'PROMISE').promise;
};
```

#### 部署命令
```bash
# 1. 构建项目
npm run build

# 2. 部署到腾讯云
serverless deploy

# 3. 查看部署结果
serverless info

# 输出示例:
# Service: ai-image-backend
# Stage: dev
# Region: ap-beijing
# API Gateway: https://service-xxx.bj.apigw.tencentcs.com/release/
```

### 2.3 Vercel部署（推荐快速部署）

#### 安装Vercel CLI
```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login
```

#### Vercel配置
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/lambda.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/dist/lambda.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "MONGODB_URI": "@mongodb_uri",
    "DEEPSEEK_API_KEY": "@deepseek_api_key"
  }
}
```

#### 部署到Vercel
```bash
# 1. 构建项目
npm run build

# 2. 部署
vercel --prod

# 3. 设置环境变量
vercel env add MONGODB_URI
vercel env add DEEPSEEK_API_KEY

# 输出示例:
# ✅ Production: https://ai-image-backend.vercel.app
```

### 2.4 环境变量配置

#### 生产环境变量
```bash
# .env.production
NODE_ENV=production
MONGODB_URI=mongodb+srv://admin:password@ai-image-prod.xxxxx.mongodb.net/ai_image_prod
DEEPSEEK_API_KEY=your_deepseek_api_key
DOUBAO_API_KEY=your_doubao_api_key
TONGYI_API_KEY=your_tongyi_api_key
WENXIN_API_KEY=your_wenxin_api_key

# 文件上传配置
COS_SECRET_ID=your_cos_secret_id
COS_SECRET_KEY=your_cos_secret_key
COS_BUCKET=ai-image-bucket
COS_REGION=ap-beijing

# 微信小程序配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
```

## 📱 第三步：前端部署

### 3.1 Taro多端构建

#### 安装Taro CLI
```bash
# 1. 安装Taro CLI
npm install -g @tarojs/cli

# 2. 创建Taro项目
taro init ai-image-frontend
cd ai-image-frontend

# 3. 安装依赖
npm install
```

#### 配置API地址
```typescript
// src/config/api.ts
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000/api',
  },
  production: {
    baseURL: 'https://ai-image-backend.vercel.app/api',
    // 或腾讯云: 'https://service-xxx.bj.apigw.tencentcs.com/release/api'
  }
};

export const API_BASE_URL = API_CONFIG[process.env.NODE_ENV || 'development'].baseURL;
```

#### 多端构建
```bash
# 1. 微信小程序
npm run build:weapp

# 2. H5版本
npm run build:h5

# 3. 支付宝小程序
npm run build:alipay

# 4. 构建所有平台
npm run build:all
```

### 3.2 微信小程序发布

#### 小程序配置
```json
// project.config.json
{
  "miniprogramRoot": "dist/",
  "projectname": "ai-image-generator",
  "description": "AI文字生成图片小程序",
  "appid": "your_wechat_app_id",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram"
}
```

#### 发布流程
```yaml
步骤1: 微信开发者工具
  - 下载安装微信开发者工具
  - 导入项目 (dist目录)
  - 填写AppID

步骤2: 本地测试
  - 真机预览测试
  - 功能完整性检查
  - 性能测试

步骤3: 上传代码
  - 点击"上传"按钮
  - 填写版本号和备注
  - 确认上传

步骤4: 提交审核
  - 登录微信公众平台
  - 开发管理 -> 开发版本
  - 提交审核并填写信息

步骤5: 发布上线
  - 审核通过后点击"发布"
  - 选择发布时间
  - 确认发布
```

#### 审核注意事项
```yaml
审核要点:
  - 功能描述准确
  - 隐私政策完整
  - 用户协议规范
  - 内容合规检查
  - 支付功能(如有)需要资质

常见审核问题:
  - API域名未配置
  - 功能描述不符
  - 缺少必要页面
  - 用户隐私问题
```

### 3.3 H5版本部署

#### 静态资源部署
```bash
# 1. 构建H5版本
npm run build:h5

# 2. 部署到CDN
# 选项1: 腾讯云COS
npm install cos-nodejs-sdk-v5
node scripts/deploy-h5-cos.js

# 选项2: 阿里云OSS
npm install ali-oss
node scripts/deploy-h5-oss.js

# 选项3: Vercel静态部署
vercel --prod
```

#### CDN部署脚本
```javascript
// scripts/deploy-h5-cos.js
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

async function uploadDir(localPath, remotePath) {
  const files = fs.readdirSync(localPath);
  
  for (const file of files) {
    const filePath = path.join(localPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await uploadDir(filePath, `${remotePath}/${file}`);
    } else {
      await cos.putObject({
        Bucket: 'ai-image-h5-1234567890',
        Region: 'ap-beijing',
        Key: `${remotePath}/${file}`,
        Body: fs.createReadStream(filePath),
      });
      console.log(`Uploaded: ${remotePath}/${file}`);
    }
  }
}

// 部署H5文件
uploadDir('./dist/h5', '').then(() => {
  console.log('H5部署完成！');
  console.log('访问地址: https://ai-image-h5-1234567890.cos.ap-beijing.myqcloud.com');
});
```

## 🌐 第四步：域名和SSL配置

### 4.1 域名购买和备案

#### 域名选择
```yaml
推荐域名:
  - .com: 国际通用，价格适中
  - .cn: 国内域名，需要备案
  - .top: 便宜选择
  - .tech: 技术相关

购买渠道:
  - 腾讯云: 便宜，集成度高
  - 阿里云: 稳定，服务好  
  - Cloudflare: 国际化，功能强
```

#### 备案流程（国内域名）
```yaml
备案步骤:
  1. 准备材料:
     - 营业执照(企业) / 身份证(个人)
     - 域名证书
     - 服务器信息

  2. 提交申请:
     - 云服务商备案系统
     - 填写备案信息
     - 上传证件照片

  3. 初审通过:
     - 邮寄资料或现场核验
     - 等待管局审核

  4. 备案完成:
     - 获得备案号
     - 配置DNS解析

时间: 7-20个工作日
```

### 4.2 DNS解析配置

#### 解析记录配置
```yaml
DNS记录:
  # 主域名
  A记录:
    - 主机记录: @
    - 记录值: 服务器IP地址
    - TTL: 600

  # www子域名  
  CNAME记录:
    - 主机记录: www
    - 记录值: your-domain.com
    - TTL: 600

  # API子域名
  CNAME记录:
    - 主机记录: api
    - 记录值: ai-image-backend.vercel.app
    - TTL: 600

  # H5子域名
  CNAME记录:
    - 主机记录: h5
    - 记录值: cdn-domain.com
    - TTL: 600
```

### 4.3 SSL证书配置

#### 免费SSL证书
```bash
# 1. Let's Encrypt (推荐)
# 自动续期，免费

# 2. 云服务商免费证书
# 腾讯云、阿里云都提供免费SSL证书

# 3. Cloudflare SSL
# 全球CDN + 免费SSL
```

#### SSL配置示例
```nginx
# Nginx SSL配置
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 第五步：监控和运维

### 5.1 监控配置

#### 应用监控
```yaml
监控指标:
  - API响应时间
  - 错误率统计
  - 用户活跃度
  - 数据库性能
  - 服务器资源

监控工具:
  - 腾讯云APM
  - 阿里云ARMS
  - Sentry (错误监控)
  - Google Analytics (用户行为)
```

#### 告警配置
```javascript
// 监控告警配置
const alertConfig = {
  apiResponseTime: {
    threshold: 2000, // 2秒
    action: 'email + sms'
  },
  errorRate: {
    threshold: 0.05, // 5%
    action: 'immediate notification'
  },
  databaseConnections: {
    threshold: 80, // 80%使用率
    action: 'email notification'
  }
};
```

### 5.2 日志管理

#### 日志收集
```typescript
// 日志配置
import { Logger } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger('Application');

  logApiCall(method: string, url: string, responseTime: number) {
    this.logger.log(`${method} ${url} - ${responseTime}ms`);
  }

  logError(error: Error, context: string) {
    this.logger.error(`Error in ${context}: ${error.message}`, error.stack);
  }

  logUserAction(userId: string, action: string, metadata: any) {
    this.logger.log(`User ${userId} performed ${action}`, metadata);
  }
}
```

### 5.3 备份策略

#### 自动备份脚本
```bash
#!/bin/bash
# backup.sh - 每日自动备份脚本

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/$DATE"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mongoexport --uri="$MONGODB_URI" --collection=users --out="$BACKUP_DIR/users.json"
mongoexport --uri="$MONGODB_URI" --collection=works --out="$BACKUP_DIR/works.json"

# 压缩备份文件
tar -czf "$BACKUP_DIR.tar.gz" $BACKUP_DIR

# 上传到云存储
cos cp "$BACKUP_DIR.tar.gz" cos://backup-bucket/database/

# 清理本地文件
rm -rf $BACKUP_DIR
rm "$BACKUP_DIR.tar.gz"

echo "Backup completed: $DATE"
```

## 🚀 第六步：上线检查清单

### 6.1 上线前检查

#### 功能测试
```yaml
✅ 用户注册登录
✅ 图片生成功能
✅ 支付功能(如有)
✅ 分享功能
✅ 多端兼容性
✅ 性能测试
✅ 安全测试
```

#### 配置检查
```yaml
✅ 域名解析正确
✅ SSL证书有效
✅ API接口可访问
✅ 数据库连接正常
✅ 环境变量配置
✅ 监控告警设置
✅ 备份策略执行
```

### 6.2 发布流程

#### 灰度发布
```yaml
阶段1 (10%用户):
  - 新用户优先体验
  - 监控关键指标24小时
  - 无问题后进入下一阶段

阶段2 (50%用户):
  - 扩大用户范围
  - 压力测试
  - 监控72小时

阶段3 (100%用户):
  - 全量发布
  - 持续监控
  - 准备快速回滚
```

#### 回滚预案
```bash
# 快速回滚脚本
#!/bin/bash
echo "开始回滚..."

# 1. 回滚后端
serverless deploy --stage stable

# 2. 回滚前端
cos sync cos://backup-bucket/frontend/stable/ cos://ai-image-h5/

# 3. 通知相关人员
curl -X POST "$WEBHOOK_URL" -d '{"text":"系统已回滚到稳定版本"}'

echo "回滚完成"
```

## 💰 成本预估

### 完整部署成本
```yaml
月度成本预估 (1000 DAU):
  - 域名: ¥55/年 ≈ ¥5/月
  - SSL证书: 免费
  - MongoDB Atlas: ¥0 (免费版)
  - Serverless: ¥30/月
  - CDN: ¥20/月
  - 监控: ¥10/月
  - 总计: ¥65/月

扩展成本 (10000 DAU):
  - 域名: ¥5/月
  - MongoDB Atlas: ¥60/月 (M2)
  - Serverless: ¥200/月
  - CDN: ¥100/月
  - 监控: ¥50/月
  - 总计: ¥415/月
```

## 📞 技术支持

### 常见问题解决

1. **部署失败**
   - 检查环境变量配置
   - 验证API密钥有效性
   - 查看部署日志

2. **域名访问失败**
   - 检查DNS解析
   - 验证SSL证书
   - 确认服务器状态

3. **小程序审核被拒**
   - 查看审核意见
   - 修改相关问题
   - 重新提交审核

### 联系方式
- 技术支持: 查看云服务商文档
- 社区支持: GitHub Issues
- 紧急支持: 保留云服务商技术支持联系方式

---

🎉 **恭喜！** 按照以上步骤，您的AI文字生成图片应用就可以成功上线了！

记住定期检查监控指标，及时处理用户反馈，持续优化产品体验。