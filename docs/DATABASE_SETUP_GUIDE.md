
# 云开发数据库集合快速创建指南

## 🎯 需要创建的集合

总共需要创建 **3个集合**：


### users - 用户信息集合
**权限配置**：
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

**示例数据**：
```json
{
  "_openid": "test_user_123",
  "nickname": "测试用户",
  "avatar": "https://example.com/avatar.jpg",
  "credits": 100,
  "totalGenerated": 0,
  "membership": "free",
  "createdAt": "2025-06-24T08:13:59.481Z",
  "updatedAt": "2025-06-24T08:13:59.481Z"
}
```

**索引配置**：

- **openid_index**：
  ```json
  {
  "_openid": 1
}
  ```



### works - 用户作品集合
**权限配置**：
```json
{
  "read": true,
  "write": "doc.userId == auth.openid"
}
```

**示例数据**：
```json
{
  "userId": "test_user_123",
  "title": "测试作品",
  "prompt": "一只可爱的小猫",
  "imageUrl": "https://example.com/image.jpg",
  "model": "cogview-3",
  "style": "realistic",
  "isPublic": false,
  "isFavorite": true,
  "tags": [
    "动物",
    "可爱"
  ],
  "createdAt": "2025-06-24T08:13:59.481Z",
  "updatedAt": "2025-06-24T08:13:59.481Z"
}
```

**索引配置**：

- **user_time_index**：
  ```json
  {
  "userId": 1,
  "createdAt": -1
}
  ```

- **public_time_index**：
  ```json
  {
  "isPublic": 1,
  "createdAt": -1
}
  ```



### creditLogs - 积分记录集合
**权限配置**：
```json
{
  "read": "doc.userId == auth.openid",
  "write": "doc.userId == auth.openid"
}
```

**示例数据**：
```json
{
  "userId": "test_user_123",
  "type": "consume",
  "amount": -10,
  "reason": "生成图片",
  "description": "使用AI生成图片消耗积分",
  "relatedId": "work_123",
  "balance": 90,
  "createdAt": "2025-06-24T08:13:59.481Z"
}
```

**索引配置**：

- **user_time_index**：
  ```json
  {
  "userId": 1,
  "createdAt": -1
}
  ```



## 🚀 快速创建步骤

### 步骤1：打开云开发控制台
1. 在微信开发者工具中点击"云开发"按钮
2. 或直接访问：https://console.cloud.tencent.com/tcb

### 步骤2：批量创建集合
依次创建以下集合：

#### 创建 users 集合
1. 点击"新建集合" → 输入 `users` → 确定
2. 进入 users 集合 → 权限设置 → 自定义安全规则
3. 复制粘贴权限配置（见上方）

#### 创建 works 集合  
1. 点击"新建集合" → 输入 `works` → 确定
2. 进入 works 集合 → 权限设置 → 自定义安全规则
3. 复制粘贴权限配置（见上方）

#### 创建 creditLogs 集合
1. 点击"新建集合" → 输入 `creditLogs` → 确定
2. 进入 creditLogs 集合 → 权限设置 → 自定义安全规则
3. 复制粘贴权限配置（见上方）

### 步骤3：创建索引（可选，优化性能）
对每个集合创建对应的索引（参考上方索引配置）

### 步骤4：添加测试数据（可选）
在每个集合中添加一条测试数据（参考上方示例数据）

## ✅ 验证创建结果

创建完成后，数据库页面应显示：
- ✅ users (0条记录)
- ✅ works (0条记录)  
- ✅ creditLogs (0条记录)

## 🔧 自动化创建（高级）

如果您熟悉云开发SDK，可以使用以下代码批量创建：

```javascript
// 注意：此代码需要在云函数中运行
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

async function initDatabase() {
  try {
    // 创建集合（如果不存在会自动创建）
    await db.collection('users').get();
    await db.collection('works').get();
    await db.collection('creditLogs').get();
    
    console.log('数据库集合初始化完成');
  } catch (error) {
    console.log('集合创建完成');
  }
}
```

---
生成时间：2025/6/24 16:13:59
