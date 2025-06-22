# 数据库快速开始指南

## 🚀 5分钟快速部署MongoDB Atlas

### 第一步：注册MongoDB Atlas

1. **访问官网**
   ```
   https://www.mongodb.com/atlas
   ```

2. **注册免费账号**
   - 点击 "Try Free"
   - 填写邮箱和密码
   - 验证邮箱

3. **创建免费集群**
   - 选择 "Build a database"
   - 选择 "Shared" (免费版)
   - Provider: **AWS** (推荐)
   - Region: **Asia Pacific (Singapore)**
   - Cluster Name: `ai-image-cluster`

### 第二步：配置数据库访问

1. **创建数据库用户**
   ```
   Username: admin
   Password: [生成强密码并保存]
   ```

2. **配置网络访问**
   ```
   IP Access List: 0.0.0.0/0
   (允许所有IP访问，生产环境需要限制)
   ```

3. **获取连接字符串**
   ```
   mongodb+srv://admin:your_password@ai-image-cluster.xxxxx.mongodb.net/ai_image_db?retryWrites=true&w=majority
   ```

### 第三步：自动化设置数据库

1. **安装依赖**
   ```bash
   cd text-to-images-mp
   npm install mongodb
   ```

2. **运行设置脚本**
   ```bash
   node scripts/setup-database.js
   ```

3. **按照提示操作**
   ```
   🚀 MongoDB Atlas 数据库设置向导
   ====================================
   
   请输入MongoDB Atlas连接信息：
   是否已有完整连接字符串？(y/n): y
   请输入连接字符串: [粘贴您的连接字符串]
   
   📡 连接到 MongoDB Atlas...
   ✅ 数据库连接成功！
   
   📁 创建集合...
   ✅ 创建集合: users
   ✅ 创建集合: works
   ✅ 创建集合: templates
   ✅ 创建集合: characters
   ✅ 创建集合: configs
   
   🔍 创建索引...
   ✅ 创建索引: users - {"openid":1}
   ✅ 创建索引: works - {"userId":1,"createdAt":-1}
   ...
   
   ❓ 是否插入初始数据？(y/n): y
   
   📊 插入初始数据...
   ✅ 插入系统配置
   ✅ 插入默认角色
   ✅ 插入模板数据
   
   🔍 验证数据库设置...
   📊 users: 0 条记录
   📊 works: 0 条记录
   📊 templates: 2 条记录
   📊 characters: 3 条记录
   📊 configs: 3 条记录
   
   🎉 数据库设置完成！
   ```

### 第四步：配置环境变量

1. **创建环境变量文件**
   ```bash
   # .env
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://admin:your_password@ai-image-cluster.xxxxx.mongodb.net/ai_image_db?retryWrites=true&w=majority
   ```

2. **生产环境配置**
   ```bash
   # .env.production
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://admin:prod_password@ai-image-cluster.xxxxx.mongodb.net/ai_image_prod?retryWrites=true&w=majority
   ```

## 📊 数据库结构概览

### 核心集合

| 集合名 | 描述 | 主要字段 |
|--------|------|----------|
| `users` | 用户信息 | openid, userInfo, vipInfo, credits |
| `works` | 用户作品 | userId, prompt, images, metadata |
| `templates` | 创意模板 | title, category, prompt, previewImages |
| `characters` | 角色库 | name, category, prompt, attributes |
| `configs` | 系统配置 | key, value, category, description |

### 预置数据

#### 系统配置 (configs)
```javascript
{
  "daily_free_limit": 5,        // 免费用户每日限制
  "vip_daily_limit": 100,       // VIP用户每日限制
  "ai_providers": {             // AI服务商配置
    "deepseek": { priority: 1, cost: 0.002 },
    "doubao": { priority: 2, cost: 0.008 }
  }
}
```

#### 默认角色 (characters)
- 可爱女孩 (推荐)
- 帅气男孩 (推荐)
- 萌宠小猫 (萌宠)

