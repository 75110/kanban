<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">人事数据看板</h1>
      <div class="page-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 筛选器 -->
    <FilterBar
      v-model:filters="dashboardStore.filters"
      :filter-options="dashboardStore.filterOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 统计卡片 - 简洁布局 -->
    <div class="dashboard-layout">
      <!-- 主要指标卡片 -->
      <div class="stats-grid" :class="{ 'loading': isRefreshing }">
        <div class="stat-card">
          <div class="stat-number">{{ dashboardStore.stats.totalEmployees || 0 }}</div>
          <div class="stat-title">在职人数</div>
          <div class="stat-trend positive">环比 +1.5%</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ dashboardStore.stats.resignedEmployees || 0 }}</div>
          <div class="stat-title">离职人数</div>
          <div class="stat-trend negative">环比 -10.59%</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ dashboardStore.stats.newEmployees || 0 }}</div>
          <div class="stat-title">入职人数</div>
          <div class="stat-trend positive">环比 +1.5%</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ dashboardStore.stats.transferEmployees || 0 }}</div>
          <div class="stat-title">异动人数</div>
          <div class="stat-trend negative">环比 -68.96%</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ (dashboardStore.stats.transferEmployees / Math.max(dashboardStore.stats.totalEmployees, 1) * 100).toFixed(2) }}%</div>
          <div class="stat-title">综合异动率</div>
          <div class="stat-trend negative">环比 -68.96%</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ (dashboardStore.stats.newEmployees / Math.max(dashboardStore.stats.totalEmployees, 1) * 100).toFixed(2) }}%</div>
          <div class="stat-title">新进率</div>
          <div class="stat-trend positive">环比 +0.69%</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ (dashboardStore.stats.resignedEmployees / Math.max(dashboardStore.stats.totalEmployees + dashboardStore.stats.resignedEmployees, 1) * 100).toFixed(2) }}%</div>
          <div class="stat-title">离职率</div>
          <div class="stat-trend negative">环比 -55.56%</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 - 新布局 -->
    <div class="charts-layout">
      <!-- 第一行：3个图表 -->
      <div class="charts-main-row">
        <ChartCard
          title="司龄分布情况"
          type="pie"
          :data="dashboardStore.workAgeChartData"
          :loading="dashboardStore.loading.workAge"
        />
        <ChartCard
          title="学历分布"
          type="pie"
          pie-style="solid"
          :data="dashboardStore.educationChartData"
          :loading="dashboardStore.loading.education"
        />
        <ChartCard
          title="各部门员异动"
          type="bar"
          :data="dashboardStore.departmentChartData"
          :loading="dashboardStore.loading.department"
        />
      </div>

      <!-- 第二行：各部门在职人数详细图表 -->
      <div class="charts-detail-row">
        <ChartCard
          title="各部门在职人数"
          type="bar"
          :data="dashboardStore.departmentChartData"
          :loading="dashboardStore.loading.department"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, watch, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, User, UserFilled, Plus, Switch, DataAnalysis, TrendCharts } from '@element-plus/icons-vue'
import { useDashboardStore } from '../stores/dashboard'
import FilterBar from '../components/FilterBar.vue'
import StatCard from '../components/StatCard.vue'
import ChartCard from '../components/ChartCard.vue'

const dashboardStore = useDashboardStore()

// 刷新状态
const isRefreshing = ref(false)

// 计算异动率
const calculateChangeRate = () => {
  const total = dashboardStore.stats.totalEmployees
  const changes = dashboardStore.stats.transferEmployees
  if (total === 0) return 0
  return parseFloat((changes / total * 100).toFixed(2))
}

// 计算新进率
const calculateNewEmployeeRate = () => {
  const total = dashboardStore.stats.totalEmployees
  const newEmployees = dashboardStore.stats.newEmployees
  if (total === 0) return 0
  return parseFloat((newEmployees / total * 100).toFixed(2))
}

