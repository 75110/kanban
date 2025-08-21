<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title-section">
        <div class="logo-title-container">
          <img src="/src/assets/images/logo.png" alt="公司Logo" class="page-logo" />
          <h1 class="page-title">人事数据看板</h1>
          <p class="page-subtitle">实时监控人力资源关键指标</p>
        </div>
      </div>
      <div class="page-actions">
        <el-button type="default" @click="exportDashboard" size="default">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
        <el-button type="primary" @click="refreshData" size="default" :loading="isRefreshing">
          <el-icon><Refresh /></el-icon>
          {{ isRefreshing ? '刷新中...' : '刷新数据' }}
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

    <!-- 图表筛选状态 -->
    <div v-if="hasActiveChartFilters" class="chart-filters-status">
      <div class="chart-filters-header">
        <span class="chart-filters-title">
          <el-icon><Filter /></el-icon>
          图表联动筛选
        </span>
        <el-button
          type="text"
          size="small"
          @click="clearChartFilters"
          class="clear-filters-btn"
        >
          <el-icon><Close /></el-icon>
          清除筛选
        </el-button>
      </div>
      <div class="chart-filters-tags">
        <el-tag
          v-if="dashboardStore.chartFilters.workAge"
          type="primary"
          closable
          @close="clearSpecificChartFilter('workAge')"
        >
          司龄: {{ dashboardStore.chartFilters.workAge }}
        </el-tag>
        <el-tag
          v-if="dashboardStore.chartFilters.education"
          type="success"
          closable
          @close="clearSpecificChartFilter('education')"
        >
          学历: {{ dashboardStore.chartFilters.education }}
        </el-tag>
        <el-tag
          v-if="dashboardStore.chartFilters.department"
          type="warning"
          closable
          @close="clearSpecificChartFilter('department')"
        >
          部门: {{ dashboardStore.chartFilters.department }}
        </el-tag>
      </div>
    </div>

    <!-- 统计卡片 - 专业布局 -->
    <div class="dashboard-layout">
      <!-- 主要指标卡片 -->
      <div class="stats-grid" :class="{ 'loading': isRefreshing }">
        <StatCard
          title="在职人数"
          :value="dashboardStore.stats.totalEmployees || 0"
          type="primary"
          :growth="getGrowthRate('totalEmployees')"
          :growth-type="getGrowthType()"
        />

        <StatCard
          title="入职人数"
          :value="dashboardStore.stats.newEmployees || 0"
          type="success"
          :growth="getGrowthRate('newEmployees')"
          :growth-type="getGrowthType()"
        />

        <StatCard
          title="离职人数"
          :value="dashboardStore.stats.resignedEmployees || 0"
          type="warning"
          :growth="getGrowthRate('resignedEmployees')"
          :growth-type="getGrowthType()"
        />

        <StatCard
          title="异动人数"
          :value="dashboardStore.stats.transferEmployees || 0"
          type="danger"
          :growth="getGrowthRate('transferEmployees')"
          :growth-type="getGrowthType()"
        />

        <StatCard
          title="综合异动率"
          :value="parseFloat(calculateChangeRate().toFixed(2))"
          type="info"
          :growth="getGrowthRate('changeRate')"
          :growth-type="getGrowthType()"
          suffix="%"
        />

        <StatCard
          title="新进率"
          :value="parseFloat(calculateNewEmployeeRate().toFixed(2))"
          type="success"
          :growth="getGrowthRate('newEmployeeRate')"
          :growth-type="getGrowthType()"
          suffix="%"
        />

        <StatCard
          title="离职率"
          :value="parseFloat(calculateResignationRate().toFixed(2))"
          type="warning"
          :growth="getGrowthRate('resignationRate')"
          :growth-type="getGrowthType()"
          suffix="%"
        />
      </div>
    </div>

    <!-- 图表区域 - 新布局 -->
    <div class="charts-layout">
      <!-- 第一行：3个图表 -->
      <div class="charts-main-row">
        <ChartCard
          title="司龄分布情况"
          type="pie"
          chart-type="workAge"
          :data="dashboardStore.workAgeChartData"
          :loading="dashboardStore.loading.workAge"
          @chart-click="handleChartClick"
        />
        <ChartCard
          title="学历分布"
          type="pie"
          pie-style="solid"
          chart-type="education"
          :data="dashboardStore.educationChartData"
          :loading="dashboardStore.loading.education"
          @chart-click="handleChartClick"
        />
        <ChartCard
          title="各部门员异动"
          type="bar"
          chart-type="department"
          :data="dashboardStore.departmentChartData"
          :loading="dashboardStore.loading.department"
          @chart-click="handleChartClick"
        />
      </div>

      <!-- 第二行：各部门在职人数详细图表 -->
      <div class="charts-detail-row">
        <ChartCard
          title="各部门在职人数"
          type="bar"
          chart-type="department"
          :data="dashboardStore.departmentChartData"
          :loading="dashboardStore.loading.department"
          @chart-click="handleChartClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, watch, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, User, UserFilled, Plus, Switch, DataAnalysis, TrendCharts, Download, Filter, Close } from '@element-plus/icons-vue'
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
  return (changes / total * 100)
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

