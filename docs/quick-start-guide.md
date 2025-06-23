# AI文字生成图片系统 - 快速启动指南

## 🎯 概述

✅ **智谱AI优先策略** - 稳定、高质量的AI图像生成服务

本项目使用智谱AI GLM-4V CogView-3作为主要图像生成服务，配合DeepSeek进行提示词优化，提供完整的文字生成图片解决方案。

## 🚀 快速启动

### 方式1: 智谱AI服务 (推荐 ⭐)

**优势**: 配置简单、中文优化好、API稳定

1. **获取API密钥**
   - 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
   - 注册并获取API密钥

2. **配置环境变量**
   ```bash
   cd ai-backend
   echo "ZHIPU_API_KEY=your_zhipu_api_key_here" >> .env
   echo "DEEPSEEK_API_KEY=sk-33eee9a37ac841d9b6424700de95c546" >> .env
   echo "JWT_SECRET=ai-text-to-image-secret-key-2024" >> .env
   echo "DATABASE_URL=./data/ai-image-app.db" >> .env
   echo "PORT=3000" >> .env
   echo "NODE_ENV=development" >> .env
   ```

3. **启动服务**
   ```bash
   # 使用正确的Node.js版本
   nvm use 18.18.0
   
   # 安装依赖
   npm install
   
   # 启动开发服务器
   npm run dev
   ```

4. **测试服务**
   ```bash
   # 检查服务状态
   curl http://localhost:3000/health
   
   # 访问Web测试界面
   open http://localhost:3000
   ```

### 方式2: 模拟模式 (测试用)

如果暂时没有API密钥，系统会自动使用模拟模式：

```bash
cd ai-backend
# 启动服务（会自动检测并使用模拟模式）
npm run dev
```

## 📋 服务架构

### 🎯 两步生成流程

```
用户输入 → DeepSeek (提示词优化) → 智谱AI (图像生成) → 高质量图片
                                           ↓ (失败时)
                                      模拟模式 (保证可用性)
```

### 🔧 AI服务配置

- **提示词生成**: DeepSeek (专业提示词优化)
- **图像生成**: 智谱AI GLM-4V CogView-3 (高质量中文图像生成)
- **回退模式**: 自动模拟模式 (确保服务可用性)

## 🎨 使用示例

### Web界面测试

访问 `http://localhost:3000` 可以：

1. 输入中文描述（如"美丽的樱花盛开的春天"）
2. 选择风格（油画、写实、动漫等）
3. 点击生成，查看AI生成的高质量图片

### API调用示例

```bash
# 生成图片
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "prompt": "可爱的小猫在花园里玩耍",
    "style": "写实风格"
  }'
```

## 📊 系统特色

### ✅ 技术优势

- ✅ **成本优化**: 智谱AI配置简单，无需复杂端点配置
- ✅ **中文友好**: 对中文描述理解和生成效果优秀
- ✅ **高可用**: 智能回退机制确保服务稳定性
- ✅ **性价比高**: 约0.101元/张图片总成本

### 🛡️ 可靠性保障

- **智能容错**: AI服务失败时自动回退到模拟模式
- **健康监控**: 完整的服务状态监控
- **日志记录**: 详细的生成过程日志
- **错误处理**: 友好的错误提示和处理机制

## 💰 成本预估

- **智谱AI图像生成**: 约0.1元/张
- **DeepSeek提示词优化**: 约0.001元/次
- **总成本**: 约0.101元/张图片

## 🔧 故障排除

### 常见问题

1. **Node.js版本问题**
   ```bash
   nvm use 18.18.0
   npm rebuild better-sqlite3
   ```

2. **API密钥配置错误**
   - 检查 `.env` 文件中的 `ZHIPU_API_KEY` 是否正确
   - 确认API密钥有效且有足够余额

3. **服务启动失败**
   ```bash
   # 检查端口占用
   lsof -i :3000
   
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

### 日志查看

```bash
# 查看详细日志
npm run dev | grep -E "(错误|失败|成功)"
```

## 📚 参考文档

- [智谱AI主要服务配置指南](./zhipu-ai-primary-guide.md)
- [智谱AI API文档](./zhipu-api-guide.md)
- [部署指南](./deployment-quick-start.md)
- [技术架构说明](./tech-architecture.md)

---

**🎉 启动完成！现在您可以享受稳定、高质量的AI图像生成服务了！** 