// 计算离职率
const calculateResignationRate = () => {
  const total = dashboardStore.stats.totalEmployees + dashboardStore.stats.resignedEmployees
  const resigned = dashboardStore.stats.resignedEmployees
  if (total === 0) return 0
  return parseFloat((resigned / total * 100).toFixed(2))
}

// 获取增长率数值
const getGrowthValue = (key) => {
  const growth = dashboardStore.stats.growth
  const growthType = getGrowthType()
  
  if (growthType === 'month' && growth.monthOverMonth) {
    return parseFloat(growth.monthOverMonth[key]) || null
  } else if (growthType === 'year' && growth.yearOverYear) {
    return parseFloat(growth.yearOverYear[key]) || null
  }
  return null
}

// 获取增长率类型
const getGrowthType = () => {
  return dashboardStore.filters.month ? 'month' : 'year'
}

// 处理搜索
const handleSearch = async () => {
  try {
    await dashboardStore.refreshAll()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

// 处理重置
const handleReset = async () => {
  dashboardStore.resetFilters()
  await handleSearch()
}

// 刷新数据
const refreshData = async () => {
  try {
    await dashboardStore.refreshAll()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

// 防抖定时器
let debounceTimer = null

// 监听筛选条件变化，自动刷新数据
watch(
  () => dashboardStore.filters,
  async (newFilters, oldFilters) => {
    // 避免初始化时触发
    if (oldFilters) {
      // 清除之前的定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // 设置防抖，100ms后执行，快速响应
      debounceTimer = setTimeout(async () => {
        try {
          isRefreshing.value = true
          await dashboardStore.refreshAll()
        } catch (error) {
          console.error('自动刷新数据失败:', error)
        } finally {
          // 延迟一点时间再移除loading状态，让过渡更平滑
          setTimeout(() => {
            isRefreshing.value = false
          }, 100)
        }
      }, 100)
    }
  },
  { deep: true }
)

// 组件挂载时初始化数据
onMounted(async () => {
  try {
    await dashboardStore.fetchFilterOptions()
    await dashboardStore.refreshAll()
  } catch (error) {
    ElMessage.error('初始化数据失败')
  }
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* 新的仪表板布局样式 */
.dashboard-layout {
  margin-bottom: 24px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  position: relative;
  transition: opacity 0.3s ease;
}

.stats-grid.loading {
  opacity: 0.6;
  pointer-events: none;
}

.stat-card {
  background: white;
  border: 1px solid #e6e8eb;
  border-radius: 12px;
  padding: 24px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
  border-color: #d9d9d9;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
  margin-bottom: 8px;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
  line-height: 1.4;
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.stat-trend.positive {
  color: #52c41a;
  background: #f6ffed;
}

.stat-trend.negative {
  color: #ff4d4f;
  background: #fff2f0;
}



/* 图表布局 */
.charts-layout {
  margin-bottom: 32px;
}

.charts-main-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.charts-main-row > * {
  height: 500px;
}



.charts-detail-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.charts-detail-row > * {
  height: 500px;
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .main-stats-row {
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
  }
}

@media (max-width: 1400px) {
  .main-stats-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .charts-main-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .secondary-stats-row {
    max-width: 700px;
  }
}

@media (max-width: 1200px) {
  .main-stats-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .secondary-stats-row {
    grid-template-columns: repeat(2, 1fr);
    max-width: 500px;
  }

  .main-stat-card {
    padding: 20px 12px;
    min-height: 110px;
  }

  .stat-number {
    font-size: 28px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .main-stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .secondary-stats-row {
    grid-template-columns: 1fr;
    max-width: 100%;
  }

  .charts-main-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .main-stat-card {
    padding: 16px 12px;
    min-height: 100px;
  }

  .secondary-stat-card {
    padding: 16px 12px;
    min-height: 90px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
  }

  .stat-number {
    font-size: 24px;
  }

  .stat-title {
    font-size: 13px;
  }

  .page-title {
    font-size: 20px;
  }

  .charts-main-row > * {
    height: 400px;
  }

  .charts-detail-row > * {
    height: 400px;
  }
}
</style>
