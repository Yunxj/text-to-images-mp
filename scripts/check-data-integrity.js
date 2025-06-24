// 数据完整性检查和恢复脚本
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 数据完整性检查
async function checkDataIntegrity() {
  console.log('🔍 开始数据完整性检查...')
  
  try {
    // 1. 检查works集合状态
    const worksStats = await checkWorksCollection()
    
    // 2. 检查emergency_backup集合
    const backupStats = await checkEmergencyBackup()
    
    // 3. 检查用户数据一致性
    const userStats = await checkUserConsistency()
    
    // 4. 生成报告
    generateIntegrityReport(worksStats, backupStats, userStats)
    
  } catch (error) {
    console.error('❌ 数据完整性检查失败:', error)
  }
}

// 检查works集合
async function checkWorksCollection() {
  console.log('📊 检查works集合...')
  
  try {
    // 统计总记录数
    const totalCount = await db.collection('works').count()
    
    // 统计成功记录
    const completedCount = await db.collection('works')
      .where({ status: 'completed' })
      .count()
    
    // 统计失败记录
    const failedCount = await db.collection('works')
      .where({ status: 'failed' })
      .count()
    
    // 统计今日记录
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayCount = await db.collection('works')
      .where({
        createdAt: db.command.gte(startOfDay)
      })
      .count()
    
    // 检查异常记录（缺少必要字段）
    const invalidRecords = await db.collection('works')
      .where({
        userId: db.command.exists(false)
      })
      .get()
    
    const stats = {
      total: totalCount.total,
      completed: completedCount.total,
      failed: failedCount.total,
      today: todayCount.total,
      invalid: invalidRecords.data.length,
      successRate: totalCount.total > 0 ? (completedCount.total / totalCount.total * 100).toFixed(2) : 0
    }
    
    console.log('✅ Works集合统计:')
    console.log(`   总记录数: ${stats.total}`)
    console.log(`   成功记录: ${stats.completed}`)
    console.log(`   失败记录: ${stats.failed}`)
    console.log(`   今日记录: ${stats.today}`)
    console.log(`   异常记录: ${stats.invalid}`)
    console.log(`   成功率: ${stats.successRate}%`)
    
    return stats
    
  } catch (error) {
    console.error('❌ Works集合检查失败:', error)
    return null
  }
}

// 检查emergency_backup集合
async function checkEmergencyBackup() {
  console.log('🆘 检查emergency_backup集合...')
  
  try {
    const backupRecords = await db.collection('emergency_backup').get()
    
    if (backupRecords.data.length === 0) {
      console.log('✅ 没有紧急备份记录，数据保存正常')
      return { count: 0, needRecovery: false }
    }
    
    console.log(`⚠️  发现 ${backupRecords.data.length} 条紧急备份记录`)
    
    // 分析备份原因
    const reasonStats = {}
    backupRecords.data.forEach(record => {
      const reason = record.backupReason || 'unknown'
      reasonStats[reason] = (reasonStats[reason] || 0) + 1
    })
    
    console.log('📋 备份原因统计:')
    Object.entries(reasonStats).forEach(([reason, count]) => {
      console.log(`   ${reason}: ${count} 条`)
    })
    
    return {
      count: backupRecords.data.length,
      needRecovery: true,
      records: backupRecords.data,
      reasonStats
    }
    
  } catch (error) {
    console.error('❌ Emergency_backup集合检查失败:', error)
    return { count: 0, needRecovery: false, error: error.message }
  }
}

// 检查用户数据一致性
async function checkUserConsistency() {
  console.log('👥 检查用户数据一致性...')
  
  try {
    // 获取所有用户
    const users = await db.collection('users').get()
    
    const inconsistencies = []
    
    for (const user of users.data) {
      // 检查用户的实际作品数量
      const actualWorksCount = await db.collection('works')
        .where({ userId: user._id })
        .count()
      
      // 对比用户记录中的generateCount
      const recordedCount = user.generateCount || 0
      
      if (actualWorksCount.total !== recordedCount) {
        inconsistencies.push({
          userId: user._id,
          nickname: user.nickname,
          recorded: recordedCount,
          actual: actualWorksCount.total,
          difference: actualWorksCount.total - recordedCount
        })
      }
    }
    
    if (inconsistencies.length === 0) {
      console.log('✅ 用户数据一致性检查通过')
    } else {
      console.log(`⚠️  发现 ${inconsistencies.length} 个用户数据不一致`)
      inconsistencies.forEach(item => {
        console.log(`   用户 ${item.nickname}: 记录${item.recorded}，实际${item.actual}，差异${item.difference}`)
      })
    }
    
    return {
      totalUsers: users.data.length,
      inconsistencies: inconsistencies.length,
      details: inconsistencies
    }
    
  } catch (error) {
    console.error('❌ 用户数据一致性检查失败:', error)
    return { error: error.message }
  }
}

