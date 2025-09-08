import { api } from './index'

// 户籍地分析相关API
export const householdMapApi = {
  // 获取省级户籍地分布数据
  getProvinceDistribution(params = {}) {
    return api.get('/household-map/province-distribution', { params })
  },

  // 获取市级户籍地分布数据
  getCityDistribution(province, params = {}) {
    return api.get(`/household-map/city-distribution/${province}`, { params })
  }
}