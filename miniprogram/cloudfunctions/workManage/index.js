// 云函数：作品管理
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'getWorks':
        return await getWorks(data, wxContext)
      case 'getWork':
        return await getWork(data, wxContext)
      case 'saveWork':
        return await saveWork(data, wxContext)
      case 'deleteWork':
        return await deleteWork(data, wxContext)
      case 'updateWork':
        return await updateWork(data, wxContext)
      default:
        return {
          code: 400,
          message: '未知的操作类型'
        }
    }
  } catch (error) {
    console.error('作品管理云函数错误:', error)
    return {
      code: 500,
      message: error.message || '服务器内部错误'
    }
  }
}

// 获取作品列表
async function getWorks(data, wxContext) {
  const { page = 1, pageSize = 10, userId } = data
  
  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在，请先登录')
  }

  const skip = (page - 1) * pageSize
  
  // 获取用户的作品
  const worksQuery = await db.collection('works')
    .where({
      userId: user._id,
      status: 'completed' // 只返回成功生成的作品
    })
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  // 获取总数
  const countResult = await db.collection('works')
    .where({
      userId: user._id,
      status: 'completed'
    })
    .count()

  const list = worksQuery.data.map(work => ({
    workId: work.id,
    title: work.title,
    imageUrl: work.imageUrl,
    prompt: work.originalPrompt || work.prompt,
    style: work.style,
    status: work.status,
    createdAt: work.createdAt
  }))

  return {
    code: 200,
    data: {
      list,
      pagination: {
        page,
        pageSize,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
  }
}

// 获取单个作品详情
async function getWork(data, wxContext) {
  const { workId, userId } = data
  
  if (!workId) {
    throw new Error('作品ID不能为空')
  }

  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在，请先登录')
  }

  // 查找作品
  const workQuery = await db.collection('works').where({
    id: workId,
    userId: user._id
  }).get()

  if (workQuery.data.length === 0) {
    throw new Error('作品不存在或无权限访问')
  }

  const work = workQuery.data[0]

  return {
    code: 200,
    data: {
      workId: work.id,
      title: work.title,
      imageUrl: work.imageUrl,
      prompt: work.prompt,
      originalPrompt: work.originalPrompt,
      character: work.character,
      style: work.style,
      emotion: work.emotion,
      mode: work.mode,
      enhancedPrompt: work.enhancedPrompt,
      status: work.status,
      createdAt: work.createdAt
    }
  }
}

// 保存作品（收藏/取消收藏）
async function saveWork(data, wxContext) {
  const { workId, isFavorite, userId } = data
  
  if (!workId) {
    throw new Error('作品ID不能为空')
  }

  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在，请先登录')
  }

  // 查找作品
  const workQuery = await db.collection('works').where({
    id: workId,
    userId: user._id
  }).get()

  if (workQuery.data.length === 0) {
    throw new Error('作品不存在或无权限访问')
  }

  const work = workQuery.data[0]

  // 更新收藏状态
  await db.collection('works').doc(work._id).update({
    data: {
      isFavorite: isFavorite,
      updatedAt: new Date()
    }
  })

  return {
    code: 200,
    message: isFavorite ? '作品已收藏' : '已取消收藏',
    data: {
      workId: work.id,
      isFavorite: isFavorite
    }
  }
}

// 删除作品
async function deleteWork(data, wxContext) {
  const { workId, userId } = data
  
  if (!workId) {
    throw new Error('作品ID不能为空')
  }

  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在，请先登录')
  }

  // 查找作品
  const workQuery = await db.collection('works').where({
    id: workId,
    userId: user._id
  }).get()

  if (workQuery.data.length === 0) {
    throw new Error('作品不存在或无权限删除')
  }

  const work = workQuery.data[0]

  // 软删除：标记为已删除状态
  await db.collection('works').doc(work._id).update({
    data: {
      status: 'deleted',
      deletedAt: new Date()
    }
  })

  return {
    code: 200,
    message: '作品删除成功',
    data: {
      workId: work.id
    }
  }
}

// 更新作品信息
async function updateWork(data, wxContext) {
  const { workId, title, userId } = data
  
  if (!workId) {
    throw new Error('作品ID不能为空')
  }

  let user
  if (userId) {
    const userQuery = await db.collection('users').doc(userId).get()
    user = userQuery.data
  } else if (wxContext.OPENID) {
    const userQuery = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    user = userQuery.data[0]
  }

  if (!user) {
    throw new Error('用户不存在，请先登录')
  }

  // 查找作品
  const workQuery = await db.collection('works').where({
    id: workId,
    userId: user._id
  }).get()

  if (workQuery.data.length === 0) {
    throw new Error('作品不存在或无权限修改')
  }

  const work = workQuery.data[0]
  const updateData = {}
  
  if (title !== undefined) {
    updateData.title = title
  }
  updateData.updatedAt = new Date()

  // 更新作品信息
  await db.collection('works').doc(work._id).update({
    data: updateData
  })

  return {
    code: 200,
    message: '作品信息更新成功',
    data: {
      workId: work.id,
      updated: Object.keys(updateData)
    }
  }
} 