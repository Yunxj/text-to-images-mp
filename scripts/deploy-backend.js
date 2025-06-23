const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec, spawn } = require('child_process');
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

// 部署配置
const deployConfigs = {
  vercel: {
    name: 'Vercel',
    description: '快速部署，适合个人项目',
    commands: [
      'npm install -g vercel',
      'vercel --prod'
    ]
  },
  tencent: {
    name: '腾讯云SCF',
    description: '国内用户推荐，低延迟',
    commands: [
      'npm install -g serverless',
      'serverless deploy'
    ]
  },
  aws: {
    name: 'AWS Lambda',
    description: '海外用户推荐，稳定可靠',
    commands: [
      'npm install -g serverless',
      'serverless deploy'
    ]
  }
};

async function checkPrerequisites() {
  console.log('🔍 检查部署环境...\n');
  
  // 检查Node.js版本
  try {
    const { stdout } = await execAsync('node --version');
    const nodeVersion = stdout.trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    
    if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
      console.log('⚠️  建议使用Node.js 18或20版本');
    }
  } catch (error) {
    console.error('❌ Node.js未安装');
    return false;
  }
  
  // 检查npm
  try {
    const { stdout } = await execAsync('npm --version');
    console.log(`✅ npm: ${stdout.trim()}`);
  } catch (error) {
    console.error('❌ npm未安装');
    return false;
  }
  
  // 检查项目结构
  const requiredFiles = [
    'package.json',
    'src/app.module.ts',
    'src/main.ts'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      console.error(`❌ 缺少必要文件: ${file}`);
      return false;
    }
  }
  
  console.log('✅ 项目结构正确');
  return true;
}

async function selectDeploymentTarget() {
  console.log('\n🎯 选择部署目标:\n');
  
  const options = Object.keys(deployConfigs);
  options.forEach((key, index) => {
    const config = deployConfigs[key];
    console.log(`${index + 1}. ${config.name} - ${config.description}`);
  });
  
  const choice = await question('\n请选择部署目标 (1-3): ');
  const index = parseInt(choice) - 1;
  
  if (index >= 0 && index < options.length) {
    return options[index];
  } else {
    console.log('❌ 无效选择');
    return await selectDeploymentTarget();
  }
}

async function setupEnvironmentVariables() {
  console.log('\n🔧 配置环境变量...\n');
  
  const envVars = {
    NODE_ENV: 'production',
    MONGODB_URI: '',
    DEEPSEEK_API_KEY: '',
    ZHIPU_API_KEY: '',
    WECHAT_APP_ID: '',
    WECHAT_APP_SECRET: ''
  };
  
  // 检查是否存在.env文件
  const envPath = path.join(process.cwd(), '.env.production');
  if (fs.existsSync(envPath)) {
    console.log('✅ 找到现有环境变量文件');
    const useExisting = await question('是否使用现有配置? (y/N): ');
    if (useExisting.toLowerCase() === 'y') {
      return;
    }
  }
  
  console.log('请输入必要的环境变量:');
  
  for (const [key, defaultValue] of Object.entries(envVars)) {
    if (key === 'NODE_ENV') continue; // 跳过NODE_ENV
    
    const value = await question(`${key}: `);
    if (value.trim()) {
      envVars[key] = value.trim();
    }
  }
  
  // 生成.env.production文件
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ 环境变量配置已保存');
}