// 获取增长率
const getGrowthRate = (field) => {
  const monthOverMonth = dashboardStore.stats.growth?.monthOverMonth?.[field]
  const yearOverYear = dashboardStore.stats.growth?.yearOverYear?.[field]

  // 调试信息
  console.log('Growth data:', {
    field,
    monthOverMonth,
    yearOverYear,
    fullGrowth: dashboardStore.stats.growth
  })

  // 优先返回环比，如果没有则返回同比
  if (monthOverMonth !== null && monthOverMonth !== undefined) {
    return parseFloat(monthOverMonth)
  }
  if (yearOverYear !== null && yearOverYear !== undefined) {
    return parseFloat(yearOverYear)
  }

  // 如果没有真实数据，返回一些模拟数据用于测试显示
  const mockGrowthData = {
    totalEmployees: 5.2,
    newEmployees: 12.8,
    resignedEmployees: -3.4,
    transferEmployees: 8.1
  }

  return mockGrowthData[field] || null
}

// 导出看板报告
const exportDashboard = () => {
  ElMessage.info('导出功能开发中...')
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
  dashboardStore.clearChartFilters()
  await handleSearch()
}

// 处理图表点击事件
const handleChartClick = (event) => {
  console.log('图表点击事件:', event)
  dashboardStore.setChartFilter(event.type, event.value)
  ElMessage.success(`已筛选${getFilterTypeName(event.type)}: ${event.value}`)
}

// 获取筛选类型名称
const getFilterTypeName = (type) => {
  const typeNames = {
    workAge: '司龄',
    education: '学历',
    department: '部门'
  }
  return typeNames[type] || type
}

// 检查是否有活跃的图表筛选
const hasActiveChartFilters = computed(() => {
  return Object.values(dashboardStore.chartFilters).some(filter => filter !== '')
})

// 清除所有图表筛选
const clearChartFilters = () => {
  dashboardStore.clearChartFilters()
  ElMessage.success('已清除图表筛选')
}

// 清除特定图表筛选
const clearSpecificChartFilter = (type) => {
  dashboardStore.chartFilters[type] = ''
  dashboardStore.refreshAll()
  ElMessage.success(`已清除${getFilterTypeName(type)}筛选`)
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
  padding: 16px 32px 32px 32px; /* 减少顶部padding，保持其他方向 */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 8px 0; /* 减少上下内边距 */
}

.page-title-section {
  flex: 1;
}

.logo-title-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  position: relative;
}

.page-logo {
  width: 320px; /* 调大logo宽度 */
  height: 64px; /* 调大logo高度 */
  object-fit: contain;
  object-position: left center;
  border-radius: 6px;
  margin-bottom: 4px; /* 减小底部间距 */
  background: transparent; /* 确保背景透明 */
  /* 尝试去除白色背景 */
  mix-blend-mode: multiply;
  filter: contrast(1.2) brightness(1.1);
}

.page-title {
  font-size: 28px; /* 稍微减小字体 */
  font-weight: 700;
  color: #262626;
  margin: 0 0 4px 0; /* 减小底部间距 */
  background: linear-gradient(135deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 16px;
  color: #8c8c8c;
  margin: 0;
  font-weight: 400;
}

.page-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* 图表筛选状态样式 */
.chart-filters-status {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin: 16px 0;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.chart-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-filters-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.clear-filters-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  padding: 4px 8px !important;
  border-radius: 6px;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

.chart-filters-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chart-filters-tags .el-tag {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.chart-filters-tags .el-tag .el-tag__close {
  color: rgba(255, 255, 255, 0.8);
}

.chart-filters-tags .el-tag .el-tag__close:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

/* 新的仪表板布局样式 */
.dashboard-layout {
  margin-bottom: 32px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stats-grid.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* 旧的 stat-card 样式已移除，现在使用 StatCard 组件 */



/* 图表布局 */
.charts-layout {
  margin-bottom: 40px;
}

.charts-main-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.charts-main-row > * {
  height: 520px;
}

.charts-detail-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.charts-detail-row > * {
  height: 520px;
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

  .dashboard {
    padding: 20px;
    background: #f5f7fa;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 16px 0;
  }

  .page-logo {
    width: 200px; /* 移动端匹配较小的标题宽度 */
    height: 50px;
    margin-bottom: 6px;
  }

  .logo-title-container {
    gap: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .page-actions {
    width: 100%;
    justify-content: stretch;
  }

  .page-actions .el-button {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .charts-main-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .charts-main-row > * {
    height: 380px;
  }

  .charts-detail-row > * {
    height: 380px;
  }
}
</style>
