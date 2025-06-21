# 技术架构文档

## 整体架构

### 系统架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   微信小程序端    │    │   云开发/后端     │    │   AI服务集成     │
│                │    │                │    │                │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │   首页    │  │    │  │  云函数   │  │    │  │ 文心一言  │  │
│  │(生成页面) │  │    │  │           │  │    │  │           │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                │    │                │    │                │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │  创意页   │  │    │  │  云数据库  │  │    │  │ 通义千问  │  │
│  │           │  │    │  │           │  │    │  │           │  │
│  └───────────┘  │◄──►│  └───────────┘  │◄──►│  └───────────┘  │
│                │    │                │    │                │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │  个人中心  │  │    │  │  云存储   │  │    │  │   豆包    │  │
│  │           │  │    │  │           │  │    │  │           │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 前端架构

### 目录结构
```
miniprogram/
├── pages/              # 页面文件
│   ├── index/          # 首页（生成页面）
│   │   ├── index.wxml  # 模板
│   │   ├── index.wxss  # 样式
│   │   ├── index.js    # 逻辑
│   │   └── index.json  # 配置
│   ├── creative/       # 创意页面
│   ├── profile/        # 个人中心
│   ├── result/         # 结果页面
│   └── gallery/        # 作品画廊
├── components/         # 自定义组件
│   ├── character-picker/  # 角色选择器
│   ├── text-input/        # 文本输入组件
│   └── image-preview/     # 图片预览组件
├── utils/              # 工具函数
│   ├── api.js          # API接口封装
│   ├── auth.js         # 用户认证
│   ├── storage.js      # 本地存储
│   └── constants.js    # 常量定义
├── images/             # 静态图片资源
├── app.js              # 小程序入口文件
├── app.json            # 小程序配置
└── app.wxss            # 全局样式
```

### 技术栈
- **框架**：微信小程序原生开发
- **状态管理**：页面级状态管理
- **网络请求**：wx.request + Promise封装
- **存储方案**：本地存储 + 云存储
- **UI组件**：原生组件 + 自定义组件

## 后端架构

### 云开发方案
```
cloudfunctions/
├── generateImage/      # 图片生成云函数
├── getUserInfo/        # 获取用户信息
├── saveWork/          # 保存作品
├── getTemplates/      # 获取模板列表
└── paymentCallback/   # 支付回调
```

### 数据库设计
```javascript
// 用户表 (users)
{
  _id: ObjectId,
  openid: String,
  nickname: String,
  avatar: String,
  isVip: Boolean,
  vipExpireTime: Date,
  credits: Number,
  createTime: Date,
  updateTime: Date
}

// 作品表 (works)
{
  _id: ObjectId,
  userId: String,
  prompt: String,          // 用户输入的描述
  images: Array,           // 生成的图片URLs
  character: Object,       // 选择的角色信息
  mode: String,           // 生成模式(single/double)
  textType: String,       // 文案类型
  emotion: String,        // 表情动作
  createTime: Date
}

// 模板表 (templates)
{
  _id: ObjectId,
  title: String,
  category: String,
  tags: Array,
  cover: String,
  preview: String,
  prompt: String,
  textStyle: String,
  isActive: Boolean,
  createTime: Date
}

// 角色表 (characters)
{
  _id: ObjectId,
  name: String,
  image: String,
  category: String,        // recommend/person/pet
  isVip: Boolean,         // 是否VIP专属
  tags: Array,
  prompt: String,         // 角色描述prompt
  createTime: Date
}
```

## AI服务集成

### 服务选择策略
```javascript
// AI服务优先级（优先使用国内服务）
const AI_SERVICES = [
  {
    name: '文心一言',
    provider: 'baidu',
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/text2image',
    priority: 1,
    features: ['文字生成图片', '高质量输出', '中文优化']
  },
  {
    name: '通义千问',
    provider: 'alibaba', 
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    priority: 2,
    features: ['多风格支持', '快速生成']
  },
  {
    name: '豆包',
    provider: 'bytedance',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/text2image',
    priority: 3,
    features: ['创意图片', '场景丰富']
  },
  {
    name: 'DeepSeek',
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/text2image',
    priority: 4,
    features: ['开源友好', '成本较低']
  }
]
```

### API调用封装
```javascript
// AI服务调用类
class AIService {
  constructor() {
    this.currentService = AI_SERVICES[0]
    this.fallbackIndex = 0
  }

  async generateImage(params) {
    try {
      const result = await this.callService(this.currentService, params)
      return result
    } catch (error) {
      // 失败时切换到备用服务
      return this.fallbackGenerate(params)
    }
  }

  async fallbackGenerate(params) {
    this.fallbackIndex++
    if (this.fallbackIndex >= AI_SERVICES.length) {
      throw new Error('所有AI服务都不可用')
    }
    
    this.currentService = AI_SERVICES[this.fallbackIndex]
    return this.generateImage(params)
  }
}
```

## 性能优化

### 前端优化
1. **图片优化**
   - 使用WebP格式
   - 图片懒加载
   - 缓存策略

2. **代码优化**
   - 分包加载
   - 组件按需加载
   - 代码压缩

3. **网络优化**
   - 请求合并
   - 数据预加载
   - 离线缓存

### 后端优化
1. **云函数优化**
   - 冷启动优化
   - 并发处理
   - 内存管理

2. **数据库优化**
   - 索引优化
   - 查询优化
   - 数据分页

3. **CDN加速**
   - 静态资源CDN
   - 图片CDN
   - 全球加速

## 安全策略

### 前端安全
- 输入验证和过滤
- 敏感信息加密存储
- 防止XSS攻击

### 后端安全
- API接口鉴权
- 频率限制
- 内容审核
- 数据备份

### AI服务安全
- API密钥管理
- 请求签名验证
- 内容安全检查

## 监控运维

### 性能监控
- 页面加载时间
- API响应时间
- 错误率统计
- 用户行为分析

### 业务监控
- 生成成功率
- 用户活跃度
- 付费转化率
- 成本控制

### 异常处理
- 错误日志收集
- 自动重试机制
- 服务降级策略
- 用户友好提示

## 部署方案

### 开发环境
```bash
# 本地开发
npm install
npm run dev

# 微信开发者工具
- 导入项目
- 配置AppID
- 开启云开发
```

### 测试环境
```bash
# 云函数部署
npm run deploy:test

# 数据库初始化
npm run init:db:test
```

### 生产环境
```bash
# 生产部署
npm run deploy:prod

# 域名配置
- 配置业务域名
- 配置CDN加速
- SSL证书配置
```

## 成本控制

### AI服务成本
- 按调用次数计费
- 设置月度预算上限
- 优化prompt减少token消耗

### 云服务成本
- 合理设置云函数规格
- 优化数据库查询
- CDN流量控制

### 运营成本
- 自动化运维
- 监控告警
- 定期优化

## 技术选型理由

### 为什么选择微信小程序原生开发？
1. **性能优势**：原生开发性能最佳
2. **功能完整**：可使用所有小程序API
3. **维护成本**：代码结构清晰，易于维护
4. **用户体验**：响应速度快，交互流畅

### 为什么优先选择国内AI服务？
1. **服务稳定**：国内服务器，网络延迟低
2. **中文优化**：对中文场景支持更好
3. **合规性**：符合国内数据安全要求
4. **成本控制**：价格相对更合理

### 为什么使用云开发？
1. **开发效率**：无需搭建服务器
2. **成本优势**：按量付费，初期成本低
3. **集成度高**：与小程序深度集成
4. **运维简单**：免运维，自动扩容 