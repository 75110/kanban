import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

// 看板API
export const dashboardApi = {
  // 获取统计数据
  getStats(params) {
    return api.get('/dashboard/stats', { params })
  },
  
  // 获取工龄分布
  getWorkAgeDistribution(params) {
    return api.get('/dashboard/work-age-distribution', { params })
  },
  
  // 获取学历分布
  getEducationDistribution(params) {
    return api.get('/dashboard/education-distribution', { params })
  },
  
  // 获取部门统计
  getDepartmentStats(params) {
    return api.get('/dashboard/department-stats', { params })
  },
  
  // 获取筛选选项
  getFilterOptions() {
    return api.get('/dashboard/filter-options')
  }
}

// 员工API
export const employeeApi = {
  // 获取员工花名册
  getRoster(params) {
    return api.get('/employee/roster', { params })
  },
  
  // 获取离职监控数据
  getResignation(params) {
    return api.get('/employee/resignation', { params })
  },
  
  // 获取人员异动数据
  getChanges(params) {
    return api.get('/employee/changes', { params })
  }
}

export default api
