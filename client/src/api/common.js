import { api } from "./index";

/**
 * 获取区域字典
 *
 * @param {number} regionId 区域ID
 * @param {string} regionName 区域名称
 *
 * @returns {Promise<[{id: number, region: string}]>} 区域字典
 */
export function getRegionDict(regionId, regionName) {
  return api.post("/sysRegion/list", { id: regionId, region: regionName });
}

/**
 * 获取岗位字典
 *
 * @param {number} positionId 岗位ID
 * @param {string} positionName 岗位名称
 *
 * @returns {Promise<[{id: number, region: string}]>} 岗位字典
 */
export function getPositionDict(positionId, positionName) {
  return api.post("/sysPosition/list", {
    id: positionId,
    position: positionName,
  });
}

/**
 * 获取部门字典
 *
 * @param {number} departmentId 部门ID
 * @param {string} departmentName 部门名称
 *
 * @returns {Promise<[{id: number, region: string}]>} 部门字典
 */
export function getDepartmentDict(departmentId, departmentName) {
  return api.post("/sysDepartment/list", {
    id: departmentId,
    department: departmentName,
  });
}
