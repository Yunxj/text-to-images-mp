#!/bin/bash

# AI文字生成图片系统 - 快速启动脚本

echo "🚀 AI文字生成图片系统快速启动"
echo "================================"

# 1. 检查Node.js版本
echo "📋 检查Node.js版本..."
NODE_VERSION=$(node --version)
echo "当前Node.js版本: $NODE_VERSION"

if [[ $NODE_VERSION != v18* ]]; then
    echo "⚠️  建议使用Node.js 18.x版本"
    echo "请运行: nvm use 18.18.0"
fi

# 2. 进入后端目录
cd ai-backend

# 3. 检查环境变量
echo "📋 检查环境变量..."
if [ ! -f .env ]; then
    echo "⚠️  未找到.env文件"
    echo "请创建.env文件并配置API密钥"
    echo "参考.env.example文件"
fi

# 4. 安装依赖
echo "📦 检查依赖..."
if [ ! -d node_modules ]; then
    echo "安装依赖中..."
    npm install
fi

# 5. 重新编译SQLite
echo "🔧 重新编译better-sqlite3..."
npm rebuild better-sqlite3

# 6. 启动服务
echo "🚀 启动服务..."
echo "服务将运行在: http://localhost:3000"
echo "测试页面: http://localhost:3000"
echo ""
echo "按Ctrl+C停止服务"
echo ""

node src/app.js 