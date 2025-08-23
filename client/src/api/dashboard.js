import { api } from "./index";

/**
 * 获取看板数据
 *
 * @param {number} regionId 区域ID
 * @param {number} departmentId 部门ID
 * @param {string} minEntryDate 入职时间范围起始时间
 * @param {string} maxEntryDate 入职时间范围结束时间
 *
 * @returns {Promise<Object>}
 */
export function dashboardStatistics(
  regionId,
  departmentId,
  minEntryDate,
  maxEntryDate
) {
  api.post("/dashBoard", {
    employeePositionInfoes: {
      regionId,
      departmentId,
      minEntryDate,
      maxEntryDate,
    },
  });
}
