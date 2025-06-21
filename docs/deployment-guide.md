# 部署指南

## 快速开始

### 1. 环境准备

#### 必需工具
- **微信开发者工具**：最新版本
- **Node.js**：版本 >= 14.0.0
- **Git**：用于版本控制

#### 微信开发者账号准备
1. 注册微信小程序账号：https://mp.weixin.qq.com/
2. 获取 AppID 和 AppSecret
3. 配置服务器域名（后续需要）

### 2. 项目克隆与配置

```bash
# 克隆项目
git clone https://github.com/yourusername/text-to-images-mp.git
cd text-to-images-mp

# 安装依赖（可选，主要用于代码规范检查）
npm install
```

### 3. 微信开发者工具配置

#### 导入项目
1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择项目根目录
4. 输入项目名称和 AppID
5. 点击"导入"

#### 基础配置
```json
// project.config.json 中需要修改的配置
{
  "appid": "你的小程序AppID",  // 替换为实际AppID
  "projectname": "AI绘图助手"
}
```

### 4. 云开发环境配置

#### 开通云开发
1. 在微信开发者工具中点击"云开发"
2. 选择"开通云开发"
3. 创建云环境（建议创建两个：test-环境ID, prod-环境ID）

#### 配置云环境
```javascript
// miniprogram/app.js 中配置云环境
wx.cloud.init({
  env: 'your-cloud-env-id', // 替换为你的云环境ID
  traceUser: true,
})
```

### 5. AI服务配置

#### 申请AI服务API
根据产品规划，我们优先使用国内AI服务：

**文心一言（百度智能云）**
1. 访问：https://cloud.baidu.com/
2. 开通文心一言服务
3. 获取 API Key 和 Secret Key

**通义千问（阿里云）**
1. 访问：https://dashscope.aliyuncs.com/
2. 开通通义千问服务
3. 获取 API Key

**豆包（火山引擎）**
1. 访问：https://www.volcengine.com/
2. 开通豆包AI服务
3. 获取 API Key

**DeepSeek**
1. 访问：https://www.deepseek.com/
2. 申请API访问权限
3. 获取 API Key

#### 配置API密钥
```javascript
// cloudfunctions/generateImage/config.js（需要创建）
module.exports = {
  AI_SERVICES: {
    baidu: {
      apiKey: 'your-baidu-api-key',
      secretKey: 'your-baidu-secret-key'
    },
    alibaba: {
      apiKey: 'your-alibaba-api-key'
    },
    bytedance: {
      apiKey: 'your-bytedance-api-key'
    },
    deepseek: {
      apiKey: 'your-deepseek-api-key'
    }
  }
}
```

### 6. 云函数部署

#### 创建云函数
```bash
# 在项目根目录下创建云函数
mkdir -p cloudfunctions/generateImage
mkdir -p cloudfunctions/getUserInfo
mkdir -p cloudfunctions/saveWork
mkdir -p cloudfunctions/getTemplates
```

#### 部署云函数
1. 在微信开发者工具中右键点击云函数目录
2. 选择"创建并部署云函数"
3. 等待部署完成

### 7. 数据库初始化

#### 创建数据库集合
在云开发控制台中创建以下集合：
- `users`：用户信息
- `works`：用户作品
- `templates`：创意模板
- `characters`：角色库

#### 初始化数据
```javascript
// 在云开发控制台数据库中手动添加初始数据
// 或者创建云函数来初始化数据
```

### 8. 域名配置

#### 配置服务器域名
在小程序后台配置以下域名：

**request合法域名**
```
https://aip.baidubce.com
https://dashscope.aliyuncs.com
https://ark.cn-beijing.volces.com
https://api.deepseek.com
```

**uploadFile合法域名**
```
https://你的云存储域名
```

**downloadFile合法域名**
```
https://你的云存储域名
https://你的CDN域名
```

### 9. 测试验证

#### 功能测试
1. **登录功能**：测试用户登录和信息获取
2. **生成功能**：测试文字生成图片
3. **角色选择**：测试角色库加载和选择
4. **模板功能**：测试创意模板使用
5. **作品管理**：测试作品保存和查看

#### 性能测试
1. 页面加载速度
2. 图片生成时间
3. 网络请求响应时间

### 10. 发布上线

#### 提交审核
1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目备注
3. 在小程序后台提交审核

#### 发布配置
```javascript
// 生产环境配置
const isProduction = true;
const config = {
  cloudEnv: isProduction ? 'prod-env-id' : 'test-env-id',
  debug: !isProduction
}
```

## 环境管理

### 开发环境
- **用途**：本地开发和调试
- **云环境**：test-环境ID
- **域名**：开发者工具内置
- **数据**：测试数据

### 测试环境  
- **用途**：功能测试和预发布验证
- **云环境**：test-环境ID
- **域名**：配置测试域名
- **数据**：模拟真实数据

### 生产环境
- **用途**：正式发布给用户使用
- **云环境**：prod-环境ID  
- **域名**：正式域名
- **数据**：真实用户数据

## 监控和维护

### 日志监控
```javascript
// 在云函数中添加日志
console.log('函数执行开始', {
  functionName: context.FUNCTION_NAME,
  requestId: context.REQUEST_ID,
  timestamp: new Date().toISOString()
});
```

### 错误处理
```javascript
// 统一错误处理
try {
  // 业务逻辑
} catch (error) {
  console.error('函数执行错误', {
    error: error.message,
    stack: error.stack,
    context: context
  });
  
  return {
    code: -1,
    message: '系统繁忙，请稍后重试'
  };
}
```

### 性能优化
1. **图片优化**：使用 WebP 格式，配置 CDN
2. **代码优化**：启用代码压缩和分包加载
3. **缓存策略**：合理使用本地缓存和云端缓存

## 常见问题

### Q1: 云函数部署失败
**解决方案**：
1. 检查网络连接
2. 确认云环境ID正确
3. 检查云函数代码语法

### Q2: AI接口调用失败
**解决方案**：
1. 检查API密钥是否正确
2. 确认API调用配额
3. 检查网络域名配置

### Q3: 图片加载慢
**解决方案**：
1. 配置CDN加速
2. 使用图片压缩
3. 实现图片懒加载

### Q4: 小程序审核被拒
**解决方案**：
1. 检查内容合规性
2. 完善隐私政策
3. 确保功能描述准确

## 更新部署

### 版本更新流程
1. **开发完成**：在开发环境完成功能开发
2. **测试验证**：在测试环境进行充分测试
3. **代码审查**：进行代码 Review
4. **部署生产**：部署到生产环境
5. **发布上线**：提交小程序审核并发布

### 热更新策略
```javascript
// 检查版本更新
const updateManager = wx.getUpdateManager();

updateManager.onCheckForUpdate(function (res) {
  // 请求完新版本信息的回调
  console.log(res.hasUpdate);
});

updateManager.onUpdateReady(function () {
  wx.showModal({
    title: '更新提示',
    content: '新版本已经准备好，是否重启应用？',
    success: function (res) {
      if (res.confirm) {
        updateManager.applyUpdate();
      }
    }
  });
});
```

## 成本控制

### AI服务成本
- 合理设置调用频率限制
- 优化prompt以减少token消耗
- 监控API调用量和费用

### 云服务成本
- 定期清理无用数据
- 优化云函数内存配置
- 合理设置CDN缓存策略

### 运维成本
- 自动化部署流程
- 监控告警机制
- 定期性能优化

---

**注意事项**：
1. 请妥善保管API密钥，不要提交到代码仓库
2. 定期备份数据库数据
3. 监控服务状态和用户反馈
4. 遵守相关法律法规和平台规范 