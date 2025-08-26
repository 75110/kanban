import axios from "axios";

// 创建axios实例
export const api = axios.create({
  baseURL: "/api",
  timeout: 15000, // 减少到15秒，优化用户体验
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 如果是网络错误或超时，且没有重试过，则重试
    if (
      (error.code === "ECONNABORTED" ||
        error.code === "ENOBUFS" ||
        error.code === "EADDRINUSE") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log("网络错误，正在重试...", error.message);

      // 等待1秒后重试
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return api(originalRequest);
    }

    console.error("API请求错误:", error.message);
    return Promise.reject(error);
  }
);

// 看板API
export const dashboardApi = {
  // 获取统计数据
  getStats(params) {
    return api.get("/dashboard/stats", { params });
  },

  // 获取工龄分布
  getWorkAgeDistribution(params) {
    return api.get("/dashboard/work-age-distribution", { params });
  },

  // 获取学历分布
  getEducationDistribution(params) {
    return api.get("/dashboard/education-distribution", { params });
  },

  // 获取部门统计
  getDepartmentStats(params) {
    return api.get("/dashboard/department-stats", { params });
  },

  // 获取筛选选项
  getFilterOptions() {
    return api.get("/dashboard/filter-options");
  },

  // 人才流失分析API
  // 获取人才流失统计数据
  getTurnoverStats(params) {
    return api.get("/dashboard/turnover-stats", { params });
  },

  // 获取离职部门分布
  getTurnoverDepartmentDistribution(params) {
    return api.get("/dashboard/turnover-department-distribution", { params });
  },

  // 获取离职原因分析
  getTurnoverReasonAnalysis(params) {
    return api.get("/dashboard/turnover-reason-analysis", { params });
  },

  // 获取离职人员部门统计
  getTurnoverDepartmentStats(params) {
    return api.get("/dashboard/turnover-department-stats", { params });
  },

  // 获取离职岗位分布
  getTurnoverPositionDistribution(params) {
    return api.get("/dashboard/turnover-position-distribution", { params });
  },

  // 获取离职人员在职时间分布
  getTurnoverTenureDistribution(params) {
    return api.get("/dashboard/turnover-tenure-distribution", { params });
  },

  // 获取各部门人员异动统计
  getDepartmentTransferStats(params) {
    return api.get("/dashboard/department-transfer-stats", { params });
  },
};

// 员工API
export const employeeApi = {
  // 新增员工
  postRoster(params) {
    return api.post("/employee/roster", params);
  },

  // 获取员工花名册
  getRoster(params) {
    return api.get("/employee/roster", { params });
  },

  // 更新员工信息
  updateRoster(id, params) {
    return api.put(`/employee/roster/${id}`, params);
  },

  // 导出员工花名册
  exportRoster(params) {
    return api.get("/employee/roster/export", { params });
  },

  // 获取离职监控数据
  getResignation(params) {
    return api.get("/employee/resignation", { params });
  },

  // 员工离职操作
  postResignation(params) {
    return api.post("/employee/resignation", params);
  },

  // 获取人员异动数据
  getChanges(params) {
    return api.get("/employee/changes", { params });
  },

  // 员工调动操作
  postTransfer(params) {
    return api.post("/employee/transfer", params);
  },

  // 删除离职记录
  deleteResignation(id) {
    return api.delete(`/employee/resignation/${id}`);
  },

  // 删除异动记录（使用组合键）
  deleteChange(changeData) {
    return api.delete(`/employee/changes`, { data: changeData });
  },

  // 更新离职记录
  updateResignation(id, params) {
    return api.put(`/employee/resignation/${id}`, params);
  },

  // 更新异动记录
  updatePersonnelChange(updateKey, params) {
    return api.put(`/employee/changes`, { updateKey, ...params });
  },

  // 导出离职监控数据
  exportResignation(params) {
    return api.get("/employee/resignation/export", { params });
  },

  // 导出人员异动数据
  exportChanges(params) {
    return api.get("/employee/changes/export", { params });
  },
};

export const commonApi = {
  getCommonData() {
    return api.get("/common", {});
  },
};

export default api;