#### 创意模板 (templates)
- 励志鸡汤 (免费)
- 古风诗词 (VIP)

## 🔧 NestJS集成示例

### 1. 安装依赖
```bash
npm install @nestjs/mongoose mongoose
npm install --save-dev @types/mongoose
```

### 2. 数据库模块
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
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### 3. 用户模型
```typescript
// src/modules/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  openid: string;

  @Prop({
    type: {
      nickName: String,
      avatarUrl: String,
      gender: Number,
    }
  })
  userInfo: {
    nickName: string;
    avatarUrl: string;
    gender: number;
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
}

export const UserSchema = SchemaFactory.createForClass(User);
```

### 4. 用户服务
```typescript
// src/modules/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async findByOpenid(openid: string): Promise<User | null> {
    return this.userModel.findOne({ openid }).exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async updateCredits(userId: string, credits: number): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { 'credits.used': credits } },
      { new: true }
    ).exec();
  }
}
```

## 🔍 常用查询示例

### 用户相关
```javascript
// 查找用户
db.users.findOne({ openid: "wx_openid_123" })

// 更新VIP状态
db.users.updateOne(
  { openid: "wx_openid_123" },
  { 
    $set: { 
      "vipInfo.isVip": true,
      "vipInfo.expireTime": new Date("2024-12-31")
    }
  }
)

// 查询VIP用户
db.users.find({ "vipInfo.isVip": true })
```

### 作品相关
```javascript
// 查询用户作品
db.works.find({ userId: ObjectId("user_id") }).sort({ createdAt: -1 })

// 查询公开作品
db.works.find({ "visibility.isPublic": true }).sort({ createdAt: -1 })

// 统计生成成功率
db.works.aggregate([
  { $group: {
    _id: "$generation.status",
    count: { $sum: 1 }
  }}
])
```

### 角色和模板
```javascript
// 查询推荐角色
db.characters.find({ 
  category: "recommend",
  "management.isActive": true 
}).sort({ "management.order": 1 })

// 查询热门模板
db.templates.find({ 
  "management.isActive": true 
}).sort({ "usage.usageCount": -1 })
```

## 📈 监控和维护

### 性能监控
```javascript
// 查看数据库统计
db.stats()

// 查看集合统计
db.users.stats()

// 查看索引使用情况
db.users.getIndexes()
```

### 定期维护任务
```bash
# 1. 清理过期数据
db.works.deleteMany({
  "visibility.isDeleted": true,
  "visibility.deleteTime": { $lt: new Date(Date.now() - 30*24*60*60*1000) }
})

# 2. 重置每日使用量
db.users.updateMany({}, {
  $set: {
    "credits.dailyUsed": 0,
    "credits.lastResetDate": new Date()
  }
})

# 3. 更新统计数据
db.users.aggregate([
  {
    $lookup: {
      from: "works",
      localField: "_id",
      foreignField: "userId",
      as: "userWorks"
    }
  },
  {
    $set: {
      "statistics.totalWorks": { $size: "$userWorks" }
    }
  }
])
```

## 🚨 故障排除

### 常见问题

1. **连接失败**
   ```
   错误: MongoNetworkError: failed to connect to server
   解决: 检查IP白名单和网络连接
   ```

2. **认证失败**
   ```
   错误: Authentication failed
   解决: 检查用户名密码是否正确
   ```

3. **索引冲突**
   ```
   错误: E11000 duplicate key error
   解决: 检查唯一索引约束
   ```

### 备份恢复
```bash
# 导出数据
mongoexport --uri="mongodb+srv://..." --collection=users --out=users.json

# 导入数据
mongoimport --uri="mongodb+srv://..." --collection=users --file=users.json
```

## 📞 技术支持

如果在数据库设置过程中遇到问题：

1. **检查连接字符串格式**
2. **确认网络访问权限**
3. **验证用户名密码**
4. **查看MongoDB Atlas控制台日志**

数据库设置完成后，您就可以开始开发NestJS后端应用了！ 