#!/bin/bash

# 微信小程序发布准备脚本
echo "🚀 正在准备微信小程序发布..."

# 1. 启动后端服务
echo "📡 启动后端API服务..."
cd ai-backend
if ! pgrep -f "node.*app.js" > /dev/null; then
    npm start &
    echo "✅ 后端服务已启动 (localhost:3000)"
else
    echo "✅ 后端服务已在运行"
fi

# 2. 检查小程序文件
echo "📱 检查小程序文件..."
cd ../miniprogram

# 检查必要文件
required_files=(
    "app.js"
    "app.json"
    "app.wxss"
    "pages/index/index.js"
    "pages/result/result.js"
    "utils/api.js"
    "project.config.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
    fi
done

# 3. 生成发布清单
echo "📋 生成发布清单..."
cat > ../DEPLOYMENT_CHECKLIST.md << EOF
# 微信小程序发布清单

## 前置准备 ✅
- [ ] 注册微信小程序账号
- [ ] 获取 AppID
- [ ] 安装微信开发者工具

## 项目配置 📝
- [ ] 更新 project.config.json 中的 AppID
- [ ] 配置服务器域名（后端API地址）
- [ ] 更新 utils/api.js 中的生产环境地址

## 后端部署 🚀
- [ ] 选择部署方案（Vercel/云服务器/云函数）
- [ ] 部署后端API服务
- [ ] 测试API接口可用性

## 测试验证 🧪
- [ ] 导入项目到微信开发者工具
- [ ] 本地测试所有功能
- [ ] 真机预览测试
- [ ] 检查网络请求是否正常

## 发布上线 📱
- [ ] 上传代码到微信后台
- [ ] 提交审核
- [ ] 等待审核通过
- [ ] 发布上线

## 当前项目信息 📊
- 后端服务: http://localhost:3000
- 小程序目录: $(pwd)
- API密钥: 已配置 DeepSeek
- 数据库: SQLite ($(ls -lh ../ai-backend/data/*.db 2>/dev/null | awk '{print $5}' || echo "未创建"))

EOF

echo "📄 发布清单已生成: DEPLOYMENT_CHECKLIST.md"

# 4. 显示下一步操作
echo ""
echo "🎯 下一步操作："
echo "1. 打开微信开发者工具"
echo "2. 导入项目目录: $(pwd)"
echo "3. 输入你的 AppID"
echo "4. 开始测试和发布"
echo ""
echo "📖 详细指南请查看: docs/miniprogram-deployment-guide.md"
echo ""
echo "✨ 准备完成！现在可以开始发布流程了！" 