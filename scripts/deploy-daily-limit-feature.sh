#!/bin/bash

# AI图片生成每日限制功能部署脚本
echo "🚀 开始部署每日限制功能..."

# 检查是否在正确的目录
if [ ! -d "miniprogram" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 功能摘要
echo "📋 功能摘要："
echo "   ✅ 免费用户每日50次生成限制"
echo "   ✅ VIP用户每日200次生成限制"
echo "   ✅ 管理员每日1000次生成限制"
echo "   ✅ 0点自动重置机制"
echo "   ✅ 实时使用量显示"
echo "   ✅ 友好的错误提示"
echo ""

# 检查关键文件
echo "🔍 检查关键文件..."

# 检查云函数文件
if [ -f "miniprogram/cloudfunctions/aiGenerate/index.js" ]; then
    if grep -q "DAILY_LIMITS" "miniprogram/cloudfunctions/aiGenerate/index.js"; then
        echo "   ✅ 云函数aiGenerate已更新（包含每日限制逻辑）"
    else
        echo "   ❌ 云函数aiGenerate未正确更新"
        exit 1
    fi
else
    echo "   ❌ 云函数文件不存在"
    exit 1
fi

# 检查前端API文件
if [ -f "miniprogram/utils/cloudApi.js" ]; then
    if grep -q "getDailyUsage" "miniprogram/utils/cloudApi.js"; then
        echo "   ✅ 前端API已更新（包含每日使用量查询）"
    else
        echo "   ❌ 前端API未正确更新"
        exit 1
    fi
else
    echo "   ❌ 前端API文件不存在"
    exit 1
fi

# 检查首页文件
if [ -f "miniprogram/pages/index/index.js" ]; then
    if grep -q "dailyUsage" "miniprogram/pages/index/index.js"; then
        echo "   ✅ 首页逻辑已更新（包含每日使用量显示）"
    else
        echo "   ❌ 首页逻辑未正确更新"
        exit 1
    fi
else
    echo "   ❌ 首页文件不存在"
    exit 1
fi

# 检查首页模板文件
if [ -f "miniprogram/pages/index/index.wxml" ]; then
    if grep -q "dailyUsage" "miniprogram/pages/index/index.wxml"; then
        echo "   ✅ 首页模板已更新（包含每日使用量显示）"
    else
        echo "   ❌ 首页模板未正确更新"
        exit 1
    fi
else
    echo "   ❌ 首页模板文件不存在"
    exit 1
fi

# 检查文档
if [ -f "docs/daily-limit-feature.md" ]; then
    echo "   ✅ 功能文档已创建"
else
    echo "   ❌ 功能文档未创建"
    exit 1
fi

echo ""
echo "🎉 所有文件检查通过！"
echo ""

# 部署指南
echo "📖 部署指南："
echo ""
echo "1. 云函数部署："
echo "   在微信开发者工具中："
echo "   - 找到 cloudfunctions/aiGenerate 文件夹"
echo "   - 右键点击 → '创建并部署：云端安装依赖'"
echo "   - 等待部署完成（约30秒-1分钟）"
echo ""
echo "2. 前端部署："
echo "   - 小程序前端代码已更新完成"
echo "   - 直接编译预览即可生效"
echo ""
echo "3. 数据库要求："
echo "   - 确保 'works' 集合存在"
echo "   - 确保 'users' 集合包含 'vipLevel' 字段"
echo "   - 确保作品记录包含 'status' 和 'createdAt' 字段"
echo ""

# 测试建议
echo "🧪 测试建议："
echo ""
echo "1. 功能测试："
echo "   - 测试每日使用量查询 API"
echo "   - 测试生成图片时的每日限制检查"
echo "   - 测试超出限制时的错误提示"
echo "   - 测试VIP用户的更高限制"
echo ""
echo "2. 边界测试："
echo "   - 在0点前后测试重置功能"
echo "   - 测试接近限制数量时的行为"
echo "   - 测试失败生成不计入统计"
echo ""

# 配置说明
echo "⚙️ 配置说明："
echo ""
echo "每日限制可在以下位置调整："
echo "miniprogram/cloudfunctions/aiGenerate/index.js"
echo ""
echo "const DAILY_LIMITS = {"
echo "  free: 50,     // 免费用户每日50次"
echo "  vip: 200,     // VIP用户每日200次"  
echo "  admin: 1000   // 管理员每日1000次"
echo "}"
echo ""

# 监控建议
echo "📊 监控建议："
echo ""
echo "1. 使用量监控："
echo "   - 定期查看用户每日使用分布"
echo "   - 监控API调用成本变化"
echo "   - 关注用户反馈和满意度"
echo ""
echo "2. 性能监控："
echo "   - 监控云函数执行时间"
echo "   - 检查数据库查询性能"
echo "   - 观察错误率变化"
echo ""

# 完成提示
echo "✨ 每日限制功能部署准备完成！"
echo ""
echo "📋 核心特性："
echo "   ✅ 免费用户：每日50次"
echo "   ✅ VIP用户：每日200次"
echo "   ✅ 自动重置：每日0点"
echo "   ✅ 实时显示：使用量统计"
echo "   ✅ 友好提示：超限引导"
echo ""
echo "📖 详细文档：docs/daily-limit-feature.md"
echo ""
echo "🚀 现在请按照上述指南在微信开发者工具中部署云函数！" 