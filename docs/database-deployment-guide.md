# 数据库设计与部署指南

## 数据库选型对比

### 1. MongoDB Atlas (推荐)

#### 优势
- **免费额度**: 500MB存储，足够初期使用
- **全托管**: 无需运维，自动备份和扩展
- **全球部署**: 多地域支持，低延迟访问
- **安全性**: 内置安全功能，VPC支持
- **监控**: 实时性能监控和告警
- **兼容性**: 与Node.js/NestJS完美集成

#### 成本分析
```
免费版 (M0):
- 存储: 500MB
- 连接数: 500个
- 适用: 开发测试 + 小规模生产

基础版 (M2): $9/月
- 存储: 2GB
- 连接数: 无限制
- 适用: 中小规模生产

专用版 (M10): $57/月
- 存储: 10GB
- 性能: 专用资源
- 适用: 大规模生产
```

### 2. 其他选项对比

| 数据库 | 成本 | 运维复杂度 | 扩展性 | 推荐度 |
|--------|------|------------|--------|--------|
| MongoDB Atlas | 免费-$57/月 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 自建MongoDB | $20-100/月 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| PostgreSQL | $15-80/月 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| MySQL | $10-60/月 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## 数据库结构设计

### 核心集合设计

#### 1. 用户集合 (users)
```javascript
{
  _id: ObjectId,
  openid: String,           // 微信openid
  unionid: String,          // 微信unionid
  userInfo: {
    nickName: String,
    avatarUrl: String,
    gender: Number,
    city: String,
    province: String,
    country: String
  },
  profile: {
    phone: String,          // 手机号（H5用户）
    email: String,          // 邮箱（H5用户）
    realName: String        // 实名（可选）
  },
  vipInfo: {
    isVip: Boolean,         // 是否VIP
    level: String,          // VIP等级: basic/premium/pro
    expireTime: Date,       // VIP过期时间
    purchaseHistory: [{     // 购买历史
      orderId: String,
      amount: Number,
      duration: Number,     // 购买时长（月）
      purchaseTime: Date
    }]
  },
  credits: {
    total: Number,          // 总积分
    used: Number,           // 已使用积分
    remaining: Number,      // 剩余积分
    dailyLimit: Number,     // 每日限制
    dailyUsed: Number,      // 今日已用
    lastResetDate: Date     // 上次重置日期
  },
  statistics: {
    totalWorks: Number,     // 总作品数
    totalGenerations: Number, // 总生成次数
    favoriteCharacters: [String], // 喜爱角色
    preferredStyles: [String]     // 偏好风格
  },
  settings: {
    notifications: Boolean,  // 通知设置
    privacy: Boolean,       // 隐私设置
    language: String        // 语言设置
  },
  status: {
    isActive: Boolean,      // 账户状态
    isBanned: Boolean,      // 是否被封
    banReason: String,      // 封禁原因
    lastLoginTime: Date,    // 最后登录时间
    registrationTime: Date  // 注册时间
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. 作品集合 (works)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // 用户ID
  title: String,            // 作品标题
  prompt: String,           // 原始提示词
  enhancedPrompt: String,   // 增强后的提示词
  images: [{
    url: String,            // 图片URL
    thumbnailUrl: String,   // 缩略图URL
    size: Number,           // 文件大小
    width: Number,          // 图片宽度
    height: Number,         // 图片高度
    format: String          // 图片格式
  }],
  metadata: {
    character: {
      id: ObjectId,         // 角色ID
      name: String,         // 角色名称
      category: String      // 角色分类
    },
    style: String,          // 风格类型
    mode: String,           // 生成模式: single/double
    aiProvider: String,     // AI服务商
    model: String,          // 使用的模型
    parameters: {           // 生成参数
      steps: Number,
      guidance: Number,
      seed: Number
    }
  },
  generation: {
    status: String,         // pending/processing/success/failed
    startTime: Date,        // 开始时间
    endTime: Date,          // 结束时间
    duration: Number,       // 生成耗时（毫秒）
    cost: Number,           // 生成成本
    retryCount: Number,     // 重试次数
    errorMessage: String    // 错误信息
  },
  engagement: {
    views: Number,          // 浏览次数
    likes: Number,          // 点赞数
    shares: Number,         // 分享次数
    downloads: Number       // 下载次数
  },
  visibility: {
    isPublic: Boolean,      // 是否公开
    isDeleted: Boolean,     // 是否删除
    deleteTime: Date        // 删除时间
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. 模板集合 (templates)
```javascript
{
  _id: ObjectId,
  title: String,            // 模板标题
  description: String,      // 模板描述
  category: String,         // 分类: jitang/gufeng/xiyouji/etc
  tags: [String],           // 标签
  prompt: String,           // 模板提示词
  previewImages: [String],  // 预览图片
  parameters: {
    defaultCharacter: ObjectId, // 默认角色
    defaultStyle: String,   // 默认风格
    suggestedKeywords: [String] // 建议关键词
  },
  usage: {
    usageCount: Number,     // 使用次数
    successRate: Number,    // 成功率
    avgRating: Number       // 平均评分
  },
  management: {
    isActive: Boolean,      // 是否启用
    isVip: Boolean,         // 是否VIP专属
    order: Number,          // 排序权重
    creator: String,        // 创建者
    reviewer: String        // 审核者
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. 角色集合 (characters)
```javascript
{
  _id: ObjectId,
  name: String,             // 角色名称
  description: String,      // 角色描述
  category: String,         // 分类: recommend/person/pet
  subcategory: String,      // 子分类
  image: String,            // 角色头像
  previewImages: [String],  // 预览图片
  prompt: String,           // 角色提示词
  attributes: {
    gender: String,         // 性别
    age: String,            // 年龄段
    style: String,          // 风格类型
    mood: String,           // 情绪特征
    clothing: String,       // 服装特征
    background: String      // 背景特征
  },
  usage: {
    usageCount: Number,     // 使用次数
    popularityScore: Number, // 热门度评分
    successRate: Number     // 生成成功率
  },
  management: {
    isActive: Boolean,      // 是否启用
    isVip: Boolean,         // 是否VIP专属
    isFeatured: Boolean,    // 是否推荐
    order: Number,          // 排序权重
    tags: [String]          // 标签
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. 系统配置集合 (configs)
```javascript
{
  _id: ObjectId,
  key: String,              // 配置键
  value: Mixed,             // 配置值
  category: String,         // 配置分类
  description: String,      // 配置描述
  isActive: Boolean,        // 是否启用
  updatedBy: String,        // 更新者
  updatedAt: Date
}

// 示例配置
{
  key: "daily_free_limit",
  value: 5,
  category: "user_limits",
  description: "免费用户每日生成限制"
}

{
  key: "ai_providers",
  value: {
    deepseek: { priority: 1, cost: 0.002, enabled: true },
    doubao: { priority: 2, cost: 0.008, enabled: true }
  },
  category: "ai_services",
  description: "AI服务商配置"
}
```

### 索引设计

#### 性能优化索引
```javascript
// 用户集合索引
db.users.createIndex({ "openid": 1 }, { unique: true })
db.users.createIndex({ "unionid": 1 }, { sparse: true })
db.users.createIndex({ "profile.phone": 1 }, { sparse: true })
db.users.createIndex({ "vipInfo.expireTime": 1 })
db.users.createIndex({ "createdAt": -1 })

// 作品集合索引
db.works.createIndex({ "userId": 1, "createdAt": -1 })
db.works.createIndex({ "generation.status": 1 })
db.works.createIndex({ "visibility.isPublic": 1, "createdAt": -1 })
db.works.createIndex({ "metadata.character.id": 1 })
db.works.createIndex({ "prompt": "text" }) // 全文搜索

// 模板集合索引
db.templates.createIndex({ "category": 1, "management.order": 1 })
db.templates.createIndex({ "management.isActive": 1 })
db.templates.createIndex({ "tags": 1 })

// 角色集合索引
db.characters.createIndex({ "category": 1, "management.order": 1 })
db.characters.createIndex({ "management.isActive": 1 })
db.characters.createIndex({ "usage.popularityScore": -1 })

// 配置集合索引
db.configs.createIndex({ "key": 1 }, { unique: true })
db.configs.createIndex({ "category": 1 })
```

## MongoDB Atlas 部署指南

### 1. 注册和创建集群

#### 步骤1: 注册账号
1. 访问 https://www.mongodb.com/atlas
2. 注册免费账号
3. 选择 "Build a database" -> "Shared" (免费版)

#### 步骤2: 集群配置
```yaml
集群配置:
  Provider: AWS (推荐)
  Region: Asia Pacific (Singapore) ap-southeast-1
  Cluster Tier: M0 Sandbox (FREE)
  Cluster Name: ai-image-cluster
  
网络配置:
  IP Access List: 0.0.0.0/0 (允许所有IP，生产环境需限制)
  
数据库用户:
  Username: admin
  Password: 生成强密码
  Role: Atlas admin
```

#### 步骤3: 获取连接字符串
```javascript
// 连接字符串格式
mongodb+srv://<username>:<password>@ai-image-cluster.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority

// 示例
mongodb+srv://admin:your_password@ai-image-cluster.abc123.mongodb.net/ai_image_db?retryWrites=true&w=majority
```

### 2. 数据库初始化

#### 环境变量配置
```bash
# .env
NODE_ENV=development
MONGODB_URI=mongodb+srv://admin:your_password@ai-image-cluster.abc123.mongodb.net/ai_image_db?retryWrites=true&w=majority

# .env.production  
NODE_ENV=production
MONGODB_URI=mongodb+srv://admin:prod_password@ai-image-cluster.abc123.mongodb.net/ai_image_prod?retryWrites=true&w=majority
```

#### NestJS 数据库模块
```typescript
// src/shared/database/database.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Serverless 优化配置
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
        // 连接选项
        retryWrites: true,
        w: 'majority',
        // 压缩
        compressors: ['zlib'],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### 3. 数据模型定义

#### 用户模型
```typescript
// src/shared/database/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  openid: string;

  @Prop()
  unionid: string;

  @Prop({
    type: {
      nickName: String,
      avatarUrl: String,
      gender: Number,
      city: String,
      province: String,
      country: String,
    }
  })
  userInfo: {
    nickName: string;
    avatarUrl: string;
    gender: number;
    city: string;
    province: string;
    country: string;
  };

  @Prop({
    type: {
      isVip: { type: Boolean, default: false },
      level: { type: String, default: 'basic' },
      expireTime: Date,
    }
  })
  vipInfo: {
    isVip: boolean;
    level: string;
    expireTime: Date;
  };

  @Prop({
    type: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 5 },
      dailyLimit: { type: Number, default: 5 },
      dailyUsed: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now }
    }
  })
  credits: {
    total: number;
    used: number;
    remaining: number;
    dailyLimit: number;
    dailyUsed: number;
    lastResetDate: Date;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

// 创建索引
UserSchema.index({ openid: 1 }, { unique: true });
UserSchema.index({ unionid: 1 }, { sparse: true });
UserSchema.index({ createdAt: -1 });
```

### 4. 索引策略

#### 性能优化索引
```javascript
// 用户集合索引
db.users.createIndex({ "openid": 1 }, { unique: true })
db.users.createIndex({ "unionid": 1 }, { sparse: true })
db.users.createIndex({ "vipInfo.expireTime": 1 })
db.users.createIndex({ "createdAt": -1 })

// 作品集合索引
db.works.createIndex({ "userId": 1, "createdAt": -1 })
db.works.createIndex({ "generation.status": 1 })
db.works.createIndex({ "visibility.isPublic": 1, "createdAt": -1 })
db.works.createIndex({ "metadata.character.id": 1 })

// 模板集合索引
db.templates.createIndex({ "category": 1, "management.order": 1 })
db.templates.createIndex({ "management.isActive": 1 })

// 角色集合索引
db.characters.createIndex({ "category": 1, "management.order": 1 })
db.characters.createIndex({ "management.isActive": 1 })
db.characters.createIndex({ "usage.popularityScore": -1 })
```

### 5. 部署配置

#### Serverless 环境变量
```yaml
# serverless.yml
provider:
  name: aws
  runtime: nodejs18.x
  environment:
    NODE_ENV: ${opt:stage, 'development'}
    MONGODB_URI: ${env:MONGODB_URI}
    
functions:
  api:
    handler: dist/lambda.handler
    timeout: 30
    memorySize: 256
    environment:
      MONGODB_URI: ${env:MONGODB_URI}
```

### 6. 监控和维护

#### 数据库健康检查
```typescript
// src/shared/database/database-health.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async checkHealth(): Promise<boolean> {
    try {
      const state = this.connection.readyState;
      return state === 1; // 1 = connected
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  async getStats() {
    try {
      const db = this.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        objects: stats.objects,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      throw error;
    }
  }
}
```

## 部署最佳实践

### 1. 安全配置
- 配置IP白名单（生产环境）
- 启用VPC对等连接
- 使用强密码和定期轮换
- 最小权限原则
- 启用审计日志

### 2. 性能优化
```javascript
// 连接池优化
maxPoolSize: 10,
minPoolSize: 2,
maxIdleTimeMS: 30000,

// 查询优化
- 合理使用索引
- 避免全表扫描
- 使用聚合管道优化复杂查询
- 实施查询缓存策略
```

### 3. 监控告警
```yaml
监控指标:
  - 连接数使用率 < 80%
  - 查询响应时间 < 1000ms
  - 错误率 < 5%
  - 存储使用量 < 90%

告警配置:
  - 连接数异常
  - 响应时间过长
  - 错误率过高
  - 存储空间不足
```

### 4. 备份策略
- 自动备份：每日备份
- 备份保留：30天
- 跨区域备份：重要数据
- 恢复测试：定期验证

## 成本预估

### 开发阶段
- MongoDB Atlas M0: 免费
- 存储: 500MB
- 连接数: 500个
- **月成本: $0**

### 生产阶段（小规模）
- MongoDB Atlas M2: $9/月
- 存储: 2GB
- 连接数: 无限制
- **月成本: $9**

### 扩展阶段（中规模）
- MongoDB Atlas M10: $57/月
- 存储: 10GB
- 专用资源
- **月成本: $57**

这个数据库方案能够满足从开发到生产的完整需求，支持平滑扩展。您对这个数据库设计有什么疑问吗？  