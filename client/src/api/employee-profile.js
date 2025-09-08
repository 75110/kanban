import { api } from './index.js';

// 获取员工档案信息
export function getEmployeeProfile(name) {
  return api.get(`/employee-profile/${encodeURIComponent(name)}`);
}

// 获取员工列表（用于搜索）
export function getEmployeeList() {
  return api.get('/employee-profile/search/list');
}

// 获取统计数据（用于侧边栏）
export function getEmployeeStats() {
  return api.get('/employee-profile/stats/overview');
}
