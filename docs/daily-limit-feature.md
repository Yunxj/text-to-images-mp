# 🚀 AI图片生成每日限制功能

## 概述

本功能实现了AI图片生成的每日使用次数限制，有效控制API调用成本，同时为用户提供合理的免费使用额度。

## 功能特性

### 📊 每日限制配置
- **免费用户**: 每日50次生成限制
- **VIP用户**: 每日200次生成限制  
- **管理员**: 每日1000次生成限制

### ⏰ 自动重置机制
- 每日0点自动重置使用次数
- 基于作品创建时间进行统计
- 只统计成功生成的作品，失败的不计入

### 🔒 多重保护机制
- 前端预检查：生成前检查剩余次数
- 后端验证：云函数中进行最终验证
- 实时更新：生成后立即更新使用统计

## 实现架构

### 1. 云函数层面 (`miniprogram/cloudfunctions/aiGenerate/index.js`)

#### 每日限制配置
```javascript
const DAILY_LIMITS = {
  free: 50,     // 免费用户每日50次
  vip: 200,     // VIP用户每日200次
  admin: 1000   // 管理员每日1000次
}
```

#### 核心检查函数
```javascript
// 检查今日生成次数
async function checkDailyLimit(userId, userType) {
  const todayUsage = await getTodayUsageCount(userId)
  const dailyLimit = DAILY_LIMITS[userType]
  
  if (todayUsage >= dailyLimit) {
    throw new Error(`今日生成次数已达上限（${dailyLimit}次），明日0点重置`)
  }
  
  return {
    used: todayUsage,
    limit: dailyLimit,
    remaining: dailyLimit - todayUsage
  }
}
```

#### 使用量统计函数
```javascript
// 获取今日使用次数
async function getTodayUsageCount(userId) {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  
  const usageQuery = await db.collection('works')
    .where({
      userId: userId,
      status: db.command.neq('failed'), // 不计算失败的生成
      createdAt: db.command.gte(startOfDay).and(db.command.lt(endOfDay))
    })
    .count()
  
  return usageQuery.total || 0
}
```

### 2. 前端展示层面 (`miniprogram/pages/index/`)

#### 数据结构
```javascript
data: {
  dailyUsage: {
    used: 0,        // 今日已使用次数
    limit: 50,      // 每日限制次数
    remaining: 50,  // 剩余次数
    userType: 'free' // 用户类型
  }
}
```

#### 实时检查机制
```javascript
// 生成前检查
if (dailyUsage.remaining <= 0) {
  wx.showModal({
    title: '今日生成次数已用完',
    content: `您今日已使用 ${dailyUsage.used}/${dailyUsage.limit} 次，明日0点重置。升级VIP可获得更多次数。`,
    confirmText: '升级VIP'
  })
  return
}
```

### 3. API接口层面

#### 新增云函数Action
```javascript
case 'getDailyUsage':
  return await getDailyUsage(data, wxContext)
```

#### 前端API封装
```javascript
// 获取每日使用量统计
getDailyUsage() {
  const app = getApp()
  const userInfo = app.globalData.userInfo
  
  return callCloudFunction('aiGenerate', 'getDailyUsage', {
    userId: userInfo?.id
  })
}
```

## 数据流程

### 1. 页面加载流程
```
用户打开页面 → 初始化用户信息 → 加载每日使用量 → 显示统计信息
```

### 2. 图片生成流程
```
用户点击生成 → 前端检查剩余次数 → 调用云函数 → 后端再次验证 → 生成图片 → 更新使用统计
```

### 3. 错误处理流程
```
超出限制 → 显示错误提示 → 引导升级VIP → 提供明日重置说明
```

## 用户体验优化

### 📱 界面显示
- 显示今日使用次数：`每日限制：15/50次 (免费用户)`
- 实时更新剩余次数
- 用户类型标识（免费/VIP）

### 💬 友好提示
- 超出限制时的详细说明
- 重置时间提示（明日0点）
- VIP升级引导

### 🔄 自动刷新
- 生成成功后自动更新统计
- 页面重新加载时刷新数据
- 支持实时查询当前状态

## 部署说明

### 1. 云函数部署
```bash
# 在微信开发者工具中
右键 cloudfunctions/aiGenerate → 创建并部署：云端安装依赖
```

### 2. 前端更新
所有前端文件修改完成，直接编译预览即可生效

### 3. 数据库要求
- 确保 `works` 集合存在
- 确保 `users` 集合包含 `vipLevel` 字段
- 确保作品记录包含 `status` 和 `createdAt` 字段

## 监控与维护

### 📈 使用统计
- 可通过 `getDailyUsage` API 实时查询
- 支持按用户类型分组统计
- 可扩展为管理后台数据源

### 🔧 配置调整
```javascript
// 调整每日限制只需修改此配置
const DAILY_LIMITS = {
  free: 50,     // 可根据需要调整
  vip: 200,     // 可根据需要调整
  admin: 1000   // 可根据需要调整
}
```

### 🛠️ 故障排除
- 检查云函数部署状态
- 验证数据库权限配置
- 查看云函数日志输出
- 确认时间计算准确性

## 扩展功能

### 🎯 未来可扩展特性
1. **按小时限制**: 防止短时间内大量调用
2. **动态限制**: 根据API成本动态调整
3. **用户等级**: 更细粒度的用户分级
4. **使用分析**: 详细的使用数据分析

### 🔄 兼容性
- 向下兼容现有积分系统
- 支持现有VIP机制
- 可配合其他限制策略使用

---

## 总结

该每日限制功能成功实现了：
✅ 每日50次的生成限制（免费用户）
✅ 0点自动重置机制  
✅ VIP用户更高限制
✅ 友好的用户提示
✅ 实时统计更新
✅ 完善的错误处理

有效控制了API调用成本，同时保证了良好的用户体验。 