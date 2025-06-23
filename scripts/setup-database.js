#!/usr/bin/env node

/**
 * MongoDB Atlas 数据库快速设置脚本
 * 用途：初始化数据库、创建索引、插入初始数据
 */

const { MongoClient } = require('mongodb');
const readline = require('readline');

// 配置
const DB_NAME = 'ai_image_db';
const COLLECTIONS = ['users', 'works', 'templates', 'characters', 'configs'];

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 获取用户输入
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// 主函数
async function main() {
  console.log('🚀 MongoDB Atlas 数据库设置向导');
  console.log('====================================');
  
  try {
    // 获取连接信息
    const mongoUri = await getMongoUri();
    
    // 连接数据库
    console.log('\n📡 连接到 MongoDB Atlas...');
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ 数据库连接成功！');
    
    const db = client.db(DB_NAME);
    
    // 创建集合
    await createCollections(db);
    
    // 创建索引
    await createIndexes(db);
    
    // 插入初始数据
    const shouldInsertData = await askQuestion('\n❓ 是否插入初始数据？(y/n): ');
    if (shouldInsertData.toLowerCase() === 'y') {
      await insertInitialData(db);
    }
    
    // 验证设置
    await verifySetup(db);
    
    console.log('\n🎉 数据库设置完成！');
    console.log('📋 连接字符串已保存，请添加到环境变量中：');
    console.log(`MONGODB_URI=${mongoUri}`);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ 设置失败:', error.message);
  } finally {
    rl.close();
  }
}

// 获取MongoDB连接字符串
async function getMongoUri() {
  console.log('\n请输入MongoDB Atlas连接信息：');
  
  const hasUri = await askQuestion('是否已有完整连接字符串？(y/n): ');
  
  if (hasUri.toLowerCase() === 'y') {
    return await askQuestion('请输入连接字符串: ');
  }
  
  // 手动构建连接字符串
  const username = await askQuestion('用户名: ');
  const password = await askQuestion('密码: ');
  const cluster = await askQuestion('集群地址 (如: cluster0.abc123.mongodb.net): ');
  
  return `mongodb+srv://${username}:${password}@${cluster}/${DB_NAME}?retryWrites=true&w=majority`;
}

// 创建集合
async function createCollections(db) {
  console.log('\n📁 创建集合...');
  
  for (const collectionName of COLLECTIONS) {
    try {
      await db.createCollection(collectionName);
      console.log(`✅ 创建集合: ${collectionName}`);
    } catch (error) {
      if (error.code === 48) {
        console.log(`⚠️  集合已存在: ${collectionName}`);
      } else {
        throw error;
      }
    }
  }
}

// 创建索引
async function createIndexes(db) {
  console.log('\n🔍 创建索引...');
  
  const indexOperations = [
    // 用户索引
    { collection: 'users', index: { openid: 1 }, options: { unique: true } },
    { collection: 'users', index: { unionid: 1 }, options: { sparse: true } },
    { collection: 'users', index: { 'vipInfo.expireTime': 1 } },
    { collection: 'users', index: { createdAt: -1 } },
    
    // 作品索引
    { collection: 'works', index: { userId: 1, createdAt: -1 } },
    { collection: 'works', index: { 'generation.status': 1 } },
    { collection: 'works', index: { 'visibility.isPublic': 1, createdAt: -1 } },
    { collection: 'works', index: { 'metadata.character.id': 1 } },
    
    // 模板索引
    { collection: 'templates', index: { category: 1, 'management.order': 1 } },
    { collection: 'templates', index: { 'management.isActive': 1 } },
    
    // 角色索引
    { collection: 'characters', index: { category: 1, 'management.order': 1 } },
    { collection: 'characters', index: { 'management.isActive': 1 } },
    { collection: 'characters', index: { 'usage.popularityScore': -1 } },
    
    // 配置索引
    { collection: 'configs', index: { key: 1 }, options: { unique: true } },
  ];
  
  for (const { collection, index, options = {} } of indexOperations) {
    try {
      await db.collection(collection).createIndex(index, options);
      console.log(`✅ 创建索引: ${collection} - ${JSON.stringify(index)}`);
    } catch (error) {
      console.log(`⚠️  索引可能已存在: ${collection} - ${error.message}`);
    }
  }
}

