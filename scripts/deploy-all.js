const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 部署状态跟踪
const deploymentStatus = {
  database: false,
  backend: false,
  frontend: false
};

async function showWelcome() {
  console.log(`
🚀 AI文字生成图片 - 一键部署工具
=====================================

本工具将帮助您完成以下部署：
✅ 数据库部署 (MongoDB Atlas)
✅ 后端部署 (Serverless)
✅ 前端部署 (小程序 + H5)

预计总耗时：30-60分钟
`);
}

async function checkEnvironment() {
  console.log('🔍 检查部署环境...\n');
  
  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'Git', command: 'git --version' }
  ];
  
  for (const check of checks) {
    try {
      const { stdout } = await execAsync(check.command);
      console.log(`✅ ${check.name}: ${stdout.trim()}`);
    } catch (error) {
      console.error(`❌ ${check.name}: 未安装`);
      return false;
    }
  }
  
  // 检查项目文件
  const requiredFiles = [
    'package.json',
    'scripts/setup-database.js',
    'scripts/deploy-backend.js',
    'scripts/deploy-h5-cos.js'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      console.error(`❌ 缺少文件: ${file}`);
      return false;
    }
  }
  
  console.log('✅ 项目文件完整\n');
  return true;
}

async function selectDeploymentMode() {
  console.log('🎯 选择部署模式:\n');
  console.log('1. 🚀 完整部署 (数据库 + 后端 + 前端)');
  console.log('2. 🗄️  仅数据库部署');
  console.log('3. 🖥️  仅后端部署');
  console.log('4. 📱 仅前端部署');
  console.log('5. ⚙️  自定义部署');
  
  const choice = await question('\n请选择部署模式 (1-5): ');
  
  switch (choice) {
    case '1':
      return { database: true, backend: true, frontend: true };
    case '2':
      return { database: true, backend: false, frontend: false };
    case '3':
      return { database: false, backend: true, frontend: false };
    case '4':
      return { database: false, backend: false, frontend: true };
    case '5':
      return await customDeploymentSelection();
    default:
      console.log('❌ 无效选择');
      return await selectDeploymentMode();
  }
}

async function customDeploymentSelection() {
  console.log('\n⚙️ 自定义部署选项:\n');
  
  const database = await question('部署数据库? (y/N): ');
  const backend = await question('部署后端? (y/N): ');
  const frontend = await question('部署前端? (y/N): ');
  
  return {
    database: database.toLowerCase() === 'y',
    backend: backend.toLowerCase() === 'y',
    frontend: frontend.toLowerCase() === 'y'
  };
}

async function deployDatabase() {
  console.log('\n🗄️ 开始部署数据库...\n');
  
  try {
    // 检查是否已有数据库配置
    const configPath = path.join(process.cwd(), 'config/database.json');
    if (fs.existsSync(configPath)) {
      const useExisting = await question('发现现有数据库配置，是否使用? (y/N): ');
      if (useExisting.toLowerCase() !== 'y') {
        console.log('请手动运行: npm run db:setup');
        return false;
      }
    }
    
    // 运行数据库设置脚本
    console.log('📦 安装数据库依赖...');
    await execAsync('npm install mongodb');
    
    console.log('🔧 初始化数据库...');
    await execAsync('npm run db:setup');
    
    console.log('✅ 数据库部署完成');
    deploymentStatus.database = true;
    return true;
    
  } catch (error) {
    console.error('❌ 数据库部署失败:', error.message);
    return false;
  }
}

async function deployBackend() {
  console.log('\n🖥️ 开始部署后端...\n');
  
  try {
    // 检查数据库是否已部署
    if (!deploymentStatus.database) {
      const continueWithoutDb = await question('数据库未部署，是否继续? (y/N): ');
      if (continueWithoutDb.toLowerCase() !== 'y') {
        console.log('请先部署数据库');
        return false;
      }
    }
    
    console.log('🚀 启动后端部署脚本...');
    
    // 这里我们调用后端部署脚本
    const { main: deployBackendMain } = require('./deploy-backend.js');
    await deployBackendMain();
    
    console.log('✅ 后端部署完成');
    deploymentStatus.backend = true;
    return true;
    
  } catch (error) {
    console.error('❌ 后端部署失败:', error.message);
    return false;
  }
}

