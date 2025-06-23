# 智谱AI API 配置指南

## 🚀 快速开始

### 1. 注册智谱AI账号
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 点击"立即注册"，使用手机号注册账号
3. 完成实名认证（需要身份证）

### 2. 获取API密钥
1. 登录后进入 [API Keys 管理页面](https://open.bigmodel.cn/usercenter/apikeys)
2. 点击"创建新的APIKey"
3. 输入密钥名称（如：text-to-image-app）
4. 复制生成的API密钥（格式：`xx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 3. 查看余额和模型
1. 进入 [账户中心](https://open.bigmodel.cn/usercenter/overview)
2. 查看账户余额（新用户有免费额度）
3. 确认已开通CogView-3图片生成模型

## 💰 价格信息
- **免费额度**: 新用户注册赠送一定免费额度
- **CogView-3 价格**: 约 0.1元/张 (1024x1024)
- **付费方式**: 支持微信、支付宝充值

## 🔧 配置到项目

### 更新环境变量
在 `ai-backend/.env` 文件中添加：
```bash
ZHIPU_API_KEY=your_actual_api_key_here
```

### 测试API连接
```bash
# 重启服务
npm start

# 测试智谱AI图片生成
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "可爱的小猫", "userType": "guest"}'
```

## 📋 优势对比

### 智谱AI GLM-4V 优势
- ✅ **多模态能力强**: 支持图片理解+生成+编辑
- ✅ **API稳定**: 企业级服务，99.9%可用性
- ✅ **中文优化**: 对中文prompt理解更好
- ✅ **成本控制**: 按使用量付费，无月费
- ✅ **技术支持**: 官方客服和技术群支持

### 相比豆包的优势
- ✅ **无需推理接入点**: 直接使用API，配置简单
- ✅ **文档清晰**: API文档详细，示例丰富  
- ✅ **社区活跃**: 开发者社区支持好
- ✅ **模型更新**: 定期更新模型能力

## 🔍 故障排除

### 常见错误
1. **401 Unauthorized**: API密钥错误或过期
2. **400 Bad Request**: 请求参数格式问题
3. **429 Too Many Requests**: 请求频率过高
4. **余额不足**: 需要充值账户

### 解决方案
1. 检查API密钥格式和有效性
2. 确认prompt长度不超过限制
3. 实现请求频率限制
4. 监控账户余额并及时充值

## 📞 技术支持
- 官方文档：https://open.bigmodel.cn/dev/api
- 技术交流群：关注微信公众号获取群二维码
- 工单系统：开放平台提交技术工单 