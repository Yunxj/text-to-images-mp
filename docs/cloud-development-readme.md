# AI绘图助手 - 微信云开发版

基于微信云开发的AI文字生成图片小程序，支持多种AI模型和丰富的图片生成功能。

## 🚀 项目特色

- ✨ **零运维**: 基于微信云开发，无需服务器运维
- 🎨 **AI生成**: 支持文字转图片，多种风格选择
- 🔐 **安全可靠**: 内置用户认证和数据权限控制
- 📱 **原生体验**: 微信小程序原生开发，体验流畅
- 💰 **成本优化**: 按量付费，大幅降低运营成本

## 🏗️ 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   小程序前端    │────│    云函数       │────│   外部AI服务    │
│                 │    │                 │    │                 │
│ - 用户界面      │    │ - 业务逻辑      │    │ - 智谱AI        │
│ - 交互逻辑      │    │ - 数据处理      │    │ - 图片生成      │
│ - 云开发API     │    │ - 权限控制      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   云数据库      │
         │              │                 │
         └──────────────│ - 用户数据      │
                        │ - 作品数据      │
                        │ - 系统日志      │
                        └─────────────────┘
```

## 📂 项目结构

```
text-to-images-mp/
├── miniprogram/                 # 小程序主目录
│   ├── cloudfunctions/         # 云函数目录
│   │   ├── login/              # 用户登录云函数
│   │   ├── aiGenerate/         # AI生成云函数
│   │   ├── userInfo/           # 用户信息管理云函数
│   │   └── workManage/         # 作品管理云函数
│   ├── pages/                  # 小程序页面
│   │   ├── index/             # 首页
│   │   ├── result/            # 结果页
│   │   ├── creative/          # 创作页
│   │   └── profile/           # 个人中心
│   ├── utils/                  # 工具文件
│   │   ├── cloudApi.js        # 云开发API封装
│   │   └── api.js             # 原HTTP API（待删除）
│   ├── app.js                 # 小程序入口
│   ├── app.json               # 小程序配置
│   └── app.wxss               # 全局样式
├── docs/                       # 项目文档
│   ├── cloud-database-setup.md      # 数据库设置指南
│   ├── cloud-migration-guide.md     # 迁移指南
│   └── cloud-development-readme.md  # 本文档
└── project.config.json         # 项目配置
```

## 🛠️ 快速开始

### 前置要求

- 微信开发者工具 v1.06.0+
- 小程序基础库 v2.2.3+
- 已注册小程序账号并开通云开发

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd text-to-images-mp
   ```

2. **开通云开发**
   - 打开微信开发者工具
   - 导入项目目录
   - 点击"云开发"按钮开通服务
   - 创建云环境并记录环境ID

3. **配置环境**
   ```javascript
   // miniprogram/app.js
   wx.cloud.init({
     env: '你的云环境ID', // 替换为实际环境ID
     traceUser: true
   })
   ```

4. **设置数据库**
   - 参考 `docs/cloud-database-setup.md`
   - 创建必要的数据库集合
   - 设置安全规则和索引

5. **部署云函数**
   - 右键各云函数目录
   - 选择"上传并部署：云端安装依赖"
   - 等待部署完成

6. **预览调试**
   - 点击"预览"或"真机调试"
   - 测试各项功能

## 📦 云函数说明

### login - 用户登录
**功能**: 处理微信登录和游客登录
**接口**:
- `wxLogin`: 微信用户登录
- `guestLogin`: 游客登录

### aiGenerate - AI图片生成
**功能**: 处理AI图片生成请求
**接口**:
- `generate`: 生成图片
- `getHistory`: 获取生成历史
- `getServiceStatus`: 获取服务状态

### userInfo - 用户信息管理
**功能**: 用户数据管理
**接口**:
- `getUserInfo`: 获取用户信息
- `updateUserInfo`: 更新用户信息
- `updateCredits`: 更新积分

### workManage - 作品管理
**功能**: 用户作品管理
**接口**:
- `getWorks`: 获取作品列表
- `getWork`: 获取单个作品
- `saveWork`: 收藏作品
- `deleteWork`: 删除作品
- `updateWork`: 更新作品信息

## 🗄️ 数据库设计

