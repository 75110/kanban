import { defineStore } from "pinia";
import { dashboardApi } from "../api";
import { getDepartmentDict, getRegionDict } from "../api/common";

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    // 筛选条件
    filters: {
      organizationRegion: "",
      region: "",
      department: "",
      year: "", // 默认不选择年份，显示所有数据
      month: "",
    },

    // 图表联动筛选
    chartFilters: {
      workAge: "", // 司龄筛选
      education: "", // 学历筛选
      department: "", // 部门筛选（来自图表点击）
    },

    // 人才流失分析图表筛选
    turnoverChartFilters: {
      department: "", // 离职部门筛选
      reason: "", // 离职原因筛选
      position: "", // 离职岗位筛选
      tenure: "", // 在职时间筛选
    },

    // 筛选选项
    filterOptions: {
      organizationRegions: [],
      regions: [],
      departments: [],
      years: [],
    },

    // 统计数据
    stats: {
      totalEmployees: 0,
      newEmployees: 0,
      resignedEmployees: 0,
      transferEmployees: 0,
      growth: {
        monthOverMonth: null,
        yearOverYear: null,
      },
    },

    // 分布数据
    workAgeDistribution: {},
    educationDistribution: {},
    departmentStats: [],

    // 加载状态
    loading: {
      stats: false,
      workAge: false,
      education: false,
      department: false,
      filterOptions: false,
    },
  }),

  getters: {
    // 获取当前筛选参数
    currentFilters(state) {
      const filters = { ...state.filters };

      // 合并图表筛选
      if (state.chartFilters.workAge) {
        filters.workAge = state.chartFilters.workAge;
      }
      if (state.chartFilters.education) {
        filters.education = state.chartFilters.education;
      }
      if (state.chartFilters.department) {
        filters.department = state.chartFilters.department;
      }

      // 移除空值
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) {
          delete filters[key];
        }
      });
      return filters;
    },

    // 工龄分布图表数据
    workAgeChartData(state) {
      const data = state.workAgeDistribution;
      return {
        labels: Object.keys(data),
        values: Object.values(data),
      };
    },

    // 学历分布图表数据
    educationChartData(state) {
      const data = state.educationDistribution;
      return {
        labels: Object.keys(data),
        values: Object.values(data),
      };
    },

    // 部门统计图表数据
    departmentChartData(state) {
      const data = state.departmentStats;
      return {
        labels: Object.keys(data),
        values: Object.values(data),
      };
    },
  },

  actions: {
    // 设置筛选条件
    setFilter(key, value) {
      this.filters[key] = value;
      // 当改变上级筛选条件时，清空下级条件
      if (key === "organizationRegion") {
        this.filters.region = "";
        this.filters.department = "";
      } else if (key === "region") {
        this.filters.department = "";
      }
    },

    // 重置筛选条件
    resetFilters() {
      this.filters = {
        organizationRegion: "",
        region: "",
        department: "",
        year: new Date().getFullYear(),
        month: "",
      };
    },

    // 获取筛选选项
    async fetchFilterOptions() {
      this.loading.filterOptions = true;
      try {
        // 使用新的filter-options API获取所有筛选选项
        const filterOptions = await dashboardApi.getFilterOptions();
        this.filterOptions = {
          organizationRegions: filterOptions.organizationRegions || [],
          regions: filterOptions.regions || [],
          departments: filterOptions.departments || [],
          years: filterOptions.years || []
        };
      } catch (error) {
        console.error("获取筛选选项失败:", error);
        // 如果新API失败，尝试使用旧的字典API作为备用
        try {
          const departmentDict = await getDepartmentDict();
          const regionDict = await getRegionDict();
          this.filterOptions = {
            organizationRegions: [],
            regions: regionDict,
            departments: departmentDict,
            years: [] // 年份数据无法从字典API获取
          };
        } catch (fallbackError) {
          console.error("备用筛选选项获取也失败:", fallbackError);
        }
      } finally {
        this.loading.filterOptions = false;
      }
    },

    // 获取统计数据
    async fetchStats() {
      this.loading.stats = true;
      try {
        const data = await dashboardApi.getStats(this.currentFilters);
        // 只有成功获取数据后才更新，避免闪烁
        if (data) {
          // 确保增长数据结构完整
          if (!data.growth) {
            data.growth = {
              monthOverMonth: null,
              yearOverYear: null
            };
          }
          this.stats = data;
        }
      } catch (error) {
        console.error("获取统计数据失败:", error);
        // API失败时，确保stats有基本结构，避免undefined错误
        if (!this.stats.growth) {
          this.stats.growth = {
            monthOverMonth: null,
            yearOverYear: null
          };
        }
      } finally {
        this.loading.stats = false;
      }
    },

    // 获取工龄分布
    async fetchWorkAgeDistribution() {
      this.loading.workAge = true;
      try {
        const data = await dashboardApi.getWorkAgeDistribution(
          this.currentFilters
        );
        if (data) {
          this.workAgeDistribution = data;
        }
      } catch (error) {
        console.error("获取工龄分布失败:", error);
      } finally {
        this.loading.workAge = false;
      }
    },

    // 获取学历分布
    async fetchEducationDistribution() {
      this.loading.education = true;
      try {
        const data = await dashboardApi.getEducationDistribution(
          this.currentFilters
        );
        if (data) {
          this.educationDistribution = data;
        }
      } catch (error) {
        console.error("获取学历分布失败:", error);
      } finally {
        this.loading.education = false;
      }
    },

    // 获取部门统计
    async fetchDepartmentStats() {
      this.loading.department = true;
      try {
        const data = await dashboardApi.getDepartmentStats(this.currentFilters);
        if (data) {
          this.departmentStats = data;
        }
      } catch (error) {
        console.error("获取部门统计失败:", error);
      } finally {
        this.loading.department = false;
      }
    },

    // 刷新所有数据
    async refreshAll() {
      await Promise.all([
        this.fetchStats(),
        this.fetchWorkAgeDistribution(),
        this.fetchEducationDistribution(),
        this.fetchDepartmentStats(),
      ]);
    },

    // 设置图表筛选
    setChartFilter(type, value) {
      // 清除其他图表筛选，只保留当前点击的
      this.chartFilters = {
        workAge: "",
        education: "",
        department: "",
      };

      // 设置当前筛选
      if (this.chartFilters.hasOwnProperty(type)) {
        this.chartFilters[type] = value;
      }

      // 刷新所有数据
      this.refreshAll();
    },

    // 清除图表筛选
    clearChartFilters() {
      this.chartFilters = {
        workAge: "",
        education: "",
        department: "",
      };
      this.refreshAll();
    },

    // 设置人才流失分析图表筛选
    setTurnoverChartFilter(type, value) {
      // 清除其他人才流失图表筛选，只保留当前点击的
      this.turnoverChartFilters = {
        department: "",
        reason: "",
        position: "",
        tenure: "",
      };

      // 设置当前筛选
      if (this.turnoverChartFilters.hasOwnProperty(type)) {
        this.turnoverChartFilters[type] = value;
      }

      // 这里可以触发人才流失数据的刷新
      // 由于人才流失数据在Dashboard组件中管理，这里只设置筛选状态
    },

    // 清除人才流失分析图表筛选
    clearTurnoverChartFilters() {
      this.turnoverChartFilters = {
        department: "",
        reason: "",
        position: "",
        tenure: "",
      };
    },

    // 页面切换时的筛选状态管理
    handlePageSwitch(fromPage, toPage) {
      // 清除图表筛选
      this.clearChartFilters()

      // 如果从人才流失页面切换出去，清除人才流失筛选
      if (fromPage === 'turnover') {
        this.clearTurnoverChartFilters()
      }

      // 可以根据需要添加更多页面切换逻辑
    },

    // 清除所有筛选（包括顶部筛选器和图表筛选）
    clearAllFilters() {
      this.resetFilters()
      this.clearChartFilters()
      this.clearTurnoverChartFilters()
    },
  },
});
