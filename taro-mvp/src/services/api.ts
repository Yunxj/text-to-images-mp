import Taro from '@tarojs/taro'

// API基础配置
// ✅ 已配置为实际的Vercel部署地址: https://text-to-images-mp-rotv.vercel.app
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api'
  : 'https://text-to-images-mp-fvep.vercel.app/api'

// 请求拦截器
const request = (options: any) => {
  return Taro.request({
    url: `${API_BASE_URL}${options.url}`,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      // 可以在这里添加token等认证信息
      ...(options.header || {})
    }
  }).then(response => {
    const { data } = response
    
    // 统一处理响应
    if (data.code === 200) {
      return data.data
    } else {
      throw new Error(data.message || '请求失败')
    }
  }).catch(error => {
    console.error('API请求错误:', error)
    throw error
  })
}

// API接口定义
export const aiApi = {
  // 生成图片
  generateImage: (params: {
    prompt: string
    character?: string
    style?: string
  }) => {
    return request({
      url: '/ai/generate',
      method: 'POST',
      data: params
    })
  },
  
  // 获取生成历史
  getGenerateHistory: (params?: {
    page?: number
    pageSize?: number
  }) => {
    return request({
      url: '/ai/history',
      method: 'GET',
      data: params
    })
  }
}

export const userApi = {
  // 用户登录
  login: (params: {
    code: string // 微信登录code
  }) => {
    return request({
      url: '/user/login',
      method: 'POST',
      data: params
    })
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return request({
      url: '/user/profile',
      method: 'GET'
    })
  },
  
  // 更新用户信息
  updateUserInfo: (params: {
    nickname?: string
    avatar?: string
  }) => {
    return request({
      url: '/user/profile',
      method: 'PUT',
      data: params
    })
  }
}

export const workApi = {
  // 获取作品列表
  getWorks: (params?: {
    page?: number
    pageSize?: number
  }) => {
    return request({
      url: '/works',
      method: 'GET',
      data: params
    })
  },
  
  // 保存作品
  saveWork: (params: {
    imageUrl: string
    prompt: string
    character?: string
    metadata?: any
  }) => {
    return request({
      url: '/works',
      method: 'POST',
      data: params
    })
  },
  
  // 删除作品
  deleteWork: (workId: string) => {
    return request({
      url: `/works/${workId}`,
      method: 'DELETE'
    })
  }
}

// 上传相关API
export const uploadApi = {
  // 上传图片到云存储
  uploadImage: async (filePath: string) => {
    // 这里可以集成腾讯云COS、阿里云OSS等
    return new Promise((resolve, reject) => {
      Taro.uploadFile({
        url: `${API_BASE_URL}/upload/image`,
        filePath,
        name: 'file',
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              resolve(data.data)
            } else {
              reject(new Error(data.message))
            }
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
    })
  }
}

export default {
  aiApi,
  userApi,
  workApi,
  uploadApi
} 