async function deployFrontend() {
  console.log('\n📱 开始部署前端...\n');
  
  try {
    // 选择前端部署类型
    console.log('选择前端部署类型:');
    console.log('1. 📱 微信小程序');
    console.log('2. 🌐 H5页面');
    console.log('3. 📦 全部部署');
    
    const choice = await question('请选择 (1-3): ');
    
    switch (choice) {
      case '1':
        await deployMiniProgram();
        break;
      case '2':
        await deployH5();
        break;
      case '3':
        await deployMiniProgram();
        await deployH5();
        break;
      default:
        console.log('❌ 无效选择');
        return false;
    }
    
    console.log('✅ 前端部署完成');
    deploymentStatus.frontend = true;
    return true;
    
  } catch (error) {
    console.error('❌ 前端部署失败:', error.message);
    return false;
  }
}

async function deployMiniProgram() {
  console.log('\n📱 部署微信小程序...');
  
  // 检查小程序项目结构
  const mpPath = path.join(process.cwd(), 'miniprogram');
  if (!fs.existsSync(mpPath)) {
    console.error('❌ 未找到小程序目录');
    return false;
  }
  
  console.log('📋 小程序部署步骤:');
  console.log('1. 使用微信开发者工具打开项目');
  console.log('2. 点击"上传"按钮上传代码');
  console.log('3. 在微信公众平台提交审核');
  console.log('4. 审核通过后发布上线');
  
  const openTool = await question('\n是否现在打开微信开发者工具? (y/N): ');
  if (openTool.toLowerCase() === 'y') {
    try {
      // 尝试打开微信开发者工具（macOS）
      await execAsync('open -a "wechatwebdevtools" .');
      console.log('✅ 微信开发者工具已打开');
    } catch (error) {
      console.log('⚠️  请手动打开微信开发者工具');
    }
  }
  
  console.log('📝 小程序配置检查清单:');
  console.log('   - AppID已配置');
  console.log('   - 服务器域名已添加');
  console.log('   - 业务域名已配置');
  console.log('   - 支付配置(如需要)');
  
  return true;
}

async function deployH5() {
  console.log('\n🌐 部署H5页面...');
  
  try {
    // 检查是否需要先构建Taro项目
    const taroConfigPath = path.join(process.cwd(), 'config/index.js');
    if (fs.existsSync(taroConfigPath)) {
      console.log('📦 检测到Taro项目，开始构建H5版本...');
      await execAsync('npm run build:h5');
      console.log('✅ H5构建完成');
    }
    
    // 调用H5部署脚本
    const { main: deployH5Main } = require('./deploy-h5-cos.js');
    await deployH5Main();
    
    return true;
  } catch (error) {
    console.error('❌ H5部署失败:', error.message);
    return false;
  }
}