async function createServerlessConfig(target) {
  console.log('\n📝 创建Serverless配置...');
  
  const configs = {
    vercel: {
      filename: 'vercel.json',
      content: {
        version: 2,
        builds: [
          {
            src: 'dist/lambda.js',
            use: '@vercel/node'
          }
        ],
        routes: [
          {
            src: '/api/(.*)',
            dest: '/dist/lambda.js'
          }
        ],
        env: {
          NODE_ENV: 'production',
          MONGODB_URI: '@mongodb_uri',
          DEEPSEEK_API_KEY: '@deepseek_api_key',
          ZHIPU_API_KEY: '@zhipu_api_key',
          WECHAT_APP_ID: '@wechat_app_id',
          WECHAT_APP_SECRET: '@wechat_app_secret'
        }
      }
    },
    tencent: {
      filename: 'serverless.yml',
      content: `service: ai-image-backend

provider:
  name: tencent
  runtime: Nodejs18.15
  region: ap-beijing
  credentials: ~/.tencent/credentials

functions:
  api:
    handler: dist/lambda.handler
    events:
      - apigw:
          path: /{proxy+}
          method: ANY
          cors: true
    environment:
      NODE_ENV: production
      MONGODB_URI: \${env:MONGODB_URI}
      DEEPSEEK_API_KEY: \${env:DEEPSEEK_API_KEY}
      ZHIPU_API_KEY: \${env:ZHIPU_API_KEY}
      WECHAT_APP_ID: \${env:WECHAT_APP_ID}
      WECHAT_APP_SECRET: \${env:WECHAT_APP_SECRET}
    timeout: 30
    memorySize: 512

plugins:
  - serverless-tencent
  - serverless-plugin-typescript

custom:
  typescript:
    tsConfigFileLocation: './tsconfig.json'`
    },
    aws: {
      filename: 'serverless.yml',
      content: `service: ai-image-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    MONGODB_URI: \${env:MONGODB_URI}
    DEEPSEEK_API_KEY: \${env:DEEPSEEK_API_KEY}
    ZHIPU_API_KEY: \${env:ZHIPU_API_KEY}
    WECHAT_APP_ID: \${env:WECHAT_APP_ID}
    WECHAT_APP_SECRET: \${env:WECHAT_APP_SECRET}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    timeout: 30
    memorySize: 512

plugins:
  - serverless-plugin-typescript

custom:
  typescript:
    tsConfigFileLocation: './tsconfig.json'`
    }
  };
  
  const config = configs[target];
  const configPath = path.join(process.cwd(), config.filename);
  
  if (fs.existsSync(configPath)) {
    const overwrite = await question(`${config.filename} 已存在，是否覆盖? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      return;
    }
  }
  
  if (typeof config.content === 'string') {
    fs.writeFileSync(configPath, config.content);
  } else {
    fs.writeFileSync(configPath, JSON.stringify(config.content, null, 2));
  }
  
  console.log(`✅ ${config.filename} 配置已创建`);
}

async function createLambdaAdapter() {
  console.log('\n🔧 创建Lambda适配器...');
  
  const lambdaPath = path.join(process.cwd(), 'src/lambda.ts');
  
  if (fs.existsSync(lambdaPath)) {
    const overwrite = await question('lambda.ts 已存在，是否覆盖? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      return;
    }
  }
  
  const lambdaContent = `import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import { createServer, proxy } from 'aws-serverless-express';

let server;

async function createNestServer() {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter);
  
  // 启用CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 全局异常过滤器
  // app.useGlobalFilters(new AllExceptionsFilter());
  
  // 全局验证管道
  // app.useGlobalPipes(new ValidationPipe());
  
  await app.init();
  return createServer(expressApp);
}

export const handler = async (event, context) => {
  console.log('Lambda function invoked:', JSON.stringify(event, null, 2));
  
  if (!server) {
    server = await createNestServer();
  }
  
  return proxy(server, event, context, 'PROMISE').promise;
};`;
  
  fs.writeFileSync(lambdaPath, lambdaContent);
  console.log('✅ Lambda适配器已创建');
}

async function installDependencies(target) {
  console.log('\n📦 安装部署依赖...');
  
  const dependencies = {
    common: [
      'aws-serverless-express',
      '@nestjs/platform-express'
    ],
    vercel: [],
    tencent: [
      'serverless-tencent',
      'serverless-plugin-typescript'
    ],
    aws: [
      'serverless-plugin-typescript'
    ]
  };
  
  const allDeps = [...dependencies.common, ...dependencies[target]];
  
  if (allDeps.length > 0) {
    console.log(`安装依赖: ${allDeps.join(', ')}`);
    
    try {
      await execAsync(`npm install ${allDeps.join(' ')}`);
      console.log('✅ 依赖安装完成');
    } catch (error) {
      console.error('❌ 依赖安装失败:', error.message);
      return false;
    }
  }
  
  return true;
}

async function buildProject() {
  console.log('\n🔨 构建项目...');
  
  try {
    await execAsync('npm run build');
    console.log('✅ 项目构建完成');
    return true;
  } catch (error) {
    console.error('❌ 项目构建失败:', error.message);
    return false;
  }
}

async function deployProject(target) {
  console.log(`\n🚀 部署到 ${deployConfigs[target].name}...`);
  
  const commands = deployConfigs[target].commands;
  
  for (const command of commands) {
    console.log(`执行: ${command}`);
    
    try {
      if (command.includes('vercel') && command.includes('--prod')) {
        // Vercel需要交互式部署
        await new Promise((resolve, reject) => {
          const child = spawn('vercel', ['--prod'], {
            stdio: 'inherit',
            shell: true
          });
          
          child.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Command failed with code ${code}`));
            }
          });
        });
      } else {
        await execAsync(command);
      }
      
      console.log(`✅ ${command} 执行完成`);
    } catch (error) {
      console.error(`❌ ${command} 执行失败:`, error.message);
      return false;
    }
  }
  
  return true;
}

