# 豆包API修复指南

## 🚨 问题诊断

根据错误信息分析，豆包API调用失败的原因是：

```
错误: The parameter `model` specified in the request is not valid
错误码: InvalidParameter
```

**根本原因**: 豆包图片生成需要使用**推理接入点(Endpoint ID)**，而不是直接使用模型名称。

## 🔧 解决方案

### 方法1: 创建豆包推理接入点 (推荐)

#### 步骤1: 登录火山引擎控制台
1. 访问 [火山方舟控制台](https://console.volcengine.com/ark)
2. 使用您的火山引擎账号登录

#### 步骤2: 创建推理接入点
1. 进入 **在线推理** → **推理接入点管理**
2. 点击 **创建推理接入点**
3. 选择模型:
   - **模型类型**: 图片生成
   - **模型名称**: `doubao-seedream-3.0-t2i` 或 `豆包·文生图模型`
   - **地域**: 北京(推荐)
4. 配置参数:
   - **接入点名称**: `doubao-image-generation`
   - **限流设置**: 根据需求设置(建议开始设置较低的QPS)
   - **计费模式**: 后付费(按调用量计费)

#### 步骤3: 获取Endpoint ID
1. 创建完成后，在接入点列表中找到您的接入点
2. 复制 **Endpoint ID** (格式类似: `ep-20241023xxxxxx-xxxx`)

#### 步骤4: 更新环境变量
```bash
cd ai-backend
echo "DOUBAO_ENDPOINT_ID=您的实际endpoint_id" >> .env
```

### 方法2: 临时禁用豆包，使用智谱AI (快速方案)

如果您暂时不想配置豆包，可以临时禁用它：

```bash
cd ai-backend
# 注释掉豆包API密钥，这样会自动禁用豆包服务
sed -i 's/DOUBAO_API_KEY=/#DOUBAO_API_KEY=/' .env

# 重启服务
npm start
```

系统会自动使用智谱AI作为主要图片生成服务。

## 📋 配置验证

### 验证豆包配置是否正确
```bash
# 重启服务
cd ai-backend && npm start

# 在另一个终端测试
curl -X POST "http://localhost:3000/api/ai/status" \
  -H "Authorization: Bearer your_test_token"
```

看到豆包服务状态为 `enabled: true` 且没有错误即表示配置成功。

## 🎯 完整的环境变量示例

```bash
# .env 文件示例
# AI API配置
DEEPSEEK_API_KEY=sk-33eee9a37ac841d9b6424700de95c546
DOUBAO_API_KEY=260d0599-122d-4347-b284-fca257c6b5e0
DOUBAO_ENDPOINT_ID=ep-20241023140759-abcd  # 替换为您的实际endpoint ID
ZHIPU_API_KEY=your_zhipu_api_key_here

# JWT配置
JWT_SECRET=ai-text-to-image-secret-key-2024

# 数据库配置
DATABASE_URL=./data/ai-image-app.db

# 服务配置
PORT=3000
NODE_ENV=development
```

## 🔍 故障排除

### 常见错误及解决方案

**错误1**: `InvalidParameter - model not valid`
- **原因**: 使用了模型名称而不是endpoint ID
- **解决**: 按照上述步骤创建推理接入点并使用正确的endpoint ID

**错误2**: `AuthenticationError`
- **原因**: API密钥无效或过期
- **解决**: 检查火山引擎控制台的API密钥是否正确

**错误3**: `EndpointNotFound`
- **原因**: Endpoint ID不存在或已被删除
- **解决**: 重新创建推理接入点或检查endpoint ID是否正确

**错误4**: `QuotaExceeded`
- **原因**: 超出了限流或余额不足
- **解决**: 在控制台增加限流配置或充值账户余额

### 调试技巧

1. **查看详细日志**:
   ```bash
   cd ai-backend
   npm start | grep -E "(豆包|doubao|error)"
   ```

2. **测试endpoint连通性**:
   ```bash
   curl -X POST "https://ark.cn-beijing.volces.com/api/v3/images/generations" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "YOUR_ENDPOINT_ID", "prompt": "test", "n": 1, "size": "1024x1024"}'
   ```

## 📚 参考文档

- [火山引擎图片生成API文档](https://www.volcengine.com/docs/82379/1541523)
- [推理接入点管理指南](https://www.volcengine.com/docs/82379/1511736)
- [豆包模型列表](https://www.volcengine.com/docs/82379/1494384)

## 💡 最佳实践

1. **模型选择**: 建议使用 `doubao-seedream-3.0-t2i` 模型，效果较好
2. **限流设置**: 初期设置较小的QPS，根据实际需求逐步提升
3. **成本控制**: 设置每日/每月预算上限，避免意外超支
4. **备用方案**: 配置多个图片生成服务，确保系统稳定性

---

**🎉 完成以上配置后，您的豆包图片生成服务就能正常工作了！** 