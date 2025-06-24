// 每日限制功能测试脚本
const path = require('path')

// 模拟微信云开发环境
const mockCloud = {
  init: () => {},
  DYNAMIC_CURRENT_ENV: 'test',
  getWXContext: () => ({
    OPENID: 'test_openid_123',
    APPID: 'test_appid'
  }),
  database: () => mockDB
}

// 模拟数据库
const mockDB = {
  command: {
    inc: (val) => ({ $inc: val }),
    neq: (val) => ({ $neq: val }),
    gte: (val) => ({ $gte: val }),
    lt: (val) => ({ $lt: val }),
    and: function(condition) { return { $and: [this, condition] } },
    exists: (exists) => ({ $exists: exists })
  },
  collection: (name) => mockCollection(name)
}

// 模拟集合操作
function mockCollection(collectionName) {
  return {
    doc: (id) => ({
      get: async () => mockData.get(collectionName, id),
      update: async (data) => mockData.update(collectionName, id, data)
    }),
    where: (condition) => ({
      get: async () => mockData.query(collectionName, condition),
      count: async () => ({ total: mockData.count(collectionName, condition) }),
      orderBy: (field, order) => ({
        skip: (num) => ({
          limit: (num) => ({
            get: async () => mockData.query(collectionName, condition)
          })
        })
      })
    }),
    add: async (data) => mockData.add(collectionName, data),
    count: async () => ({ total: mockData.count(collectionName, {}) })
  }
}

// 模拟数据存储
const mockData = {
  works: [],
  users: [
    {
      _id: 'user123',
      openid: 'test_openid_123',
      nickname: '测试用户',
      vipLevel: 0,
      credits: 100,
      generateCount: 0
    }
  ],
  emergency_backup: [],
  
  get(collection, id) {
    const data = this[collection].find(item => item._id === id)
    return { data: data || null }
  },
  
  query(collection, condition) {
    let results = this[collection]
    
    // 简单的条件过滤模拟
    if (condition.userId) {
      results = results.filter(item => item.userId === condition.userId)
    }
    if (condition.openid) {
      results = results.filter(item => item.openid === condition.openid)
    }
    if (condition.status && condition.status.$neq) {
      results = results.filter(item => item.status !== condition.status.$neq)
    }
    if (condition.createdAt) {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      results = results.filter(item => {
        const createdAt = new Date(item.createdAt)
        return createdAt >= startOfDay
      })
    }
    
    return { data: results }
  },
  
  count(collection, condition) {
    return this.query(collection, condition).data.length
  },
  
  add(collection, data) {
    const item = {
      _id: `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data.data
    }
    this[collection].push(item)
    return { _id: item._id }
  },
  
  update(collection, id, updateData) {
    const item = this[collection].find(item => item._id === id)
    if (item && updateData.data) {
      Object.assign(item, updateData.data)
    }
    return { stats: { updated: 1 } }
  }
}

// 模拟环境变量
process.env.ZHIPU_API_KEY = 'test_api_key'

// 模拟 wx-server-sdk 模块
require.cache[require.resolve.paths('wx-server-sdk')[0] + '/wx-server-sdk'] = {
  exports: mockCloud
}

// 将 wx-server-sdk 模块注入到模块系统中
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === 'wx-server-sdk') {
    return mockCloud
  }
  return originalRequire.apply(this, arguments)
}

// 模拟全局变量
global.cloud = mockCloud

// 加载云函数代码
const cloudFunctionPath = path.join(__dirname, '..', 'miniprogram', 'cloudfunctions', 'aiGenerate', 'index.js')
const cloudFunction = require(cloudFunctionPath)

// 测试函数
async function runTests() {
  console.log('🧪 开始测试每日限制功能...\n')
  
  try {
    // 测试1：查询每日使用量
    console.log('📊 测试1：查询每日使用量')
    const dailyUsageResult = await cloudFunction.main({
      action: 'getDailyUsage',
      data: { userId: 'user123' }
    }, {})
    
    console.log('✅ 每日使用量查询成功:', dailyUsageResult)
    console.log(`   今日已用: ${dailyUsageResult.data.used}/${dailyUsageResult.data.limit}`)
    console.log('')
    
    // 测试2：模拟生成图片（应该成功）
    console.log('🎨 测试2：模拟生成图片（第1次，应该成功）')
    const generateResult1 = await cloudFunction.main({
      action: 'generate',
      data: {
        prompt: '测试图片生成',
        character: '可爱女孩',
        style: 'cartoon',
        emotion: '微笑',
        mode: 'single'
      }
    }, {})
    
    console.log('✅ 第1次生成成功:', {
      code: generateResult1.code,
      message: generateResult1.message,
      dailyUsage: generateResult1.data.dailyUsage
    })
    console.log('')
    
    // 测试3：再次查询使用量（应该增加）
    console.log('📊 测试3：查询更新后的每日使用量')
    const dailyUsageResult2 = await cloudFunction.main({
      action: 'getDailyUsage',
      data: { userId: 'user123' }
    }, {})
    
    console.log('✅ 使用量更新成功:', dailyUsageResult2)
    console.log('')
    
    // 测试4：模拟达到限制
    console.log('🚫 测试4：模拟达到每日限制')
    
    // 先添加49条成功记录到数据库
    for (let i = 0; i < 49; i++) {
      mockData.add('works', {
        data: {
          userId: 'user123',
          status: 'completed',
          createdAt: new Date(),
          prompt: `测试图片${i + 2}`
        }
      })
    }
    
    console.log('📝 已模拟添加49条记录，总计应为50次')
    
    // 尝试第51次生成
    try {
      const generateResult51 = await cloudFunction.main({
        action: 'generate',
        data: {
          prompt: '第51次生成测试',
          character: '测试角色',
          style: 'realistic',
          emotion: '开心'
        }
      }, {})
      
      console.log('❌ 意外：第51次生成居然成功了！这不应该发生')
      console.log(generateResult51)
    } catch (error) {
      console.log('✅ 正确：第51次生成被拒绝')
      console.log(`   错误信息: ${error.message}`)
    }
    console.log('')
    
    // 测试5：查询最终使用量
    console.log('📊 测试5：查询最终每日使用量')
    const finalUsageResult = await cloudFunction.main({
      action: 'getDailyUsage',
      data: { userId: 'user123' }
    }, {})
    
    console.log('✅ 最终使用量:', finalUsageResult)
    console.log('')
    
    // 测试6：检查数据完整性
    console.log('🔍 测试6：检查数据完整性')
    console.log(`   Works记录总数: ${mockData.works.length}`)
    console.log(`   成功记录数: ${mockData.works.filter(w => w.status === 'completed').length}`)
    console.log(`   失败记录数: ${mockData.works.filter(w => w.status === 'failed').length}`)
    console.log(`   紧急备份数: ${mockData.emergency_backup.length}`)
    console.log('')
    
    console.log('🎉 所有测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
    console.error('错误详情:', error.stack)
  }
}

// 运行测试
if (require.main === module) {
  runTests()
}

module.exports = { runTests, mockData } 