### users 集合
```json
{
  "openid": "微信用户标识",
  "nickname": "用户昵称", 
  "avatar": "头像URL",
  "vipLevel": "VIP等级",
  "credits": "积分余额",
  "generateCount": "生成次数",
  "userType": "用户类型"
}
```

### works 集合
```json
{
  "id": "作品ID",
  "userId": "用户ID",
  "title": "作品标题",
  "prompt": "提示词",
  "imageUrl": "图片URL",
  "style": "风格类型",
  "status": "状态"
}
```

### creditLogs 集合
```json
{
  "userId": "用户ID",
  "operation": "操作类型",
  "amount": "变动数量", 
  "reason": "变动原因"
}
```

## 🔧 开发指南

### 添加新功能

1. **创建云函数**
   ```bash
   # 在 miniprogram/cloudfunctions/ 目录创建
   mkdir newFunction
   cd newFunction
   # 创建 index.js 和 package.json
   ```

2. **编写云函数逻辑**
   ```javascript
   const cloud = require('wx-server-sdk')
   cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
   
   exports.main = async (event, context) => {
     // 业务逻辑
   }
   ```

3. **前端调用**
   ```javascript
   const result = await wx.cloud.callFunction({
     name: 'newFunction',
     data: { /* 参数 */ }
   })
   ```

### 数据库操作

```javascript
const db = wx.cloud.database()

// 添加数据
await db.collection('users').add({
  data: { name: '用户名' }
})

// 查询数据
const result = await db.collection('users')
  .where({ openid: 'xxx' })
  .get()

// 更新数据
await db.collection('users')
  .doc('docId')
  .update({
    data: { name: '新名称' }
  })
```

### 文件上传

```javascript
// 上传文件到云存储
const result = await wx.cloud.uploadFile({
  cloudPath: 'images/photo.jpg',
  filePath: tempFilePath
})

// 获取文件下载链接
const urls = await wx.cloud.getTempFileURL({
  fileList: [result.fileID]
})
```

## 🚀 部署流程

### 开发环境
1. 本地开发调试
2. 云函数热更新
3. 实时数据同步

### 生产环境
1. 代码测试完成
2. 云函数批量部署
3. 数据库权限检查
4. 小程序提审发布

## 📊 监控告警

### 云函数监控
- 执行次数统计
- 错误率监控
- 执行时长分析

### 数据库监控
- 读写次数统计
- 慢查询分析
- 存储空间监控

### 小程序监控
- 用户行为分析
- 性能指标监控
- 错误日志收集

## ⚡ 性能优化

### 云函数优化
- 减少冷启动时间
- 优化代码逻辑
- 合理设置超时时间

### 数据库优化
- 创建合适索引
- 优化查询语句
- 数据分页处理

### 前端优化
- 图片懒加载
- 代码分包加载
- 缓存策略优化

## 🔒 安全说明

### 数据安全
- 用户数据隔离
- 敏感信息加密
- 访问权限控制

### API安全
- 云函数权限验证
- 参数校验过滤
- 频率限制控制

### 业务安全
- 防刷机制
- 异常行为检测
- 数据备份恢复

## 💰 成本控制

### 免费额度
- 云函数：10万次/月
- 数据库：2GB存储
- 云存储：5GB存储

### 成本优化
- 合理使用资源
- 定期清理数据
- 监控使用量

## 🐛 常见问题

### Q: 云函数调用失败？
A: 检查云函数是否正确部署，参数是否正确

### Q: 数据库访问被拒绝？
A: 检查安全规则设置，确保用户有相应权限

### Q: 文件上传失败？
A: 检查文件大小限制，网络连接状况

## 📝 更新日志

### v2.0.0 (云开发版)
- ✅ 迁移至微信云开发架构
- ✅ 重构所有后端逻辑为云函数
- ✅ 使用云数据库替代传统数据库
- ✅ 集成云存储功能
- ✅ 优化用户体验和性能

### v1.0.0 (传统版)
- ✅ 基础AI图片生成功能
- ✅ 用户登录注册
- ✅ 作品管理功能

## 📞 技术支持

如有问题，请查看：
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [项目Issues](链接到你的项目Issues页面)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件 