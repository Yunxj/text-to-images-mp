#!/usr/bin/env node

/**
 * 数据库集合创建助手脚本
 * 生成创建数据库集合的详细指导
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 数据库集合配置
const COLLECTIONS = {
  users: {
    name: 'users',
    description: '用户信息集合',
    permission: {
      read: true,
      write: 'doc._openid == auth.openid'
    },
    sampleData: {
      _openid: 'test_user_123',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      credits: 100,
      totalGenerated: 0,
      membership: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    indexes: [
      {
        name: 'openid_index',
        fields: { _openid: 1 }
      }
    ]
  },
  works: {
    name: 'works',
    description: '用户作品集合',
    permission: {
      read: true,
      write: 'doc.userId == auth.openid'
    },
    sampleData: {
      userId: 'test_user_123',
      title: '测试作品',
      prompt: '一只可爱的小猫',
      imageUrl: 'https://example.com/image.jpg',
      model: 'cogview-3',
      style: 'realistic',
      isPublic: false,
      isFavorite: true,
      tags: ['动物', '可爱'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    indexes: [
      {
        name: 'user_time_index',
        fields: { userId: 1, createdAt: -1 }
      },
      {
        name: 'public_time_index',
        fields: { isPublic: 1, createdAt: -1 }
      }
    ]
  },
  creditLogs: {
    name: 'creditLogs',
    description: '积分记录集合',
    permission: {
      read: 'doc.userId == auth.openid',
      write: 'doc.userId == auth.openid'
    },
    sampleData: {
      userId: 'test_user_123',
      type: 'consume',
      amount: -10,
      reason: '生成图片',
      description: '使用AI生成图片消耗积分',
      relatedId: 'work_123',
      balance: 90,
      createdAt: new Date().toISOString()
    },
    indexes: [
      {
        name: 'user_time_index',
        fields: { userId: 1, createdAt: -1 }
      }
    ]
  }
};

function generateDatabaseGuide() {
  log('📋 生成数据库集合创建指南...', 'blue');
  
  const guide = `
# 云开发数据库集合快速创建指南

## 🎯 需要创建的集合

总共需要创建 **3个集合**：

${Object.values(COLLECTIONS).map(collection => `
### ${collection.name} - ${collection.description}
**权限配置**：
\`\`\`json
{
  "read": ${typeof collection.permission.read === 'string' ? `"${collection.permission.read}"` : collection.permission.read},
  "write": "${collection.permission.write}"
}
\`\`\`

**示例数据**：
\`\`\`json
${JSON.stringify(collection.sampleData, null, 2)}
\`\`\`

**索引配置**：
${collection.indexes.map(index => `
- **${index.name}**：
  \`\`\`json
  ${JSON.stringify(index.fields, null, 2)}
  \`\`\`
`).join('')}
`).join('\n')}

## 🚀 快速创建步骤

### 步骤1：打开云开发控制台
1. 在微信开发者工具中点击"云开发"按钮
2. 或直接访问：https://console.cloud.tencent.com/tcb

### 步骤2：批量创建集合
依次创建以下集合：

#### 创建 users 集合
1. 点击"新建集合" → 输入 \`users\` → 确定
2. 进入 users 集合 → 权限设置 → 自定义安全规则
3. 复制粘贴权限配置（见上方）

#### 创建 works 集合  
1. 点击"新建集合" → 输入 \`works\` → 确定
2. 进入 works 集合 → 权限设置 → 自定义安全规则
3. 复制粘贴权限配置（见上方）

#### 创建 creditLogs 集合
1. 点击"新建集合" → 输入 \`creditLogs\` → 确定
2. 进入 creditLogs 集合 → 权限设置 → 自定义安全规则
3. 复制粘贴权限配置（见上方）

### 步骤3：创建索引（可选，优化性能）
对每个集合创建对应的索引（参考上方索引配置）

### 步骤4：添加测试数据（可选）
在每个集合中添加一条测试数据（参考上方示例数据）

## ✅ 验证创建结果

创建完成后，数据库页面应显示：
- ✅ users (0条记录)
- ✅ works (0条记录)  
- ✅ creditLogs (0条记录)

## 🔧 自动化创建（高级）

如果您熟悉云开发SDK，可以使用以下代码批量创建：

\`\`\`javascript
// 注意：此代码需要在云函数中运行
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

async function initDatabase() {
  try {
    // 创建集合（如果不存在会自动创建）
    await db.collection('users').get();
    await db.collection('works').get();
    await db.collection('creditLogs').get();
    
    console.log('数据库集合初始化完成');
  } catch (error) {
    console.log('集合创建完成');
  }
}
\`\`\`

---
生成时间：${new Date().toLocaleString()}
`;

  fs.writeFileSync(path.join(__dirname, '../DATABASE_SETUP_GUIDE.md'), guide);
  log('✅ 数据库指南已生成：DATABASE_SETUP_GUIDE.md', 'green');
}

function generateCollectionTemplates() {
  log('📄 生成集合模板文件...', 'blue');
  
  const templatesDir = path.join(__dirname, '../database-templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir);
  }
  
  // 为每个集合生成模板文件
  Object.values(COLLECTIONS).forEach(collection => {
    const template = {
      name: collection.name,
      description: collection.description,
      permission: collection.permission,
      sampleData: collection.sampleData,
      indexes: collection.indexes,
      createScript: `
// 集合权限设置
{
  "read": ${typeof collection.permission.read === 'string' ? `"${collection.permission.read}"` : collection.permission.read},
  "write": "${collection.permission.write}"
}

// 示例数据
${JSON.stringify(collection.sampleData, null, 2)}

// 索引配置
${collection.indexes.map(index => `
// ${index.name}
${JSON.stringify(index.fields, null, 2)}`).join('\n')}
      `.trim()
    };
    
    const templatePath = path.join(templatesDir, `${collection.name}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    log(`  ✅ ${collection.name} 模板已生成`, 'green');
  });
  
  log(`✅ 所有模板文件已生成到：database-templates/`, 'green');
}

function showQuickCommands() {
  log('\n📋 快速创建命令总结：', 'cyan');
  log('', 'reset');
  
  log('1️⃣ 创建集合（在云开发控制台执行）：', 'yellow');
  Object.values(COLLECTIONS).forEach(collection => {
    log(`   • 新建集合：${collection.name}`, 'white');
  });
  
  log('\n2️⃣ 权限设置（复制到权限配置）：', 'yellow');
  Object.values(COLLECTIONS).forEach(collection => {
    log(`   • ${collection.name}:`, 'white');
    log(`     ${JSON.stringify(collection.permission)}`, 'green');
  });
  
  log('\n3️⃣ 测试小程序登录功能', 'yellow');
  log('   • 编译小程序', 'white');
  log('   • 测试游客登录', 'white');
  log('   • 确认不再出现数据库错误', 'white');
}

function main() {
  try {
    log('🚀 开始生成数据库集合创建指南...', 'bright');
    log('', 'reset');
    
    // 生成主要指南
    generateDatabaseGuide();
    
    // 生成集合模板
    generateCollectionTemplates();
    
    // 显示快速命令
    showQuickCommands();
    
    log('\n🎉 指南生成完成！', 'green');
    log('📖 主要指南：DATABASE_SETUP_GUIDE.md', 'cyan');
    log('📁 详细模板：database-templates/', 'cyan');
    log('📚 完整教程：docs/database-setup-step-by-step.md', 'cyan');
    
  } catch (error) {
    log(`❌ 生成失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { main, COLLECTIONS }; 