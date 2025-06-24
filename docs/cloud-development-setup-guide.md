# 微信云开发配置完整指南

## 📋 配置前准备

### 1. 必要条件检查
- [ ] 微信开发者账号（已认证）
- [ ] 微信开发者工具（最新版本）
- [ ] 小程序 AppID
- [ ] 智谱AI API密钥

### 2. 项目文件确认
确保以下文件已正确创建：
```
miniprogram/
├── cloudfunctions/
│   ├── login/
│   ├── aiGenerate/
│   ├── userInfo/
│   └── workManage/
├── app.js
├── utils/cloudApi.js
└── project.config.json
```

## 🚀 第一步：微信开发者工具配置

### 1.1 打开项目
1. 启动微信开发者工具
2. 选择 "导入项目"
3. 项目目录选择：`/path/to/text-to-images-mp/miniprogram`
4. AppID：输入您的小程序AppID
5. 项目名称：AI文字生成图片

### 1.2 启用云开发
1. 点击工具栏 "云开发" 按钮
2. 如果是首次使用，会提示开通云开发
3. 点击 "开通云开发"

### 1.3 创建云环境
1. 在云开发控制台中点击 "新建环境"
2. 环境名称：`ai-image-prod`（生产环境）
3. 环境ID：系统自动生成（如：`cloud1-xxx`）
4. 记录环境ID，稍后需要配置

## 🔧 第二步：配置项目文件

### 2.1 更新 project.config.json
```json
{
  "description": "AI文字生成图片小程序",
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "appid": "您的小程序AppID",
  "projectname": "ai-image-miniprogram",
  "condition": {},
  "cloudfunctions": {
    "current": -1,
    "list": []
  }
}
```

### 2.2 初始化云开发
在 `miniprogram/app.js` 中确认云开发初始化：
```javascript
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-xxx', // 替换为您的环境ID
        traceUser: true,
      });
    }
  }
});
```

## ☁️ 第三步：部署云函数

### 3.1 安装云函数依赖
在微信开发者工具中：

1. **安装 login 云函数依赖**
   - 右键 `cloudfunctions/login` 文件夹
   - 选择 "在终端中打开"
   - 运行：`npm install`

2. **安装 aiGenerate 云函数依赖**
   - 右键 `cloudfunctions/aiGenerate` 文件夹
   - 选择 "在终端中打开"
   - 运行：`npm install`

3. **安装 userInfo 云函数依赖**
   - 右键 `cloudfunctions/userInfo` 文件夹
   - 选择 "在终端中打开"
   - 运行：`npm install`

4. **安装 workManage 云函数依赖**
   - 右键 `cloudfunctions/workManage` 文件夹
   - 选择 "在终端中打开"
   - 运行：`npm install`

### 3.2 部署云函数
对每个云函数执行以下操作：

1. 右键云函数文件夹（如 `login`）
2. 选择 "创建并部署：云端安装依赖"
3. 等待部署完成
4. 重复此步骤部署所有4个云函数

### 3.3 验证部署
在云开发控制台 → 云函数页面，确认所有函数显示为 "已部署" 状态。

## 🗄️ 第四步：配置云数据库

### 4.1 创建数据库集合
在云开发控制台 → 数据库页面：

1. **创建 users 集合**
   - 点击 "新建集合"
   - 集合名：`users`
   - 权限设置：`仅创建者可写，所有人可读`

2. **创建 works 集合**
   - 集合名：`works`
   - 权限设置：`仅创建者可写，所有人可读`

3. **创建 creditLogs 集合**
   - 集合名：`creditLogs`
   - 权限设置：`仅创建者可写，所有人可读`

### 4.2 设置数据库索引
为 `works` 集合创建索引：

1. 进入 `works` 集合
2. 点击 "索引管理"
3. 创建索引：
   ```json
   {
     "userId": 1,
     "createdAt": -1
   }
   ```

### 4.3 配置数据库权限
在每个集合的权限设置中，确认使用以下安全规则：

```javascript
// users 集合
{
  "read": true,
  "write": "doc._openid == auth.openid"
}

// works 集合  
{
  "read": true,
  "write": "doc.userId == auth.openid"
}

// creditLogs 集合
{
  "read": "doc.userId == auth.openid",
  "write": "doc.userId == auth.openid"
}
```

## 🔑 第五步：配置环境变量

### 5.1 设置云函数环境变量
在云开发控制台 → 云函数 → 环境配置：

1. 添加环境变量：
   ```
   ZHIPU_API_KEY=您的智谱AI密钥
   ```

2. 保存配置

### 5.2 测试API连接
在 `aiGenerate` 云函数的测试页面：

1. 输入测试参数：
   ```json
   {
     "action": "getServiceStatus"
   }
   ```

2. 点击测试，确认返回正常

## 📱 第六步：测试小程序功能

### 6.1 编译预览
1. 在微信开发者工具中点击 "编译"
2. 确保没有编译错误
3. 在模拟器中测试基本功能

### 6.2 真机测试
1. 点击 "预览" 生成二维码
2. 用微信扫码在真机测试
3. 测试以下功能：
   - [ ] 用户登录
   - [ ] 图片生成
   - [ ] 作品保存
   - [ ] 历史记录

### 6.3 功能验证清单
- [ ] 云函数调用正常
- [ ] 数据库读写正常
- [ ] AI图片生成功能正常
- [ ] 用户登录状态保持
- [ ] 作品收藏功能正常

## 🚀 第七步：发布上线

### 7.1 版本管理
1. 在云开发控制台设置生产环境
2. 将代码中的环境ID改为生产环境ID
3. 重新部署所有云函数

### 7.2 小程序审核
1. 在微信开发者工具中点击 "上传"
2. 填写版本号和项目备注
3. 在微信公众平台提交审核

### 7.3 监控和维护
- 定期查看云开发控制台的用量统计
- 监控云函数的调用情况和错误日志
- 根据用户反馈优化功能

## 🔍 常见问题解决

### Q1: 云函数调用失败
**解决方案：**
- 检查环境ID是否正确
- 确认云函数已正确部署
- 查看云函数日志排查错误

### Q2: 数据库权限错误
**解决方案：**
- 检查安全规则配置
- 确认用户已正确登录
- 验证openid是否正确传递

### Q3: AI生成失败
**解决方案：**
- 检查智谱AI API密钥
- 确认网络连接正常
- 查看aiGenerate云函数日志

### Q4: 图片上传失败
**解决方案：**
- 检查云存储配置
- 确认上传权限设置
- 验证文件大小限制

## 📞 技术支持

如果遇到配置问题，可以：
1. 查看微信云开发官方文档
2. 在微信开发者社区提问
3. 检查项目的 `docs/` 目录下的其他文档

---

## 🎉 配置完成

完成以上所有步骤后，您的AI文字生成图片小程序就可以正常使用云开发服务了！

**下一步：** 可以开始邀请用户测试，并根据反馈进行功能优化。 