async function showDeploymentInfo(target) {
  console.log('\n🎉 部署完成！\n');
  
  const info = {
    vercel: {
      url: '查看Vercel控制台获取部署URL',
      dashboard: 'https://vercel.com/dashboard',
      docs: 'https://vercel.com/docs'
    },
    tencent: {
      url: '查看腾讯云SCF控制台获取API网关地址',
      dashboard: 'https://console.cloud.tencent.com/scf',
      docs: 'https://cloud.tencent.com/document/product/583'
    },
    aws: {
      url: '查看AWS Lambda控制台获取API Gateway地址',
      dashboard: 'https://console.aws.amazon.com/lambda',
      docs: 'https://docs.aws.amazon.com/lambda'
    }
  };
  
  const targetInfo = info[target];
  
  console.log('📱 访问信息:');
  console.log(`   URL: ${targetInfo.url}`);
  console.log(`   控制台: ${targetInfo.dashboard}`);
  console.log(`   文档: ${targetInfo.docs}`);
  
  console.log('\n💡 后续步骤:');
  console.log('   1. 测试API接口是否正常工作');
  console.log('   2. 配置自定义域名（可选）');
  console.log('   3. 设置监控和告警');
  console.log('   4. 更新前端API地址');
  
  if (target === 'vercel') {
    console.log('\n🔧 Vercel环境变量设置:');
    console.log('   vercel env add MONGODB_URI');
    console.log('   vercel env add DEEPSEEK_API_KEY');
    console.log('   vercel env add ZHIPU_API_KEY');
    console.log('   vercel env add WECHAT_APP_ID');
  }
}

async function main() {
  try {
    console.log('🚀 AI图片生成后端部署工具\n');
    
    // 检查前置条件
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk) {
      console.log('❌ 环境检查失败，请解决上述问题后重试');
      process.exit(1);
    }
    
    // 选择部署目标
    const target = await selectDeploymentTarget();
    console.log(`\n✅ 选择部署到: ${deployConfigs[target].name}`);
    
    // 配置环境变量
    await setupEnvironmentVariables();
    
    // 创建配置文件
    await createServerlessConfig(target);
    
    // 创建Lambda适配器
    await createLambdaAdapter();
    
    // 安装依赖
    const depsOk = await installDependencies(target);
    if (!depsOk) {
      console.log('❌ 依赖安装失败');
      process.exit(1);
    }
    
    // 构建项目
    const buildOk = await buildProject();
    if (!buildOk) {
      console.log('❌ 项目构建失败');
      process.exit(1);
    }
    
    // 确认部署
    const confirm = await question('\n🤔 确认开始部署? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 部署已取消');
      process.exit(0);
    }
    
    // 执行部署
    const deployOk = await deployProject(target);
    if (!deployOk) {
      console.log('❌ 部署失败');
      process.exit(1);
    }
    
    // 显示部署信息
    await showDeploymentInfo(target);
    
  } catch (error) {
    console.error('❌ 部署过程中发生错误:', error);
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