// 插入初始数据
async function insertInitialData(db) {
  console.log('\n📊 插入初始数据...');
  
  // 系统配置
  const configs = [
    {
      key: "daily_free_limit",
      value: 5,
      category: "user_limits",
      description: "免费用户每日生成限制",
      isActive: true,
      updatedBy: "system",
      updatedAt: new Date()
    },
    {
      key: "vip_daily_limit",
      value: 100,
      category: "user_limits",
      description: "VIP用户每日生成限制",
      isActive: true,
      updatedBy: "system",
      updatedAt: new Date()
    },
    {
      key: "ai_providers",
      value: {
        deepseek: { priority: 1, cost: 0.002, enabled: true },
        // 已移除豆包，使用智谱AI作为主要服务
        tongyi: { priority: 3, cost: 0.02, enabled: true },
        wenxin: { priority: 4, cost: 0.03, enabled: true }
      },
      category: "ai_services",
      description: "AI服务商配置",
      isActive: true,
      updatedBy: "system",
      updatedAt: new Date()
    }
  ];
  
  try {
    await db.collection('configs').insertMany(configs);
    console.log('✅ 插入系统配置');
  } catch (error) {
    console.log('⚠️  配置可能已存在');
  }
  
  // 默认角色
  const characters = [
    {
      name: "可爱女孩",
      description: "甜美可爱的动漫女孩形象",
      category: "recommend",
      subcategory: "anime",
      image: "/images/characters/cute-girl.jpg",
      prompt: "cute anime girl, kawaii style, big eyes, sweet smile",
      attributes: {
        gender: "female",
        age: "young",
        style: "anime",
        mood: "happy",
        clothing: "casual",
        background: "simple"
      },
      usage: {
        usageCount: 0,
        popularityScore: 95,
        successRate: 0.95
      },
      management: {
        isActive: true,
        isVip: false,
        isFeatured: true,
        order: 1,
        tags: ["可爱", "动漫", "女孩"]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "帅气男孩",
      description: "阳光帅气的动漫男孩形象",
      category: "recommend",
      subcategory: "anime",
      image: "/images/characters/handsome-boy.jpg",
      prompt: "handsome anime boy, cool style, sharp eyes, confident smile",
      attributes: {
        gender: "male",
        age: "young",
        style: "anime",
        mood: "confident",
        clothing: "casual",
        background: "simple"
      },
      usage: {
        usageCount: 0,
        popularityScore: 88,
        successRate: 0.92
      },
      management: {
        isActive: true,
        isVip: false,
        isFeatured: true,
        order: 2,
        tags: ["帅气", "动漫", "男孩"]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "萌宠小猫",
      description: "可爱的小猫咪形象",
      category: "pet",
      subcategory: "cat",
      image: "/images/characters/cute-cat.jpg",
      prompt: "cute cat, kawaii style, big eyes, fluffy fur",
      attributes: {
        gender: "neutral",
        age: "young",
        style: "cute",
        mood: "playful",
        clothing: "none",
        background: "simple"
      },
      usage: {
        usageCount: 0,
        popularityScore: 92,
        successRate: 0.98
      },
      management: {
        isActive: true,
        isVip: false,
        isFeatured: true,
        order: 3,
        tags: ["萌宠", "小猫", "可爱"]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  try {
    await db.collection('characters').insertMany(characters);
    console.log('✅ 插入默认角色');
  } catch (error) {
    console.log('⚠️  角色可能已存在');
  }
  
  // 模板数据
  const templates = [
    {
      title: "励志鸡汤",
      description: "正能量励志文字配图",
      category: "jitang",
      tags: ["励志", "正能量", "鸡汤"],
      prompt: "inspirational quote background, warm colors, motivational text overlay",
      previewImages: ["/images/templates/jitang-1.jpg"],
      parameters: {
        defaultStyle: "warm",
        suggestedKeywords: ["努力", "坚持", "梦想", "成功"]
      },
      usage: {
        usageCount: 0,
        successRate: 0.95,
        avgRating: 4.5
      },
      management: {
        isActive: true,
        isVip: false,
        order: 1,
        creator: "system",
        reviewer: "admin"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "古风诗词",
      description: "中国古典风格诗词配图",
      category: "gufeng",
      tags: ["古风", "诗词", "中国风"],
      prompt: "chinese ancient style background, traditional elements, poetry text",
      previewImages: ["/images/templates/gufeng-1.jpg"],
      parameters: {
        defaultStyle: "traditional",
        suggestedKeywords: ["诗词", "古典", "水墨", "山水"]
      },
      usage: {
        usageCount: 0,
        successRate: 0.88,
        avgRating: 4.7
      },
      management: {
        isActive: true,
        isVip: true,
        order: 2,
        creator: "system",
        reviewer: "admin"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  try {
    await db.collection('templates').insertMany(templates);
    console.log('✅ 插入模板数据');
  } catch (error) {
    console.log('⚠️  模板可能已存在');
  }
}

// 验证设置
async function verifySetup(db) {
  console.log('\n🔍 验证数据库设置...');
  
  for (const collectionName of COLLECTIONS) {
    const count = await db.collection(collectionName).countDocuments();
    console.log(`📊 ${collectionName}: ${count} 条记录`);
  }
  
  // 检查索引
  const users = db.collection('users');
  const indexes = await users.listIndexes().toArray();
  console.log(`🔍 users 集合索引数量: ${indexes.length}`);
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 