#!/usr/bin/env node

/**
 * 快速更新小程序API配置脚本
 * 使用方法：node scripts/update-api-config.js YOUR_VERCEL_URL
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const vercelUrl = process.argv[2];

if (!vercelUrl) {
  console.error('❌ 请提供Vercel部署URL');
  console.log('使用方法：node scripts/update-api-config.js https://your-vercel-url.vercel.app');
  process.exit(1);
}

// 验证URL格式
if (!vercelUrl.startsWith('https://') || !vercelUrl.includes('vercel.app')) {
  console.error('❌ URL格式不正确，应该是 https://your-project.vercel.app');
  process.exit(1);
}

const apiUrl = `${vercelUrl}/api`;

console.log('🚀 开始更新API配置...');
console.log('📍 Vercel URL:', vercelUrl);
console.log('📍 API URL:', apiUrl);

// 更新原生小程序配置
const miniProgramApiPath = path.join(__dirname, '../miniprogram/utils/api.js');
if (fs.existsSync(miniProgramApiPath)) {
  let content = fs.readFileSync(miniProgramApiPath, 'utf8');
  
  // 替换API_BASE_URL
  content = content.replace(
    /const API_BASE_URL = 'https:\/\/[^']+'/,
    `const API_BASE_URL = '${apiUrl}'`
  );
  
  fs.writeFileSync(miniProgramApiPath, content);
  console.log('✅ 已更新原生小程序API配置:', miniProgramApiPath);
} else {
  console.log('⚠️  未找到原生小程序API配置文件');
}

// 更新Taro版本配置
const taroApiPath = path.join(__dirname, '../taro-mvp/src/services/api.ts');
if (fs.existsSync(taroApiPath)) {
  let content = fs.readFileSync(taroApiPath, 'utf8');
  
  // 替换生产环境URL
  content = content.replace(
    /: 'https:\/\/[^']+'/,
    `: '${apiUrl}'`
  );
  
  fs.writeFileSync(taroApiPath, content);
  console.log('✅ 已更新Taro版本API配置:', taroApiPath);
} else {
  console.log('⚠️  未找到Taro版本API配置文件');
}

console.log('\n🎉 配置更新完成！');
console.log('\n📋 下一步操作：');
console.log('1. 在微信小程序后台配置合法域名：', vercelUrl);
console.log('2. 测试后端服务：', `${vercelUrl}/health`);
console.log('3. 在小程序开发工具中重新上传代码');
console.log('\n📖 详细配置指南请查看：docs/miniprogram-backend-config.md'); 