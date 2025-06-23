#!/bin/bash

echo "🚀 AI图片生成后端快速部署脚本"
echo "================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 进入后端目录
cd ai-backend

echo "📦 安装依赖..."
npm install

echo "🔧 检查配置文件..."
if [ ! -f "vercel.json" ]; then
    echo "❌ 缺少 vercel.json 配置文件"
    exit 1
fi

echo "🔑 环境变量配置提醒："
echo "请确保在Vercel仪表板配置以下环境变量："
echo "- DEEPSEEK_API_KEY"
echo "- ZHIPU_API_KEY" 
echo "- JWT_SECRET"
echo "- NODE_ENV=production"

echo ""
read -p "是否已配置环境变量？(y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "请先配置环境变量后再继续"
    exit 1
fi

echo "🚀 开始部署到Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "⚠️ Vercel CLI未安装，正在安装..."
    npm install -g vercel
    vercel --prod
fi

echo ""
echo "✅ 部署完成！"
echo "📋 后续步骤："
echo "1. 复制Vercel提供的部署URL"
echo "2. 在微信小程序后台配置request合法域名"
echo "3. 更新小程序代码中的API_BASE_URL"
echo "4. 重新编译小程序进行测试" 