#!/usr/bin/env node

/**
 * 云函数自动部署脚本
 * 使用方法：node scripts/deploy-cloud-functions.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  cloudfunctionsDir: path.join(__dirname, '../miniprogram/cloudfunctions'),
  functions: ['login', 'aiGenerate', 'userInfo', 'workManage']
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('🔍 检查部署前提条件...', 'blue');
  
  // 检查云函数目录
  if (!fs.existsSync(CONFIG.cloudfunctionsDir)) {
    log('❌ 云函数目录不存在！', 'red');
    process.exit(1);
  }
  
  // 检查每个云函数
  for (const funcName of CONFIG.functions) {
    const funcDir = path.join(CONFIG.cloudfunctionsDir, funcName);
    const packageJson = path.join(funcDir, 'package.json');
    const indexJs = path.join(funcDir, 'index.js');
    
    if (!fs.existsSync(funcDir)) {
      log(`❌ 云函数 ${funcName} 目录不存在！`, 'red');
      process.exit(1);
    }
    
    if (!fs.existsSync(packageJson)) {
      log(`❌ 云函数 ${funcName} 缺少 package.json！`, 'red');
      process.exit(1);
    }
    
    if (!fs.existsSync(indexJs)) {
      log(`❌ 云函数 ${funcName} 缺少 index.js！`, 'red');
      process.exit(1);
    }
  }
  
  log('✅ 所有前提条件检查通过！', 'green');
}

function installDependencies() {
  log('📦 安装云函数依赖...', 'blue');
  
  for (const funcName of CONFIG.functions) {
    const funcDir = path.join(CONFIG.cloudfunctionsDir, funcName);
    log(`  正在安装 ${funcName} 依赖...`, 'yellow');
    
    try {
      process.chdir(funcDir);
      execSync('npm install', { stdio: 'inherit' });
      log(`  ✅ ${funcName} 依赖安装完成`, 'green');
    } catch (error) {
      log(`  ❌ ${funcName} 依赖安装失败: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

function generateDeploymentGuide() {
  log('📋 生成部署指南...', 'blue');
  
  const guide = `
# 云函数部署指南

## 自动安装完成 ✅

依赖已为以下云函数安装完成：
${CONFIG.functions.map(name => `- ${name}`).join('\n')}

## 下一步：在微信开发者工具中部署

### 1. 打开微信开发者工具
- 导入项目：选择 miniprogram 目录
- 确保已开通云开发并创建环境

### 2. 部署每个云函数
对以下每个云函数执行部署操作：

${CONFIG.functions.map(name => `
**部署 ${name} 云函数：**
1. 右键 cloudfunctions/${name} 文件夹
2. 选择 "创建并部署：云端安装依赖"
3. 等待部署完成
`).join('\n')}

### 3. 验证部署
- 在云开发控制台 → 云函数页面
- 确认所有函数显示为 "已部署" 状态

### 4. 配置环境变量
在云开发控制台 → 环境 → 环境变量：
- 添加：ZHIPU_API_KEY=您的智谱AI密钥

### 5. 测试功能
- 在小程序中测试各项功能
- 查看云函数日志确认运行正常

## 问题排查

如果遇到问题，请查看：
- docs/cloud-development-setup-guide.md（完整配置指南）
- 云开发控制台的错误日志
- 微信开发者工具的调试信息

---
生成时间：${new Date().toLocaleString()}
`;

  fs.writeFileSync(path.join(__dirname, '../DEPLOYMENT_NEXT_STEPS.md'), guide);
  log('✅ 部署指南已生成：DEPLOYMENT_NEXT_STEPS.md', 'green');
}

function main() {
  try {
    log('🚀 开始云函数部署准备...', 'bright');
    
    checkPrerequisites();
    installDependencies();
    generateDeploymentGuide();
    
    log('\n🎉 部署准备完成！', 'green');
    log('📖 请查看 DEPLOYMENT_NEXT_STEPS.md 继续部署', 'yellow');
    log('📚 完整指南：docs/cloud-development-setup-guide.md', 'yellow');
    
  } catch (error) {
    log(`❌ 部署失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG }; 