# 微信云开发数据库设置指南

## 数据库集合设计

### 1. users 集合（用户表）
```json
{
  "_id": "auto_generated",
  "openid": "string",           // 微信用户唯一标识
  "deviceId": "string",         // 游客设备ID
  "nickname": "string",         // 用户昵称
  "avatar": "string",           // 头像URL
  "vipLevel": "number",         // VIP等级，0为普通用户
  "credits": "number",          // 积分余额
  "generateCount": "number",    // 生成次数统计
  "userType": "string",         // 用户类型：wechat/guest
  "createdAt": "date",          // 创建时间
  "lastLoginTime": "date",      // 最后登录时间
  "updatedAt": "date"           // 更新时间
}
```

### 2. works 集合（作品表）
```json
{
  "_id": "auto_generated",
  "id": "string",               // 作品唯一ID
  "userId": "string",           // 用户ID
  "openid": "string",           // 微信用户openid
  "title": "string",            // 作品标题
  "prompt": "string",           // 完整提示词
  "originalPrompt": "string",   // 原始输入
  "character": "string",        // 角色名称
  "style": "string",            // 风格类型
  "emotion": "string",          // 表情动作
  "mode": "string",             // 生成模式
  "imageUrl": "string",         // 图片URL
  "enhancedPrompt": "string",   // 增强后的提示词
  "status": "string",           // 状态：completed/failed/deleted
  "isFavorite": "boolean",      // 是否收藏
  "errorMessage": "string",     // 错误信息（失败时）
  "createdAt": "date",          // 创建时间
  "updatedAt": "date",          // 更新时间
  "deletedAt": "date"           // 删除时间
}
```

### 3. creditLogs 集合（积分记录表）
```json
{
  "_id": "auto_generated",
  "userId": "string",           // 用户ID
  "openid": "string",           // 微信用户openid
  "operation": "string",        // 操作类型：add/subtract
  "amount": "number",           // 变动数量
  "oldCredits": "number",       // 变动前积分
  "newCredits": "number",       // 变动后积分
  "reason": "string",           // 变动原因
  "createdAt": "date"           // 创建时间
}
```

## 数据库权限设置

### 1. users 集合权限
- **创建权限**: 仅云函数
- **读取权限**: 仅创建者可读
- **更新权限**: 仅创建者可写
- **删除权限**: 仅云函数

### 2. works 集合权限
- **创建权限**: 仅云函数
- **读取权限**: 仅创建者可读
- **更新权限**: 仅创建者可写
- **删除权限**: 仅创建者可写

### 3. creditLogs 集合权限
- **创建权限**: 仅云函数
- **读取权限**: 仅创建者可读
- **更新权限**: 仅云函数
- **删除权限**: 仅云函数

## 索引设置

### users 集合索引
```json
[
  {
    "field": "openid",
    "unique": true,
    "sparse": true
  },
  {
    "field": "deviceId",
    "unique": false
  },
  {
    "field": "createdAt",
    "unique": false
  }
]
```

### works 集合索引
```json
[
  {
    "field": "userId",
    "unique": false
  },
  {
    "field": "openid",
    "unique": false
  },
  {
    "field": "status",
    "unique": false
  },
  {
    "field": "createdAt",
    "unique": false
  },
  {
    "compound": ["userId", "status", "createdAt"],
    "unique": false
  }
]
```

### creditLogs 集合索引
```json
[
  {
    "field": "userId",
    "unique": false
  },
  {
    "field": "openid",
    "unique": false
  },
  {
    "field": "createdAt",
    "unique": false
  }
]
```

## 安全规则设置

### 基本原则
1. 用户只能访问自己的数据
2. 敏感操作只能通过云函数执行
3. 防止恶意访问和数据篡改

### 示例安全规则
```javascript
// users 集合安全规则
{
  "read": "auth.openid == resource.openid",
  "write": false // 只允许云函数写入
}

// works 集合安全规则
{
  "read": "auth.openid == resource.openid",
  "write": "auth.openid == resource.openid"
}

// creditLogs 集合安全规则
{
  "read": "auth.openid == resource.openid",
  "write": false // 只允许云函数写入
}
```

## 设置步骤

1. **创建云环境**
   - 登录微信开发者工具
   - 开通云开发服务
   - 创建新的云环境

2. **创建数据库集合**
   - 在云开发控制台创建三个集合
   - 按照上述结构设置字段

3. **配置权限**
   - 为每个集合设置安全规则
   - 确保数据安全

4. **创建索引**
   - 为常用查询字段创建索引
   - 提升查询性能

5. **测试环境**
   - 部署云函数
   - 测试数据库连接
   - 验证权限设置

## 注意事项

1. **环境ID配置**: 确保在 `app.js` 和 `project.config.json` 中正确配置云环境ID
2. **权限安全**: 严格控制数据库访问权限，防止数据泄露
3. **性能优化**: 合理设置索引，避免全表扫描
4. **数据备份**: 定期备份重要数据
5. **监控告警**: 设置数据库监控和告警机制 