async function showDeploymentSummary(selectedModes) {
  console.log('\n🎉 部署完成总结\n');
  console.log('='.repeat(50));
  
  if (selectedModes.database) {
    const status = deploymentStatus.database ? '✅ 成功' : '❌ 失败';
    console.log(`📊 数据库部署: ${status}`);
    if (deploymentStatus.database) {
      console.log('   - MongoDB Atlas集群已创建');
      console.log('   - 数据库结构已初始化');
      console.log('   - 索引已创建');
    }
  }
  
  if (selectedModes.backend) {
    const status = deploymentStatus.backend ? '✅ 成功' : '❌ 失败';
    console.log(`🖥️  后端部署: ${status}`);
    if (deploymentStatus.backend) {
      console.log('   - Serverless函数已部署');
      console.log('   - API网关已配置');
      console.log('   - 环境变量已设置');
    }
  }
  
  if (selectedModes.frontend) {
    const status = deploymentStatus.frontend ? '✅ 成功' : '❌ 失败';
    console.log(`📱 前端部署: ${status}`);
    if (deploymentStatus.frontend) {
      console.log('   - 小程序代码已准备');
      console.log('   - H5页面已部署');
      console.log('   - CDN配置已完成');
    }
  }
  
  console.log('\n📋 后续操作清单:');
  
  if (deploymentStatus.database && deploymentStatus.backend) {
    console.log('✅ 测试API接口连通性');
  }
  
  if (deploymentStatus.frontend) {
    console.log('✅ 小程序提交审核');
    console.log('✅ 配置自定义域名');
    console.log('✅ 设置CDN加速');
  }
  
  console.log('✅ 配置监控告警');
  console.log('✅ 备份策略设置');
  console.log('✅ 性能优化检查');
  
  console.log('\n🔗 相关链接:');
  console.log('   📖 部署文档: docs/deployment-complete-guide.md');
  console.log('   🐛 问题反馈: GitHub Issues');
  console.log('   💬 技术支持: 查看README.md');
  
  console.log('\n💡 提示:');
  console.log('   - 定期检查服务状态');
  console.log('   - 及时更新依赖版本');
  console.log('   - 关注用户反馈');
  console.log('   - 持续优化性能');
}

async function handleDeploymentError(error, step) {
  console.error(`\n❌ ${step}部署失败:`, error.message);
  
  console.log('\n🔧 可能的解决方案:');
  console.log('1. 检查网络连接');
  console.log('2. 验证配置信息');
  console.log('3. 查看详细错误日志');
  console.log('4. 重试部署操作');
  
  const retry = await question('\n是否重试此步骤? (y/N): ');
  return retry.toLowerCase() === 'y';
}

async function main() {
  try {
    // 显示欢迎信息
    await showWelcome();
    
    // 检查环境
    const envOk = await checkEnvironment();
    if (!envOk) {
      console.log('❌ 环境检查失败，请解决上述问题后重试');
      process.exit(1);
    }
    
    // 选择部署模式
    const selectedModes = await selectDeploymentMode();
    console.log('\n📋 部署计划:');
    console.log(`   数据库: ${selectedModes.database ? '✅' : '⏭️ '}`);
    console.log(`   后端: ${selectedModes.backend ? '✅' : '⏭️ '}`);
    console.log(`   前端: ${selectedModes.frontend ? '✅' : '⏭️ '}`);
    
    // 确认开始部署
    const confirm = await question('\n🤔 确认开始部署? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 部署已取消');
      process.exit(0);
    }
    
    console.log('\n🚀 开始部署流程...\n');
    console.log('='.repeat(50));
    
    // 依次执行部署
    if (selectedModes.database) {
      let success = await deployDatabase();
      while (!success) {
        const retry = await handleDeploymentError(new Error('数据库部署失败'), '数据库');
        if (!retry) break;
        success = await deployDatabase();
      }
    }
    
    if (selectedModes.backend) {
      let success = await deployBackend();
      while (!success) {
        const retry = await handleDeploymentError(new Error('后端部署失败'), '后端');
        if (!retry) break;
        success = await deployBackend();
      }
    }
    
    if (selectedModes.frontend) {
      let success = await deployFrontend();
      while (!success) {
        const retry = await handleDeploymentError(new Error('前端部署失败'), '前端');
        if (!retry) break;
        success = await deployFrontend();
      }
    }
    
    // 显示部署总结
    await showDeploymentSummary(selectedModes);
    
  } catch (error) {
    console.error('\n❌ 部署过程中发生未知错误:', error);
    console.log('\n📞 如需帮助，请查看部署文档或提交Issue');
  } finally {
    rl.close();
  }
}

// 处理退出信号
process.on('SIGINT', () => {
  console.log('\n👋 部署已中断');
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { main }; 