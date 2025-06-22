const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 配置文件路径
const configPath = path.join(__dirname, '../config/cos.config.json');

// 默认配置
const defaultConfig = {
  SecretId: '',
  SecretKey: '',
  Bucket: 'ai-image-h5-1234567890',
  Region: 'ap-beijing',
  Domain: ''
};

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function loadOrCreateConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('✅ 找到现有配置文件');
      return config;
    }
  } catch (error) {
    console.log('⚠️  配置文件读取失败，将创建新配置');
  }

  console.log('\n🔧 首次使用，请配置腾讯云COS信息：');
  console.log('📖 获取密钥：https://console.cloud.tencent.com/cam/capi');
  
  const config = { ...defaultConfig };
  
  config.SecretId = await question('请输入 SecretId: ');
  config.SecretKey = await question('请输入 SecretKey: ');
  config.Bucket = await question(`请输入存储桶名称 (默认: ${defaultConfig.Bucket}): `) || defaultConfig.Bucket;
  config.Region = await question(`请输入地域 (默认: ${defaultConfig.Region}): `) || defaultConfig.Region;
  config.Domain = await question('请输入自定义域名 (可选，直接回车跳过): ');

  // 保存配置
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ 配置已保存');

  return config;
}

async function uploadFile(cos, localPath, remotePath, bucket, region) {
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: bucket,
      Region: region,
      Key: remotePath,
      Body: fs.createReadStream(localPath),
      ContentType: getContentType(localPath)
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadDirectory(cos, localDir, remotePrefix, bucket, region) {
  const files = [];
  
  function scanDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const localPath = path.join(dir, item);
      const remotePath = prefix ? `${prefix}/${item}` : item;
      const stat = fs.statSync(localPath);
      
      if (stat.isDirectory()) {
        scanDirectory(localPath, remotePath);
      } else {
        files.push({
          localPath,
          remotePath: remotePrefix ? `${remotePrefix}/${remotePath}` : remotePath
        });
      }
    }
  }
  
  scanDirectory(localDir);
  
  console.log(`📁 发现 ${files.length} 个文件需要上传`);
  
  let uploaded = 0;
  const total = files.length;
  
  for (const file of files) {
    try {
      await uploadFile(cos, file.localPath, file.remotePath, bucket, region);
      uploaded++;
      const progress = Math.round((uploaded / total) * 100);
      console.log(`⬆️  [${progress}%] ${file.remotePath}`);
    } catch (error) {
      console.error(`❌ 上传失败: ${file.remotePath}`, error.message);
    }
  }
  
  console.log(`✅ 上传完成: ${uploaded}/${total} 个文件`);
}

async function main() {
  try {
    console.log('🚀 开始部署H5应用到腾讯云COS...\n');
    
    // 检查构建目录
    const h5BuildPath = path.join(__dirname, '../dist/h5');
    if (!fs.existsSync(h5BuildPath)) {
      console.error('❌ 未找到H5构建文件，请先运行: npm run build:h5');
      process.exit(1);
    }
    
    // 加载配置
    const config = await loadOrCreateConfig();
    
    // 初始化COS
    const cos = new COS({
      SecretId: config.SecretId,
      SecretKey: config.SecretKey,
    });
    
    // 测试连接
    console.log('\n🔍 测试COS连接...');
    try {
      await new Promise((resolve, reject) => {
        cos.getBucket({
          Bucket: config.Bucket,
          Region: config.Region,
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      console.log('✅ COS连接成功');
    } catch (error) {
      console.error('❌ COS连接失败:', error.message);
      console.log('💡 请检查配置信息是否正确');
      process.exit(1);
    }
    
    // 确认部署
    const confirm = await question('\n🤔 确认部署到生产环境? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 部署已取消');
      process.exit(0);
    }
    
    // 开始上传
    console.log('\n📦 开始上传文件...');
    await uploadDirectory(cos, h5BuildPath, '', config.Bucket, config.Region);
    
    // 设置静态网站配置
    console.log('\n⚙️  配置静态网站...');
    try {
      await new Promise((resolve, reject) => {
        cos.putBucketWebsite({
          Bucket: config.Bucket,
          Region: config.Region,
          WebsiteConfiguration: {
            IndexDocument: {
              Suffix: 'index.html'
            },
            ErrorDocument: {
              Key: 'index.html' // SPA应用统一返回index.html
            }
          }
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      console.log('✅ 静态网站配置完成');
    } catch (error) {
      console.log('⚠️  静态网站配置失败:', error.message);
    }
    
    // 显示访问地址
    console.log('\n🎉 部署完成！');
    console.log('\n📱 访问地址:');
    
    if (config.Domain) {
      console.log(`   自定义域名: https://${config.Domain}`);
    }
    
    const cosUrl = `https://${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    console.log(`   COS地址: ${cosUrl}`);
    
    const websiteUrl = `https://${config.Bucket}.cos-website.${config.Region}.myqcloud.com`;
    console.log(`   静态网站: ${websiteUrl}`);
    
    console.log('\n💡 提示:');
    console.log('   - 如需绑定自定义域名，请在COS控制台配置');
    console.log('   - 建议开启CDN加速以提升访问速度');
    console.log('   - 记得配置HTTPS证书');
    
  } catch (error) {
    console.error('❌ 部署失败:', error);
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