// 生成完整性报告
function generateIntegrityReport(worksStats, backupStats, userStats) {
  console.log('\n📋 =================== 数据完整性报告 ===================')
  
  // 总体状态
  let overallStatus = '✅ 良好'
  const issues = []
  
  if (backupStats && backupStats.needRecovery) {
    overallStatus = '⚠️  需要关注'
    issues.push(`发现${backupStats.count}条紧急备份记录`)
  }
  
  if (userStats && userStats.inconsistencies > 0) {
    overallStatus = '⚠️  需要关注'
    issues.push(`${userStats.inconsistencies}个用户数据不一致`)
  }
  
  if (worksStats && worksStats.invalid > 0) {
    overallStatus = '❌ 异常'
    issues.push(`${worksStats.invalid}条异常记录`)
  }
  
  console.log(`📊 总体状态: ${overallStatus}`)
  
  if (issues.length > 0) {
    console.log('🚨 发现的问题:')
    issues.forEach(issue => console.log(`   - ${issue}`))
  }
  
  // 数据统计
  if (worksStats) {
    console.log('\n📈 数据统计:')
    console.log(`   总生成次数: ${worksStats.total}`)
    console.log(`   成功率: ${worksStats.successRate}%`)
    console.log(`   今日活跃: ${worksStats.today} 次`)
  }
  
  // 建议操作
  console.log('\n💡 建议操作:')
  
  if (backupStats && backupStats.needRecovery) {
    console.log('   1. 检查紧急备份记录，考虑数据恢复')
    console.log('   2. 调查数据保存失败的根本原因')
  }
  
  if (userStats && userStats.inconsistencies > 0) {
    console.log('   3. 修复用户generateCount字段的不一致')
  }
  
  if (worksStats && worksStats.invalid > 0) {
    console.log('   4. 清理或修复异常记录')
  }
  
  if (issues.length === 0) {
    console.log('   🎉 数据状态良好，无需特殊操作')
  }
  
  console.log('\n====================================================\n')
}

// 数据恢复功能
async function recoverFromBackup() {
  console.log('🔧 开始数据恢复...')
  
  try {
    const backupRecords = await db.collection('emergency_backup').get()
    
    if (backupRecords.data.length === 0) {
      console.log('✅ 没有需要恢复的备份记录')
      return
    }
    
    let recoveredCount = 0
    
    for (const backup of backupRecords.data) {
      try {
        // 检查是否已经存在对应的正常记录
        const existingWork = await db.collection('works')
          .where({
            userId: backup.userId,
            prompt: backup.prompt,
            createdAt: backup.createdAt || backup.timestamp
          })
          .get()
        
        if (existingWork.data.length === 0) {
          // 不存在，进行恢复
          const recoveredWork = {
            ...backup,
            id: backup.id || `recovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: backup.status || 'completed',
            createdAt: backup.createdAt || backup.timestamp,
            recoveredAt: new Date(),
            isRecovered: true
          }
          
          // 移除备份相关字段
          delete recoveredWork.backupReason
          delete recoveredWork.originalError
          delete recoveredWork.timestamp
          delete recoveredWork._id
          
          await db.collection('works').add({
            data: recoveredWork
          })
          
          recoveredCount++
          console.log(`✅ 恢复记录: ${backup.id || 'unknown'}`)
        }
        
      } catch (error) {
        console.error(`❌ 恢复记录失败:`, error)
      }
    }
    
    console.log(`🎉 数据恢复完成，恢复了 ${recoveredCount} 条记录`)
    
    // 如果有成功恢复的记录，建议清理备份
    if (recoveredCount > 0) {
      console.log('💡 建议: 确认恢复无误后，可以清理emergency_backup集合')
    }
    
  } catch (error) {
    console.error('❌ 数据恢复失败:', error)
  }
}

// 修复用户数据不一致
async function fixUserConsistency() {
  console.log('🔧 开始修复用户数据不一致...')
  
  try {
    const users = await db.collection('users').get()
    let fixedCount = 0
    
    for (const user of users.data) {
      const actualWorksCount = await db.collection('works')
        .where({ userId: user._id })
        .count()
      
      const recordedCount = user.generateCount || 0
      
      if (actualWorksCount.total !== recordedCount) {
        await db.collection('users').doc(user._id).update({
          data: {
            generateCount: actualWorksCount.total,
            lastSyncAt: new Date()
          }
        })
        
        fixedCount++
        console.log(`✅ 修复用户 ${user.nickname}: ${recordedCount} → ${actualWorksCount.total}`)
      }
    }
    
    console.log(`🎉 用户数据修复完成，修复了 ${fixedCount} 个用户`)
    
  } catch (error) {
    console.error('❌ 用户数据修复失败:', error)
  }
}

// 导出函数
module.exports = {
  checkDataIntegrity,
  recoverFromBackup,
  fixUserConsistency
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('🚀 开始运行数据完整性检查...')
  checkDataIntegrity()
} 