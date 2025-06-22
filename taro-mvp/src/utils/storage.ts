import Taro from '@tarojs/taro'

// 存储键名常量
export const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  USER_TOKEN: 'userToken',
  GENERATE_HISTORY: 'generateHistory',
  SETTINGS: 'settings'
}

// 本地存储工具类
export class Storage {
  /**
   * 设置存储
   */
  static set(key: string, value: any): Promise<void> {
    try {
      const data = JSON.stringify(value)
      return Taro.setStorage({
        key,
        data
      })
    } catch (error) {
      console.error('存储数据失败:', error)
      return Promise.reject(error)
    }
  }

  /**
   * 获取存储
   */
  static get<T = any>(key: string): Promise<T | null> {
    return Taro.getStorage({ key })
      .then(res => {
        try {
          return JSON.parse(res.data)
        } catch (error) {
          return res.data
        }
      })
      .catch(() => null)
  }

  /**
   * 同步获取存储
   */
  static getSync<T = any>(key: string): T | null {
    try {
      const data = Taro.getStorageSync(key)
      if (!data) return null
      
      try {
        return JSON.parse(data)
      } catch (error) {
        return data
      }
    } catch (error) {
      console.error('获取存储数据失败:', error)
      return null
    }
  }

  /**
   * 移除存储
   */
  static remove(key: string): Promise<void> {
    return Taro.removeStorage({ key })
  }

  /**
   * 清空所有存储
   */
  static clear(): Promise<void> {
    return Taro.clearStorage()
  }

  /**
   * 获取存储信息
   */
  static getInfo(): Promise<any> {
    return Taro.getStorageInfo()
  }
}

// 用户相关存储
export class UserStorage {
  /**
   * 保存用户信息
   */
  static setUserInfo(userInfo: any): Promise<void> {
    return Storage.set(STORAGE_KEYS.USER_INFO, userInfo)
  }

  /**
   * 获取用户信息
   */
  static getUserInfo(): Promise<any> {
    return Storage.get(STORAGE_KEYS.USER_INFO)
  }

  /**
   * 保存用户token
   */
  static setToken(token: string): Promise<void> {
    return Storage.set(STORAGE_KEYS.USER_TOKEN, token)
  }

  /**
   * 获取用户token
   */
  static getToken(): Promise<string | null> {
    return Storage.get(STORAGE_KEYS.USER_TOKEN)
  }

  /**
   * 清除用户数据
   */
  static clearUserData(): Promise<void[]> {
    return Promise.all([
      Storage.remove(STORAGE_KEYS.USER_INFO),
      Storage.remove(STORAGE_KEYS.USER_TOKEN)
    ])
  }
}

// 设置相关存储
export class SettingsStorage {
  /**
   * 保存设置
   */
  static setSettings(settings: any): Promise<void> {
    return Storage.set(STORAGE_KEYS.SETTINGS, settings)
  }

  /**
   * 获取设置
   */
  static getSettings(): Promise<any> {
    return Storage.get(STORAGE_KEYS.SETTINGS)
  }

  /**
   * 获取默认设置
   */
  static getDefaultSettings() {
    return {
      theme: 'light',
      language: 'zh-CN',
      enableNotification: true,
      autoSave: true,
      imageQuality: 'high'
    }
  }
}

export default Storage 