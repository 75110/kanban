<template>
  <div class="dashboard">
    <!-- 筛选器 -->
    <FilterBar
      v-model:filters="dashboardStore.filters"
      :filter-options="dashboardStore.filterOptions"
      @search="handleSearch"
      @reset="handleReset"
      @export="handleExportCommand"
      @refresh="refreshData"
      :active-tab="activeTab"
      @tab-change="handleTabChange"
      @update:filters="handleFiltersChange"
      v-model:employee-filters="employeeFilters"
      :employee-filter-options="employeeFilterOptions"
      :is-employee-loading="isEmployeeLoading"
      v-model:search-keyword="searchKeyword"
      @employee-search="handleEmployeeSearch"
      @employee-reset="handleEmployeeReset"
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

    <!-- 总数据看板内容 -->
    <div v-if="activeTab === 'overview'" class="overview-content">
      <!-- 主要内容区域：左侧(统计卡片+图表) + 右侧条形图 -->
      <div class="main-content-layout">
        <!-- 左侧列 -->
        <div class="main-content-left-column">
          <!-- 统计卡片区域 -->
          <div class="stats-section">
            <div class="stats-single-row" :class="{ 'loading': isRefreshing }">
              <StatCard
                title="在职人数"
                :value="dashboardStore.stats.totalEmployees || 0"
                type="primary"
                :growth="getGrowthRate('totalEmployees')"
                :growth-type="getGrowthType()"
              />

              <StatCard title="入职人数" :value="dashboardStore.stats.newEmployees || 0" type="success"
                :growth="getGrowthRate('newEmployees')" :growth-type="getGrowthType()" />

              <StatCard
                title="留存率"
                :value="parseFloat(calculateRetentionRate().toFixed(2))"
                type="success"
                :growth="getGrowthRate('retentionRate')"
                :growth-type="getGrowthType()"
                suffix="%"
              />

              <StatCard title="离职人数" :value="dashboardStore.stats.resignedEmployees || 0" type="warning"
                :growth="getGrowthRate('resignedEmployees')" :growth-type="getGrowthType()" />

              <StatCard title="离职率" :value="parseFloat(calculateResignationRate().toFixed(2))" type="warning"
                :growth="getGrowthRate('resignationRate')" :growth-type="getGrowthType()" suffix="%" />

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
            </div>
          </div>
          <!-- 左侧图表：饼图和地图区域 -->
          <div class="charts-left-area">
          <!-- 左列：司龄分布和学历分布（上下排列） -->
          <div class="charts-left-column">
            <ChartCard
              v-if="dashboardStore.workAgeChartData"
              title="司龄分布情况"
              type="pie"
              chart-type="workAge"
              :data="dashboardStore.workAgeChartData"
              :loading="dashboardStore.loading.workAge"
              @chart-click="handleChartClick"
            />
            
            <ChartCard
              v-if="dashboardStore.educationChartData"
              title="学历分布"
              type="pie"
              pie-style="solid"
              chart-type="education"
              :data="dashboardStore.educationChartData"
              :loading="dashboardStore.loading.education"
              @chart-click="handleChartClick"
            />
          </div>
          
          <!-- 中列：地图（占据整个高度） -->
          <div class="charts-center-column">
            <ChartCard
              :title="currentMapTitle"
              type="map"
              chart-type="map"
              :data="mapData"
              :loading="mapLoading"
              @chart-click="handleMapClick"
            />
          </div>
          </div>
        </div>

      <!-- 右侧：部门异动图 -->
        <div class="charts-right-area">
          <ChartCard
            v-if="departmentTransferData"
            title="各部门人员异动"
            type="bar"
            :horizontal="true"
            chart-type="departmentTransfer"
            :data="departmentTransferData"
            :loading="departmentTransferLoading"
            @chart-click="handleChartClick"
          />
        </div>
        </div>
      </div>

    <!-- 底部图表：各部门在职人数 - 移出主内容布局，独立占满整个宽度 -->
    <div v-if="activeTab === 'overview'" class="charts-bottom-section">
        <div class="charts-bottom-row">
          <ChartCard
            v-if="dashboardStore.departmentChartData"
            title="各部门在职人数"
            type="bar"
            chart-type="department"
            :data="dashboardStore.departmentChartData"
            :loading="dashboardStore.loading.department"
            @chart-click="handleChartClick"
          />
        </div>
      </div>

    <!-- 人员档案内容 -->
    <div v-if="activeTab === 'archive'" class="archive-content">
      <PersonnelArchiveSection 
        :employee-data="employeeData"
        :loading="isEmployeeLoading"
      />
    </div>

    <!-- 人才流失分析内容 -->
    <div v-if="activeTab === 'turnover'" class="turnover-content">
      <!-- 人才流失分析筛选状态显示 -->
      <div v-if="hasTurnoverFilters" class="turnover-filters-display">
        <div class="chart-filters-header">
          <span class="chart-filters-title">
            <el-icon>
              <Filter />
            </el-icon>
            人才流失筛选
          </span>
          <el-button type="text" size="small" @click="clearAllTurnoverFilters" class="clear-filters-btn">
            <el-icon>
              <Close />
            </el-icon>
            清除筛选
          </el-button>
        </div>
        <div class="chart-filters-tags">
          <el-tag v-if="dashboardStore.turnoverChartFilters.department" type="primary" closable
            @close="clearTurnoverFilter('department')">
            部门：{{ dashboardStore.turnoverChartFilters.department }}
          </el-tag>
          <el-tag v-if="dashboardStore.turnoverChartFilters.reason" type="success" closable
            @close="clearTurnoverFilter('reason')">
            离职原因：{{ dashboardStore.turnoverChartFilters.reason }}
          </el-tag>
          <el-tag v-if="dashboardStore.turnoverChartFilters.position" type="warning" closable
            @close="clearTurnoverFilter('position')">
            岗位：{{ dashboardStore.turnoverChartFilters.position }}
          </el-tag>
          <el-tag v-if="dashboardStore.turnoverChartFilters.tenure" type="info" closable
            @close="clearTurnoverFilter('tenure')">
            在职时间：{{ dashboardStore.turnoverChartFilters.tenure }}
          </el-tag>
        </div>
      </div>

      <!-- 人才流失分析主布局 - 三列网格布局 -->
      <div class="turnover-grid-layout">
                <!--  右侧占比为1/3，左侧占比为2/3 -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
          <div>
        <!-- 第一行：总离职人数和离职率卡片（占左边两列） -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div class="turnover-card turnover-total-card">
            <StatCard title="总离职人数" :value="turnoverStats.totalResigned || 0" type="danger"
              :growth="getTurnoverGrowthRate('totalResigned')" :growth-type="getGrowthType()" />
          </div>
          <div class="turnover-card turnover-rate-card">
            <StatCard title="离职率" :value="parseFloat(calculateTurnoverRate().toFixed(2))" type="warning"
              :growth="getTurnoverGrowthRate('turnoverRate')" :growth-type="getGrowthType()" suffix="%" />
          </div>
          <!-- 第三列空白区域 -->
          <div class="turnover-empty-space"></div>
        </div>

        <!-- 第二行：左侧两个饼图（垂直排列），中间词云图，右侧各部门离职人数 -->
        <div class="turnover-main-content"  style="grid-template-columns: 1fr 1fr;">
          <!-- 第一列：两个饼图垂直排列 -->
          <div class="turnover-left-column">
            <!-- 离职部门分析饼图 -->
            <div class="turnover-card turnover-department-pie">
              <ChartCard v-if="turnoverDepartmentData" title="离职部门分析" type="pie" chart-type="resignationDepartment"
                :data="turnoverDepartmentData" :loading="turnoverLoading.department"
                @chart-click="handleTurnoverChartClick" />
            </div>
            
            <!-- 离职人员在职时间分布饼图 -->
            <div class="turnover-card turnover-tenure-pie">
              <ChartCard v-if="turnoverTenureData" title="离职人员在职时间分布" type="pie" pie-style="solid"
                chart-type="resignationTenure" :data="turnoverTenureData" :loading="turnoverLoading.tenure"
                @chart-click="handleTurnoverChartClick" />
            </div>
          </div>
          
          <!-- 第二列：离职原因词云图 -->
          <div class="turnover-middle-column">
            <div class="turnover-card turnover-reason-wordcloud">
              <ChartCard v-if="turnoverReasonData" title="离职原因分析" type="wordcloud" chart-type="resignationReason"
                :data="turnoverReasonData" :loading="turnoverLoading.reason" @chart-click="handleTurnoverChartClick" />
            </div>
          </div>
        </div>
      </div>
      <div>
          <!-- 第三列：各部门离职人数（水平条形图） -->
          <div class="turnover-right-column">
            <div class="turnover-card turnover-department-stats">
              <ChartCard v-if="turnoverDepartmentStatsData" title="各部门离职人数" type="bar" :horizontal="true"
                chart-type="resignationDepartmentStats" :data="turnoverDepartmentStatsData"
                :loading="turnoverLoading.departmentStats" @chart-click="handleTurnoverChartClick" />
            </div>
          </div>
        </div>
</div>
        <!-- 第三行：各岗位离职人数 -->
        <div class="turnover-bottom-row">
          <div class="turnover-card turnover-position-bar">
            <ChartCard v-if="turnoverPositionData" title="各岗位离职人数" type="bar" chart-type="resignationPosition"
              :data="turnoverPositionData" :loading="turnoverLoading.position" @chart-click="handleTurnoverChartClick" />
          </div>
        </div>
      </div>
    </div>

    <!-- 户籍地分析内容 -->
    <div v-if="activeTab === 'household'" class="household-content">
      <!-- 悬浮数据表格 -->
      <div class="floating-data-table">
        <div class="table-header">
          <h4>{{ currentProvince ? `${currentProvince} - 城市分布` : '全国省份分布' }}</h4>
          <div class="header-actions">
            <el-button 
              v-if="currentProvince" 
              type="primary" 
              size="small" 
              @click="backToChina"
            >
              返回全国地图
            </el-button>
          </div>
        </div>
        <div class="table-content">
          <el-table
            :data="tableData"
            height="300"
            size="small"
            stripe
            :show-header="true"
          >
            <el-table-column prop="name" label="省份/城市" width="120" />
            <el-table-column prop="value" label="人数" width="80" align="center" />
            <el-table-column prop="address" label="地址" min-width="200">
              <template #default="{ row }">
                <el-tooltip 
                  placement="top"
                  :show-after="300"
                  :hide-after="0"
                  popper-class="custom-tooltip"
                  raw-content
                >
                  <template #content>
                    <div v-html="formatAddressForTooltipHTML(row.address, row.employeeNames)"></div>
                  </template>
                  <span class="address-cell">{{ row.address }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <!-- 地图容器 -->
      <div class="map-container">
        <ChartCard
          :title="currentMapTitle"
          type="map"
          chart-type="map"
          :data="mapData"
          :loading="mapLoading"
          @chart-click="handleMapClick"
        />
      </div>
      
    </div>
    </div>

    <!-- 水印文字输入对话框 -->
    <el-dialog
      v-model="watermarkDialogVisible"
      title="设置水印文字"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form>
        <el-form-item label="水印文字">
          <el-input
            v-model="watermarkText"
            type="textarea"
            :rows="3"
            placeholder="请输入水印文字"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="watermarkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleWatermarkConfirm">
            确认并导出
          </el-button>
        </span>
      </template>
    </el-dialog>
</template>

<script setup>
import { onMounted, computed, watch, ref, nextTick, shallowRef, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Filter, Close, ArrowDown } from '@element-plus/icons-vue'
import { useDashboardStore } from '../stores/dashboard'
import { dashboardApi } from '../api'
import { getEmployeeProfile, getEmployeeList } from '@/api/employee-profile.js'
import { householdMapApi } from '../api/household-map'
import { loadChinaMap, loadProvinceMap } from '../utils/map'
import FilterBar from '../components/FilterBar.vue'
import StatCard from '../components/StatCard.vue'
import ChartCard from '../components/ChartCard.vue'
import PersonnelArchiveSection from '../components/PersonnelArchiveSection.vue'

const dashboardStore = useDashboardStore()

// 刷新状态
const isRefreshing = ref(false)

// 导出状态
const isExporting = ref(false)

// 当前激活的标签页
const activeTab = ref('overview')

// 防抖定时器
const debounceTimer = ref(null)

// 组件是否已初始化完成
const isInitialized = ref(false)

// 员工档案相关数据
const employeeFilters = ref({
  department: '',
  name: ''
})

const employeeFilterOptions = ref({
  departments: [],
  employees: []
})

const employeeData = ref({})
const isEmployeeLoading = ref(false)
const searchKeyword = ref('')

// 正在切换标签页的标志
const isSwitchingTab = ref(false)

// 人才流失分析数据
const turnoverStats = ref({
  totalResigned: 0,
  turnoverRate: 0,
  growth: {
    monthOverMonth: null,
    yearOverYear: null
  }
})

// 人才流失图表数据 - 拆分为独立 shallowRef 以隔离更新
const turnoverDepartmentData = shallowRef(null)
const turnoverReasonData = shallowRef(null)
const turnoverDepartmentStatsData = shallowRef(null)
const turnoverPositionData = shallowRef(null)
const turnoverTenureData = shallowRef(null)

// 总览图表数据
const overallChartData = ref(null)

// 部门异动数据
const departmentTransferData = shallowRef(null)

// 人才流失加载状态
const turnoverLoading = ref({
  department: false,
  reason: false,
  departmentStats: false,
  position: false,
  tenure: false
})

// 部门异动加载状态
const departmentTransferLoading = ref(false)

// 户籍地分析相关数据
const mapData = ref({})
const mapLoading = ref(false)
const currentProvince = ref(null)
const provinceData = ref([])
const cityData = ref([])
const tableData = ref([])
const selectedProvince = ref(null) // 记录被选中的省份

// 计算异动率
const calculateChangeRate = () => {
  const total = dashboardStore.stats.totalEmployees
  const changes = dashboardStore.stats.transferEmployees
  if (total === 0) return 0
  return (changes / total * 100)
}

// 计算留存率
const calculateRetentionRate = () => {
  const newEmployees = dashboardStore.stats.newEmployees
  const resignedEmployees = dashboardStore.stats.resignedEmployees
  if (newEmployees === 0) return 0
  const retentionCount = newEmployees - resignedEmployees
  return parseFloat((retentionCount / newEmployees * 100).toFixed(2))
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
  // 确保stats和growth对象存在
  if (!dashboardStore.stats || !dashboardStore.stats.growth) {
    return null
  }

  const monthOverMonth = dashboardStore.stats.growth?.monthOverMonth?.[field]
  const yearOverYear = dashboardStore.stats.growth?.yearOverYear?.[field]

  // 优先返回环比，如果没有则返回同比
  if (monthOverMonth !== null && monthOverMonth !== undefined) {
    return parseFloat(monthOverMonth)
  }
  if (yearOverYear !== null && yearOverYear !== undefined) {
    return parseFloat(yearOverYear)
  }

  // 如果没有真实数据，返回null（不显示增长率）
  return null
}

// 计算当前地图标题
const currentMapTitle = computed(() => {
  return currentProvince.value 
    ? `${currentProvince.value}省户籍员工分布` 
    : '全国户籍员工分布'
})

// 水印文字输入对话框的显示状态
const watermarkDialogVisible = ref(false)
const watermarkText = ref('')
const defaultWatermarkText = computed(() => {
  const now = new Date()
  return `${dashboardStore.filterOptions.organizationRegions[0]?.region || '人事数据看板'} - ${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日`
})

// 处理水印确认
const handleWatermarkConfirm = () => {
  if (!watermarkText.value.trim()) {
    ElMessage.warning('请输入水印文字')
    return
  }
  watermarkDialogVisible.value = false
  exportDashboardAsPNG(true)
}

// 处理导出命令
const handleExportCommand = (command) => {
  switch (command) {
    case 'png':
      exportDashboardAsPNG(false)
      break
    case 'png-watermark':
      // 显示水印文字输入对话框
      watermarkText.value = defaultWatermarkText.value
      watermarkDialogVisible.value = true
      break
    case 'excel':
      exportDashboardAsExcel()
      break
    case 'images':
      exportAllCharts()
      break
    default:
      exportDashboardAsPNG(false)
  }
}

// 创建水印
const createWatermark = (canvas, text) => {
  const ctx = canvas.getContext('2d')
  const lines = Array(10).fill(text)
  
  // 设置水印样式
  ctx.save()
  ctx.globalAlpha = 0.1 // 设置水印透明度
  ctx.font = '16px Arial, "Microsoft YaHei", "SimHei", sans-serif'
  ctx.fillStyle = '#666'
  ctx.textAlign = 'center'
  
  // 计算水印间距
  const lineHeight = canvas.height / 12 // 分成12份，留出上下边距
  const xSpacing = canvas.width / 4 // 水平分成4份
  
  // 绘制水印
  lines.forEach((line, index) => {
    const y = lineHeight * (index + 1)
    for (let x = xSpacing / 2; x < canvas.width; x += xSpacing) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(-Math.PI / 8) // 旋转-22.5度
      ctx.fillText(line, 0, 0)
      ctx.restore()
    }
  })
  
  ctx.restore()
}

// 导出仪表板为PNG（整页导出，包含卡片与所有图表）
const exportDashboardAsPNG = async (withWatermark = false) => {
  if (isExporting.value) return

  isExporting.value = true
  try {
    ElMessage.info('正在生成PNG报告，请稍候...')

    // 动态导入html2canvas
    const { default: html2canvas } = await import('html2canvas')

    // 确保页面已渲染完成
    await nextTick()

    // 直接使用原始DOM元素进行截图，而不是克隆
    // 选择整个dashboard容器
    const dashboardContainer = document.querySelector('.dashboard')
    
    // 保存原始样式
    const originalStyles = {}
    const elementsToRestore = []
    
    // 临时隐藏页面顶部的导航和标题部分
    const filterHeader = document.querySelector('.filter-header')
    if (filterHeader) {
      originalStyles.filterHeader = {
        display: filterHeader.style.display
      }
      filterHeader.style.display = 'none'
      elementsToRestore.push(filterHeader)
    }
    
    // 临时隐藏页面上不需要的元素
    const elementsToHide = document.querySelectorAll('.page-tabs-section, .filter-actions-header')
    elementsToHide.forEach((el, index) => {
      originalStyles[`hidden_${index}`] = {
        display: el.style.display
      }
      el.style.display = 'none'
      elementsToRestore.push(el)
    })
    
    // 确保所有图表都是可见的
    const allCharts = document.querySelectorAll('.chart-container')
    allCharts.forEach((chart, index) => {
      originalStyles[`chart_${index}`] = {
        visibility: chart.style.visibility,
        display: chart.style.display,
        opacity: chart.style.opacity
      }
      chart.style.visibility = 'visible'
      chart.style.display = 'block'
      chart.style.opacity = '1'
      elementsToRestore.push(chart)
    })
    
    // 保存容器原始样式
    originalStyles.dashboard = {
      backgroundColor: dashboardContainer.style.backgroundColor,
      padding: dashboardContainer.style.padding
    }
    dashboardContainer.style.backgroundColor = '#ffffff'
    elementsToRestore.push(dashboardContainer)
    
    // 使用原始容器作为截图目标
    const container = dashboardContainer

    if (!container) {
      throw new Error('未找到可导出的仪表板容器')
    }

    // 获取当前时间用于文件名
    const now = new Date()

    // 等待更长时间确保图表完全渲染
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 注入临时样式以修复边框和文字截断问题
    const style = document.createElement('style');
    style.id = 'temp-export-style';
    style.innerHTML = `
      .el-select .el-input__wrapper {
        transition: none !important;
        box-shadow: 0 0 0 1px #dcdfe6 inset !important;
        height: 32px !important; /* 强制高度防止坍塌 */
      }
      .el-select .el-input__inner {
        height: 30px !important; /* 保证内部输入框高度 */
        line-height: 30px !important; /* 垂直居中文本 */
      }
      .el-select .el-input__wrapper:hover,
      .el-select .el-input.is-focus .el-input__wrapper {
        box-shadow: 0 0 0 1px #dcdfe6 inset !important;
      }
    `;
    document.head.appendChild(style);

    try {
      // 截取整个内容
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
        logging: true, // 启用日志以便调试
        width: container.offsetWidth,
        height: container.offsetHeight,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        foreignObjectRendering: false, // 禁用foreignObject渲染以提高兼容性
        removeContainer: false, // 不移除容器
        ignoreElements: (element) => {
          // 忽略不需要的元素
          return element.classList && 
            (element.classList.contains('filter-header') || 
             element.classList.contains('page-tabs-section') || 
             element.classList.contains('filter-actions-header'));
        }
      })

      // 恢复所有元素的原始样式
      elementsToRestore.forEach((element, index) => {
        if (element === filterHeader && originalStyles.filterHeader) {
          element.style.display = originalStyles.filterHeader.display || '';
        } else if (element === dashboardContainer && originalStyles.dashboard) {
          element.style.backgroundColor = originalStyles.dashboard.backgroundColor || '';
          element.style.padding = originalStyles.dashboard.padding || '';
        } else {
          // 恢复隐藏的元素
          for (let i = 0; i < elementsToHide.length; i++) {
            if (element === elementsToHide[i]) {
              element.style.display = originalStyles[`hidden_${i}`]?.display || '';
              break;
            }
          }
          
          // 恢复图表元素
          for (let i = 0; i < allCharts.length; i++) {
            if (element === allCharts[i]) {
              const styles = originalStyles[`chart_${i}`] || {};
              element.style.visibility = styles.visibility || '';
              element.style.display = styles.display || '';
              element.style.opacity = styles.opacity || '';
              break;
            }
          }
        }
      })

      // 如果需要添加水印
      if (withWatermark && watermarkText.value) {
        createWatermark(canvas, watermarkText.value)
      }

      // 将canvas转换为PNG并下载
      const link = document.createElement('a')
      link.download = `人事数据看板报告_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      ElMessage.success('PNG报告导出成功')
    } finally {
      // 恢复所有元素的原始样式
      elementsToRestore.forEach((element, index) => {
        if (element === filterHeader && originalStyles.filterHeader) {
          element.style.display = originalStyles.filterHeader.display || '';
        } else if (element === dashboardContainer && originalStyles.dashboard) {
          element.style.backgroundColor = originalStyles.dashboard.backgroundColor || '';
          element.style.padding = originalStyles.dashboard.padding || '';
        } else {
          // 恢复隐藏的元素
          for (let i = 0; i < elementsToHide.length; i++) {
            if (element === elementsToHide[i]) {
              element.style.display = originalStyles[`hidden_${i}`]?.display || '';
              break;
            }
          }
          
          // 恢复图表元素
          for (let i = 0; i < allCharts.length; i++) {
            if (element === allCharts[i]) {
              const styles = originalStyles[`chart_${i}`] || {};
              element.style.visibility = styles.visibility || '';
              element.style.display = styles.display || '';
              element.style.opacity = styles.opacity || '';
              break;
            }
          }
        }
      });

      // 移除临时样式
      const tempStyle = document.getElementById('temp-export-style');
      if (tempStyle) {
        document.head.removeChild(tempStyle);
      }
    }
  } catch (error) {
    console.error('导出PNG失败:', error)
    ElMessage.error('导出PNG失败，请重试')
  } finally {
    isExporting.value = false
  }
}

// 导出仪表板为Excel
const exportDashboardAsExcel = async () => {
  if (isExporting.value) return

  isExporting.value = true
  try {
    ElMessage.info('正在生成Excel报告，请稍候...')

    // 动态导入xlsx
    const XLSX = await import('xlsx')

    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 准备筛选条件信息
    const filters = dashboardStore.filters
    const filterInfo = []

    if (filters.organizationRegion) {
      const orgRegion = dashboardStore.filterOptions.organizationRegions.find(r => r.id === filters.organizationRegion)
      filterInfo.push(`组织区域: ${orgRegion?.region || filters.organizationRegion}`)
    }

    if (filters.region) {
      const region = dashboardStore.filterOptions.regions.find(r => r.id === filters.region)
      filterInfo.push(`区域: ${region?.region || filters.region}`)
    }

    if (filters.department) {
      const dept = dashboardStore.filterOptions.departments.find(d => d.id === filters.department)
      filterInfo.push(`部门: ${dept?.department || filters.department}`)
    }

    if (filters.year) {
      filterInfo.push(`年份: ${filters.year}年`)
    }

    if (filters.month) {
      filterInfo.push(`月份: ${filters.month}月`)
    }

    const filterText = filterInfo.length > 0 ? filterInfo.join(' | ') : '全部数据'
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // 添加统计数据工作表
    const stats = dashboardStore.stats
    const statsData = [
      ['人事数据看板报告'],
      [`生成时间: ${dateStr}`],
      [`筛选条件: ${filterText}`],
      [''],
      ['指标名称', '数值', '单位'],
      ['在职人数', stats.totalEmployees || 0, '人'],
      ['入职人数', stats.newEmployees || 0, '人'],
      ['离职人数', stats.resignedEmployees || 0, '人'],
      ['调动人数', stats.transferEmployees || 0, '人']
    ]

    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData)
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, '关键指标')

    // 添加司龄分布数据
    if (dashboardStore.workAgeChartData && dashboardStore.workAgeChartData.labels) {
      const workAgeData = [
        ['司龄', '人数'],
        ...dashboardStore.workAgeChartData.labels.map((label, index) => [
          label,
          dashboardStore.workAgeChartData.values[index] || 0
        ])
      ]
      const workAgeWorksheet = XLSX.utils.aoa_to_sheet(workAgeData)
      XLSX.utils.book_append_sheet(workbook, workAgeWorksheet, '司龄分布')
    }

    // 添加学历分布数据
    if (dashboardStore.educationChartData && dashboardStore.educationChartData.labels) {
      const educationData = [
        ['学历', '人数'],
        ...dashboardStore.educationChartData.labels.map((label, index) => [
          label,
          dashboardStore.educationChartData.values[index] || 0
        ])
      ]
      const educationWorksheet = XLSX.utils.aoa_to_sheet(educationData)
      XLSX.utils.book_append_sheet(workbook, educationWorksheet, '学历分布')
    }

    // 添加部门统计数据
    if (dashboardStore.departmentChartData && dashboardStore.departmentChartData.labels) {
      const departmentData = [
        ['部门', '人数'],
        ...dashboardStore.departmentChartData.labels.map((label, index) => [
          label,
          dashboardStore.departmentChartData.values[index] || 0
        ])
      ]
      const departmentWorksheet = XLSX.utils.aoa_to_sheet(departmentData)
      XLSX.utils.book_append_sheet(workbook, departmentWorksheet, '部门统计')
    }

    // 如果是人才流失标签页，添加相关数据
    if (activeTab.value === 'turnover') {
      // 添加离职部门数据
      if (turnoverDepartmentData.value && turnoverDepartmentData.value.labels) {
        const turnoverDeptData = [
          ['部门', '离职人数'],
          ...turnoverDepartmentData.value.labels.map((label, index) => [
            label,
            turnoverDepartmentData.value.values[index] || 0
          ])
        ]
        const turnoverDeptWorksheet = XLSX.utils.aoa_to_sheet(turnoverDeptData)
        XLSX.utils.book_append_sheet(workbook, turnoverDeptWorksheet, '离职部门分布')
      }

      // 添加离职原因数据
      if (turnoverReasonData.value && turnoverReasonData.value.labels) {
        const turnoverReasonDataArray = [
          ['离职原因', '人数'],
          ...turnoverReasonData.value.labels.map((label, index) => [
            label,
            turnoverReasonData.value.values[index] || 0
          ])
        ]
        const turnoverReasonWorksheet = XLSX.utils.aoa_to_sheet(turnoverReasonDataArray)
        XLSX.utils.book_append_sheet(workbook, turnoverReasonWorksheet, '离职原因分析')
      }
    }

    // 生成文件名
    const fileName = `人事数据看板报告_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.xlsx`

    // 导出文件
    XLSX.writeFile(workbook, fileName)

    ElMessage.success('Excel报告导出成功')
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error('导出Excel失败，请重试')
  } finally {
    isExporting.value = false
  }
}

// 导出所有图表
const exportAllCharts = async () => {
  if (isExporting.value) return

  isExporting.value = true
  try {
    ElMessage.info('正在导出所有图表，请稍候...')

    // 动态导入JSZip和html2canvas
    const [JSZip, { default: html2canvas }] = await Promise.all([
      import('jszip').then(m => m.default),
      import('html2canvas')
    ])
    const zip = new JSZip()

    // 获取统计卡片
    const statsContainer = document.querySelector('.stats-grid')
    let exportCount = 0

    if (statsContainer) {
      try {
        const statsCanvas = await html2canvas(statsContainer, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false
        })

        const base64Data = statsCanvas.toDataURL('image/png').split(',')[1]
        zip.file('统计卡片.png', base64Data, { base64: true })
        exportCount++
      } catch (error) {
        console.error('导出统计卡片失败:', error)
      }
    }

    // 获取所有图表卡片
    const chartCards = document.querySelectorAll('.chart-container')

    for (const chartCard of chartCards) {
      try {
        const chartTitle = chartCard.querySelector('.chart-title')?.textContent || `图表_${exportCount}`

        // 使用html2canvas截取整个图表卡片
        const cardCanvas = await html2canvas(chartCard, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: chartCard.offsetWidth,
          height: chartCard.offsetHeight
        })

        // 将canvas转换为base64
        const base64Data = cardCanvas.toDataURL('image/png').split(',')[1]
        zip.file(`${chartTitle}.png`, base64Data, { base64: true })
        exportCount++
      } catch (error) {
        console.error('导出图表卡片失败:', error)
        // 如果html2canvas失败，尝试只导出图表部分
        try {
          const chartElement = chartCard.querySelector('.echarts')
          if (chartElement && chartElement.__echarts_instance__) {
            const chartTitle = chartCard.querySelector('.chart-title')?.textContent || `图表_${exportCount}`
            const echartsInstance = chartElement.__echarts_instance__

            const url = echartsInstance.getDataURL({
              type: 'png',
              pixelRatio: 2,
              backgroundColor: '#fff'
            })

            const base64Data = url.split(',')[1]
            zip.file(`${chartTitle}_图表.png`, base64Data, { base64: true })
            exportCount++
          }
        } catch (fallbackError) {
          console.error('回退方案也失败:', fallbackError)
        }
      }
    }

    if (exportCount === 0) {
      ElMessage.warning('没有找到可导出的图表')
      return
    }

    // 生成ZIP文件
    const content = await zip.generateAsync({ type: 'blob' })

    // 创建下载链接
    const now = new Date()
    const fileName = `人事数据看板图表_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.zip`

    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = fileName
    link.click()

    // 清理URL对象
    URL.revokeObjectURL(link.href)

    ElMessage.success(`成功导出${exportCount}个图表`)
  } catch (error) {
    console.error('导出所有图表失败:', error)
    ElMessage.error('导出图表失败，请重试')
  } finally {
    isExporting.value = false
  }
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
    if (activeTab.value === 'overview') {
      await Promise.all([
        dashboardStore.refreshAll(),
        fetchDepartmentTransferData(),
        loadChinaMapData() // 在总看板页面也加载地图数据
      ])
    } else if (activeTab.value === 'turnover') {
      await loadTurnoverData()
    } else if (activeTab.value === 'household') {
      // 户籍地分析页面，重新加载地图数据
      await loadChinaMapData()
    }
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

// 处理重置
const handleReset = async () => {
  console.log('执行重置筛选操作')
  
  // 重置store中的筛选条件
  dashboardStore.resetFilters()
  dashboardStore.clearChartFilters()
  
  // 重置地图状态
  await resetMapState()
  
  // 重新加载数据
  await handleSearch()
  
  console.log('重置筛选操作完成')
}

// 处理筛选条件变化
const handleFiltersChange = async (newFilters) => {
  console.log('筛选条件变化:', newFilters)
  console.log('当前标签页:', activeTab.value)
  
  // 更新store中的筛选条件
  dashboardStore.filters = { ...newFilters }
  
  // 如果当前是户籍地分析页面，自动重新加载地图数据
  if (activeTab.value === 'household') {
    console.log('户籍地分析页面，重新加载地图数据')
    await loadChinaMapData()
  }
}

// 处理图表点击事件
const handleChartClick = (event) => {
  console.log('图表点击事件:', event)
  dashboardStore.setChartFilter(event.type, event.value)
  // ElMessage.success(`已筛选${getFilterTypeName(event.type)}: ${event.value}`)
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
  // ElMessage.success('已清除图表筛选')
}

// 清除特定图表筛选
const clearSpecificChartFilter = (type) => {
  dashboardStore.chartFilters[type] = ''
  if (activeTab.value === 'overview') {
    Promise.all([
      dashboardStore.refreshAll(),
      fetchDepartmentTransferData()
    ])
  }
  // ElMessage.success(`已清除${getFilterTypeName(type)}筛选`)
}

// 处理标签页切换
const handleTabChange = async (tab) => {
  const previousTab = activeTab.value;
  activeTab.value = tab.paneName;

  if (previousTab !== tab.paneName) {
    isSwitchingTab.value = true;
    try {
      // 暂时禁用watch监听器，避免重复刷新
      isInitialized.value = false;

      // 使用 store 的页面切换方法来管理筛选状态
      dashboardStore.handlePageSwitch(previousTab, tab.paneName);

      // 重新启用watch监听器
      setTimeout(() => {
        isInitialized.value = true;
      }, 100);

      // 如果切换到人才流失页面，加载相关数据
      if (tab.paneName === 'turnover') {
        await loadTurnoverData();
      }
      
      // 如果切换到人员档案页面，加载员工列表
      if (tab.paneName === 'archive') {
        await loadEmployeeList();
      }
      
      // 如果切换到户籍地分析页面，加载地图数据
      if (tab.paneName === 'household') {
        await loadChinaMapData();
      }
    } finally {
      isSwitchingTab.value = false;
    }
  }
};

// 加载人才流失分析数据 - 优化为分批加载以减少数据库压力
const loadTurnoverData = async (options = {}) => {
  // 清除之前的防抖定时器
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }

  // 防抖：延迟500ms执行，避免频繁请求
  return new Promise((resolve) => {
    debounceTimer.value = setTimeout(async () => {
      try {
        console.log('开始加载人才流失数据...')

        // 并行加载所有数据，避免重复渲染
        const promises = []

        promises.push(fetchTurnoverStats())

        if (options.exclude !== 'department') {
          promises.push(dashboardApi.getTurnoverDepartmentDistribution(turnoverFilters.value))
        } else {
          promises.push(null)
        }

        if (options.exclude !== 'reason') {
          const filtersWithoutReason = { ...turnoverFilters.value }
          delete filtersWithoutReason.reason
          promises.push(dashboardApi.getTurnoverReasonAnalysis(filtersWithoutReason))
        } else {
          promises.push(null)
        }

        if (options.exclude !== 'departmentStats') {
          promises.push(dashboardApi.getTurnoverDepartmentStats(turnoverFilters.value))
        } else {
          promises.push(null)
        }

        if (options.exclude !== 'position') {
          const filtersWithoutPosition = { ...turnoverFilters.value }
          delete filtersWithoutPosition.position
          promises.push(dashboardApi.getTurnoverPositionDistribution(filtersWithoutPosition))
        } else {
          promises.push(null)
        }

        if (options.exclude !== 'tenure') {
          const filtersWithoutTenure = { ...turnoverFilters.value }
          delete filtersWithoutTenure.tenure
          promises.push(dashboardApi.getTurnoverTenureDistribution(filtersWithoutTenure))
        } else {
          promises.push(null)
        }

        // 等待所有数据加载完成
        const [stats, departmentData, reasonData, departmentStatsData, positionData, tenureData] = await Promise.all(promises)

        // 直接更新独立的 shallowRef
        if (departmentData) turnoverDepartmentData.value = departmentData;
        if (reasonData) turnoverReasonData.value = reasonData;
        if (departmentStatsData) turnoverDepartmentStatsData.value = departmentStatsData;
        if (positionData) turnoverPositionData.value = positionData;
        if (tenureData) turnoverTenureData.value = tenureData;

        console.log('人才流失数据加载完成')
        resolve()
      } catch (error) {
        console.error('加载人才流失数据失败:', error)
        ElMessage.error('加载人才流失数据失败')
        resolve()
      }
    }, 500) // 500ms防抖延迟
  })
}

// 获取人才流失统计数据
const fetchTurnoverStats = async () => {
  try {
    const data = await dashboardApi.getTurnoverStats(turnoverFilters.value)
    if (data) {
      turnoverStats.value = data
    }
  } catch (error) {
    console.error('获取人才流失统计数据失败:', error)
    ElMessage.error('获取人才流失统计数据失败')
  }
}

// 获取离职部门分布数据
const fetchTurnoverDepartmentData = async () => {
  turnoverLoading.value.department = true
  try {
    console.log('获取离职部门分布，筛选参数:', turnoverFilters.value)
    const data = await dashboardApi.getTurnoverDepartmentDistribution(turnoverFilters.value)
    console.log('离职部门分布数据:', data)
    console.log('离职部门分布详细数据:', {
      labels: data.labels,
      values: data.values,
      total: data.values?.reduce((sum, val) => sum + val, 0)
    })
    if (data) {
      // 使用 nextTick 来避免重复渲染
      await nextTick()
      turnoverChartData.value.departmentData = data
    }
  } catch (error) {
    console.error('获取离职部门分布失败:', error)
    ElMessage.error('获取离职部门分布失败')
  } finally {
    turnoverLoading.value.department = false
  }
}

// 获取离职原因数据
const fetchTurnoverReasonData = async () => {
  turnoverLoading.value.reason = true
  try {
    // 离职原因分析不应该根据reason参数筛选自己
    const filtersWithoutReason = { ...turnoverFilters.value }
    delete filtersWithoutReason.reason

    console.log('fetchTurnoverReasonData - 筛选参数:', filtersWithoutReason)
    const data = await dashboardApi.getTurnoverReasonAnalysis(filtersWithoutReason)
    console.log('fetchTurnoverReasonData - 返回数据:', data)
    console.log('fetchTurnoverReasonData - 数据总数:', data?.values?.reduce((sum, val) => sum + val, 0))
    if (data) {
      const oldReasonData = turnoverChartData.value.reasonData
      console.log('更新前的reasonData:', {
        labels: oldReasonData?.labels?.slice(0, 3) || [],
        values: oldReasonData?.values?.slice(0, 3) || [],
        total: oldReasonData?.values?.reduce((sum, val) => sum + val, 0) || 0
      })
      await nextTick()
      turnoverChartData.value.reasonData = data
      console.log('更新后的reasonData:', {
        labels: data.labels?.slice(0, 3),
        values: data.values?.slice(0, 3),
        total: data.values?.reduce((sum, val) => sum + val, 0)
      })

      // 显示数据变化百分比
      const oldTotal = oldReasonData?.values?.reduce((sum, val) => sum + val, 0) || 0
      const newTotal = data.values?.reduce((sum, val) => sum + val, 0) || 0
      const changePercent = oldTotal > 0 ? ((newTotal - oldTotal) / oldTotal * 100).toFixed(1) : 0
      console.log(`🔍 离职原因数据变化: ${oldTotal} → ${newTotal} (${changePercent}%)`)
    }
  } catch (error) {
    console.error('获取离职原因分析失败:', error)
    ElMessage.error('获取离职原因分析失败')
  } finally {
    turnoverLoading.value.reason = false
  }
}

// 获取离职人员部门统计
const fetchTurnoverDepartmentStats = async () => {
  turnoverLoading.value.departmentStats = true
  try {
    const data = await dashboardApi.getTurnoverDepartmentStats(turnoverFilters.value)
    if (data) {
      await nextTick()
      turnoverChartData.value.departmentStatsData = data
    }
  } catch (error) {
    console.error('获取离职人员部门统计失败:', error)
    ElMessage.error('获取离职人员部门统计失败')
  } finally {
    turnoverLoading.value.departmentStats = false
  }
}

// 获取离职岗位分布
const fetchTurnoverPositionData = async () => {
  turnoverLoading.value.position = true
  try {
    // 离职岗位分布不应该根据position参数筛选自己
    const filtersWithoutPosition = { ...turnoverFilters.value }
    delete filtersWithoutPosition.position

    const data = await dashboardApi.getTurnoverPositionDistribution(filtersWithoutPosition)
    if (data) {
      await nextTick()
      turnoverChartData.value.positionData = data
    }
  } catch (error) {
    console.error('获取离职岗位分布失败:', error)
    ElMessage.error('获取离职岗位分布失败')
  } finally {
    turnoverLoading.value.position = false
  }
}

// 获取离职人员在职时间分布
const fetchTurnoverTenureData = async () => {
  turnoverLoading.value.tenure = true
  try {
    // 在职时间分布不应该根据tenure参数筛选自己，所以排除tenure参数
    const filtersWithoutTenure = { ...turnoverFilters.value }
    delete filtersWithoutTenure.tenure

    console.log('fetchTurnoverTenureData - 筛选参数:', filtersWithoutTenure)
    const data = await dashboardApi.getTurnoverTenureDistribution(filtersWithoutTenure)
    console.log('fetchTurnoverTenureData - 返回数据:', data)
    if (data) {
      console.log('更新前的tenureData:', turnoverChartData.value.tenureData)
      await nextTick()
      turnoverChartData.value.tenureData = data
      console.log('更新后的tenureData:', turnoverChartData.value.tenureData)
    }
  } catch (error) {
    console.error('获取离职人员在职时间分布失败:', error)
    ElMessage.error('获取离职人员在职时间分布失败')
  } finally {
    turnoverLoading.value.tenure = false
  }
}

// 计算人才流失率
const calculateTurnoverRate = () => {
  const total = turnoverStats.value.totalResigned + dashboardStore.stats.totalEmployees
  const resigned = turnoverStats.value.totalResigned
  if (total === 0) return 0
  return (resigned / total * 100)
}

// 获取人才流失增长率
const getTurnoverGrowthRate = (field) => {
  const monthOverMonth = turnoverStats.value.growth?.monthOverMonth?.[field]
  const yearOverYear = turnoverStats.value.growth?.yearOverYear?.[field]

  if (monthOverMonth !== null && monthOverMonth !== undefined) {
    return parseFloat(monthOverMonth)
  }
  if (yearOverYear !== null && yearOverYear !== undefined) {
    return parseFloat(yearOverYear)
  }
  return null
}

// 合并人才流失筛选参数
const turnoverFilters = computed(() => {
  const baseFilters = dashboardStore.currentFilters
  const chartFilters = dashboardStore.turnoverChartFilters

  return {
    ...baseFilters,
    reason: chartFilters.reason || '',
    position: chartFilters.position || '',
    tenure: chartFilters.tenure || '',
    // 如果图表筛选中有部门，优先使用图表筛选的部门
    department: chartFilters.department || baseFilters.department || ''
  }
})

// 检查是否有人才流失筛选
const hasTurnoverFilters = computed(() => {
  const filters = dashboardStore.turnoverChartFilters
  return filters.department || filters.reason || filters.position || filters.tenure
})

// 清除单个人才流失筛选
const clearTurnoverFilter = (type) => {
  dashboardStore.turnoverChartFilters[type] = ''
  // ElMessage.success(`已清除${type}筛选`)
  loadTurnoverData()
}

// 清除所有人才流失筛选
const clearAllTurnoverFilters = () => {
  // 使用 store 的清除所有筛选方法
  dashboardStore.clearAllFilters()
  // ElMessage.success('已清除所有筛选')
  loadTurnoverData()
}

// 获取部门异动数据
const fetchDepartmentTransferData = async () => {
  departmentTransferLoading.value = true
  try {
    console.log('开始获取部门异动数据，筛选条件:', dashboardStore.currentFilters)
    const data = await dashboardApi.getDepartmentTransferStats(dashboardStore.currentFilters)
    console.log('部门异动API返回数据:', data)
    
    if (data && data.labels && data.values && data.labels.length > 0) {
      departmentTransferData.value = data
      console.log('部门异动数据设置成功:', data)
    } else {
      console.warn('部门异动API返回空数据或数据格式不正确:', data)
      // 设置空数据，让图表显示"暂无数据"
      departmentTransferData.value = { labels: [], values: [] }
    }
  } catch (error) {
    console.error('获取部门异动数据失败:', error)
    ElMessage.error('获取部门异动数据失败')
    // 设置空数据，让图表显示"暂无数据"
    departmentTransferData.value = { labels: [], values: [] }
  } finally {
    departmentTransferLoading.value = false
  }
}

// 处理人才流失分析图表点击事件
const handleTurnoverChartClick = (params) => {
  console.log('人才流失图表点击:', params)

  if (!params || !params.value) return

  const { type: chartType, value: name } = params

  // 根据不同的图表类型设置不同的筛选条件
  switch (chartType) {
    case 'resignationDepartment':
    case 'resignationDepartmentStats':
      // 部门筛选 - 同时设置主筛选和图表筛选
      dashboardStore.setFilter('department', name)
      dashboardStore.setTurnoverChartFilter('department', name)
      // ElMessage.success(`已筛选部门：${name}`)
      // 刷新人才流失数据
      loadTurnoverData({ exclude: 'department' })
      break

    case 'resignationReason':
      // 离职原因筛选
      dashboardStore.setTurnoverChartFilter('reason', name)
      // ElMessage.success(`已筛选离职原因：${name}`)
      // 刷新人才流失数据
      loadTurnoverData({ exclude: 'reason' })
      break

    case 'resignationPosition':
      // 岗位筛选
      dashboardStore.setTurnoverChartFilter('position', name)
      // ElMessage.success(`已筛选离职岗位：${name}`)
      // 刷新人才流失数据
      loadTurnoverData({ exclude: 'position' })
      break

    case 'resignationTenure':
      // 在职时间筛选
      console.log('设置在职时间筛选:', name)
      dashboardStore.setTurnoverChartFilter('tenure', name)
      console.log('当前筛选状态:', dashboardStore.turnoverChartFilters)
      console.log('合并后的筛选参数:', turnoverFilters.value)
      // ElMessage.success(`已筛选在职时间：${name}`)

      // 联动筛选：更新图表本身只显示被点击的数据
      const tenureData = turnoverChartData.value.tenureData
      if (tenureData && tenureData.values && tenureData.labels) {
        const clickedData = tenureData.values[params.data.dataIndex]
        const clickedLabel = tenureData.labels[params.data.dataIndex]
        turnoverChartData.value.tenureData = {
          labels: [clickedLabel],
          values: [clickedData]
        }
      }

      // 刷新其他人才流失数据
      loadTurnoverData({ exclude: 'tenure' })
      break

    default:
      console.log('未处理的图表类型:', chartType)
  }
}

// 刷新数据
const refreshData = async () => {
  try {
    if (activeTab.value === 'overview') {
      await Promise.all([
        dashboardStore.refreshAll(),
        fetchDepartmentTransferData()
      ])
    } else if (activeTab.value === 'turnover') {
      await loadTurnoverData()
    }
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

// 监听筛选条件变化，自动刷新数据
watch(
  () => dashboardStore.filters,
  async (newFilters, oldFilters) => {
    // 避免初始化时触发 - 只有在组件初始化完成且有旧值时才触发
    if (isInitialized.value && oldFilters && !isSwitchingTab.value) {
      // 清除之前的定时器
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value)
      }

      // 设置防抖，100ms后执行，快速响应
      debounceTimer.value = setTimeout(async () => {
        try {
          isRefreshing.value = true
          if (activeTab.value === 'overview') {
            await Promise.all([
              dashboardStore.refreshAll(),
              fetchDepartmentTransferData(),
              loadChinaMapData() // 添加地图数据重新加载
            ])
          } else if (activeTab.value === 'turnover') {
            await loadTurnoverData()
          }
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

// 监听员工选择变化，自动搜索
watch(
  () => employeeFilters.name,
  (newName, oldName) => {
    console.log('【重要】员工选择变化:', oldName, '->', newName)
    // 只有当新值存在且与旧值不同时才触发，避免不必要的调用
    if (newName && newName !== oldName) {
      console.log('【重要】触发自动搜索:', newName)
      // 当从下拉框选择员工时，清空搜索关键词，避免逻辑冲突
      searchKeyword.value = ''
      handleEmployeeSearch()
    }
  }
)

// 员工档案相关方法
// 加载员工列表
const loadEmployeeList = async () => {
  try {
    const response = await getEmployeeList()
    
    if (response.success) {
      employeeFilterOptions.value.employees = response.data
      
      // 设置部门选项
      const departments = [...new Set(response.data.map(emp => emp.department).filter(Boolean))]
      employeeFilterOptions.value.departments = departments.map(dept => ({
        label: dept,
        value: dept
      }))
    } else {
      console.error('员工列表API返回失败:', response.message)
      ElMessage.error('加载员工列表失败: ' + (response.message || '未知错误'))
    }
  } catch (error) {
    console.error('加载员工列表失败:', error)
    ElMessage.error('加载员工列表失败，请稍后重试')
  }
}

// 处理员工搜索
const handleEmployeeSearch = async () => {
  // 如果有搜索关键词，优先处理搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    const filteredEmployees = employeeFilterOptions.value.employees.filter(emp =>
      emp.name.toLowerCase().includes(keyword) ||
      (emp.employee_id && emp.employee_id.toString().toLowerCase().includes(keyword)) ||
      (emp.phone && emp.phone.includes(keyword))
    )

    if (filteredEmployees.length === 0) {
      ElMessage.warning('未找到匹配的员工')
      return
    }
    if (filteredEmployees.length === 1) {
      // 找到唯一匹配项，自动选择并更新下拉框和部门
      const matchedEmployee = filteredEmployees[0]
      employeeFilters.value = {
        name: matchedEmployee.name,
        department: matchedEmployee.department
      }
      // 继续执行，获取该员工的档案
    } else {
      // 找到多个匹配项，提示用户从下拉框中精确选择
      ElMessage.info(`找到 ${filteredEmployees.length} 名员工，请从下拉列表中选择`)
      return
    }
  }

  // 使用当前选择的员工（可能来自搜索结果或下拉选择）
  const employeeName = employeeFilters.value.name
  
  if (!employeeName) {
    employeeData.value = {}
    return
  }

  // 开始搜索
  let employeeToSearch = employeeName

  // 情况1：由搜索按钮触发（存在搜索关键词）
  if (searchKeyword.value) {
    console.log('通过搜索关键词查找员工:', searchKeyword.value)
    const keyword = searchKeyword.value.toLowerCase()
    const filteredEmployees = employeeFilterOptions.value.employees.filter(emp =>
      emp.name.toLowerCase().includes(keyword) ||
      (emp.employee_id && emp.employee_id.toString().toLowerCase().includes(keyword)) ||
      (emp.phone && emp.phone.includes(keyword))
    )

    console.log('搜索结果:', filteredEmployees)

    if (filteredEmployees.length === 0) {
      ElMessage.warning('未找到匹配的员工')
      return
    }
    if (filteredEmployees.length === 1) {
      // 找到唯一匹配项，自动选择并更新下拉框和部门
      const matchedEmployee = filteredEmployees[0]
      console.log('找到唯一匹配员工:', matchedEmployee.name, '部门:', matchedEmployee.department)
      employeeFilters.value = {
        name: matchedEmployee.name,
        department: matchedEmployee.department
      }
      employeeToSearch = matchedEmployee.name
    } else {
      // 找到多个匹配项，提示用户从下拉框中精确选择
      console.log('找到多个匹配员工:', filteredEmployees.length)
      ElMessage.info(`找到 ${filteredEmployees.length} 名员工，请从下拉列表中精确选择`)
      return // 停止执行，等待用户选择
    }
  }

  // 情况2：在所有逻辑之后，仍然没有确定要搜索的员工
  if (!employeeToSearch) {
    console.log('没有选择员工，清空档案')
    // 这种情况理论上只会在用户清空选择时发生，此时应清空档案
    employeeData.value = {}
    return
  }

  // 开始获取指定员工的档案
  console.log('开始获取员工档案:', employeeToSearch)
  isEmployeeLoading.value = true
  try {
    const response = await getEmployeeProfile(employeeToSearch)
    console.log('获取员工档案响应:', response)
    if (response.success) {
      employeeData.value = response.data
      ElMessage.success('员工档案加载成功')
    } else {
      ElMessage.error(response.message || '获取员工档案失败')
      employeeData.value = {} // 失败时清空数据
    }
  } catch (error) {
    console.error('加载员工档案失败:', error)
    ElMessage.error('加载员工档案失败，请联系管理员')
    employeeData.value = {} // 异常时清空数据
  } finally {
    isEmployeeLoading.value = false
  }
}

// 处理员工筛选重置
const handleEmployeeReset = () => {
  employeeFilters.department = ''
  employeeFilters.name = ''
  searchKeyword.value = ''
  employeeData.value = {}
}

// 格式化地址用于tooltip显示
const formatAddressForTooltip = (address) => {
  if (!address) return ''
  
  // 如果地址包含分号分隔的多个地址，每个地址一行
  if (address.includes(';')) {
    return address.split(';').map(addr => addr.trim()).join('\n')
  }
  
  // 如果地址太长，每20个字符换行
  if (address.length > 20) {
    const lines = []
    for (let i = 0; i < address.length; i += 20) {
      lines.push(address.substring(i, i + 20))
    }
    return lines.join('\n')
  }
  
  return address
}

// 格式化地址为HTML格式用于tooltip显示
const formatAddressForTooltipHTML = (address, employeeNames = []) => {
  if (!address) return '暂无数据'
  
  // 调试日志：查看传入的数据
  console.log('formatAddressForTooltipHTML 调试:', {
    address,
    employeeNames,
    employeeNamesLength: employeeNames?.length
  })
  
  // 现在地址数据已经是 "姓名1,姓名2,姓名3 - 地址; 姓名4,姓名5 - 地址" 的格式
  // 只需要用分号分割，每个地址一行
  if (address.includes(';')) {
    return address.split(';').map(addr => addr.trim()).join('<br/>')
  } else {
    return address
  }
}

// 渐进式加载省份数据（无进度弹窗）
const loadProvincesProgressively = async (provincesData) => {
  const currentMapData = []
  
  for (let i = 0; i < provincesData.length; i++) {
    const province = provincesData[i]
    
    // 添加当前省份到地图数据
    currentMapData.push({
      name: province.name,
      value: province.value
    })
    
    // 更新地图数据，为选中省份设置黄色
    mapData.value = {
      mapType: 'china',
      data: currentMapData.map(item => ({
        ...item,
        selected: item.name === selectedProvince.value, // 使用selected属性
        itemStyle: item.name === selectedProvince.value ? {
          areaColor: '#ffd700' // 选中省份显示黄色
        } : undefined
      }))
    }
    
    // 更新表格数据（显示已加载的省份）
    tableData.value = provincesData.slice(0, i + 1)
    
    console.log(`加载省份 ${i + 1}/${provincesData.length}: ${province.name} (${province.value}人)`)
    
    // 添加延迟，让用户看到渐进式加载效果
    if (i < provincesData.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50)) // 50ms延迟，加快加载速度
    }
  }
}

// 加载中国地图数据
const loadChinaMapData = async () => {
  mapLoading.value = true
  try {
    // 加载中国地图数据
    await loadChinaMap()
    
    // 调用真实API获取省级分布数据
    console.log('开始获取省级分布数据...')
    console.log('当前筛选条件:', dashboardStore.filters)
    
    // 传递筛选参数（省级分布不受hometown筛选影响，保持显示全国各省份）
    const filterParams = {
      organizationRegion: dashboardStore.filters.organizationRegion,
      region: dashboardStore.filters.region,
      department: dashboardStore.filters.department,
      // hometown: dashboardStore.filters.hometown, // 省级分布不受hometown筛选影响
      year: dashboardStore.filters.year,
      month: dashboardStore.filters.month,
      dateRange: dashboardStore.filters.dateRange
    }
    
    const response = await householdMapApi.getProvinceDistribution(filterParams)
    
    let allProvincesData = []
    
    if (response.success && response.data) {
      console.log('API返回的省级数据:', response.data)
      
      // 检查是否有部门筛选
      const hasDepartmentFilter = dashboardStore.filters.department && dashboardStore.filters.department !== ''
      
      if (hasDepartmentFilter) {
        // 如果有部门筛选，显示所有省份的市级数据
        console.log('检测到部门筛选，加载所有省份的市级数据')
        await loadAllProvincesCityData(response.data)
        return
      }
      
      // 转换API数据格式并按人数降序排序
      allProvincesData = response.data
        .map(item => ({
          name: item.province,
          value: item.count,
          employeeNames: item.employeeNames || [], // 添加员工姓名字段
          address: '' // 省份级别地址列留空
        }))
        .sort((a, b) => b.value - a.value) // 按人数从多到少排序
      
      console.log('排序后的省级数据:', allProvincesData)
    } else {
      console.warn('API返回数据格式异常，使用模拟数据')
      // 如果API失败，使用模拟数据作为备用
      allProvincesData = mockProvinceData()
        .map(item => ({
          ...item,
          employeeNames: [], // 添加员工姓名字段
          address: '' // 省份级别地址列留空
        }))
        .sort((a, b) => b.value - a.value) // 按人数从多到少排序
    }
    
    // 渐进式加载省份数据
    await loadProvincesProgressively(allProvincesData)
    
    // 最终更新完整数据
    provinceData.value = allProvincesData
    
    // 确保选中省份的黄色标记正确显示
    if (selectedProvince.value) {
      mapData.value = {
        mapType: 'china',
        data: allProvincesData.map(item => ({
          name: item.name,
          value: item.value,
          selected: item.name === selectedProvince.value, // 使用selected属性
          itemStyle: item.name === selectedProvince.value ? {
            areaColor: '#ffd700' // 选中省份显示黄色
          } : undefined
        }))
      }
    }
    
    console.log('所有省份数据加载完成')
    
    currentProvince.value = null
    mapLoading.value = false
  } catch (error) {
    console.error('加载中国地图失败:', error)
    console.log('使用模拟数据作为备用')
    
    // 如果API调用失败，使用模拟数据
    const mockData = mockProvinceData()
        .map(item => ({
          ...item,
          employeeNames: [], // 添加员工姓名字段
          address: '' // 省份级别地址列留空
        }))
      .sort((a, b) => b.value - a.value) // 按人数从多到少排序
    
    // 渐进式加载模拟数据
    await loadProvincesProgressively(mockData)
    
    provinceData.value = mockData
    
    mapLoading.value = false
  }
}

// 加载市级分布数据
// 加载所有省份的市级数据（用于部门筛选）
const loadAllProvincesCityData = async (provincesData) => {
  console.log('=== 开始加载所有省份的市级数据 ===')
  mapLoading.value = true
  try {
    const allCityData = []
    
    // 为每个省份加载市级数据
    for (const provinceData of provincesData) {
      const province = provinceData.province
      console.log(`加载${province}的市级数据...`)
      
      try {
        const filterParams = {
          organizationRegion: dashboardStore.filters.organizationRegion,
          region: dashboardStore.filters.region,
          department: dashboardStore.filters.department
        }
        
        const response = await householdMapApi.getCityDistribution(province, filterParams)
        
        if (response.success && response.data) {
          const cityData = response.data.map(item => {
            return {
              name: item.city,
              value: item.count,
              employeeNames: [], // 不再需要单独的员工姓名字段
              address: item.addresses || '', // 直接使用聚合后的地址数据
              province: province // 添加省份信息用于显示
            }
          })
          
          // 调试日志：查看API返回的数据结构
          console.log('城市数据API返回示例:', response.data[0])
          console.log('映射后的城市数据示例:', cityData[0])
          
          allCityData.push(...cityData)
          console.log(`${province}市级数据加载完成，共${cityData.length}条`)
        }
      } catch (error) {
        console.error(`加载${province}市级数据失败:`, error)
      }
    }
    
    // 按人数从多到少排序
    allCityData.sort((a, b) => b.value - a.value)
    
    // 更新表格数据
    tableData.value = allCityData
    cityData.value = allCityData
    
    console.log('所有省份市级数据加载完成，共', allCityData.length, '条')
    console.log('更新后的表格数据:', tableData.value)
    
    // 更新地图显示（显示所有市级数据）
    await updateMapWithAllCityData(allCityData)
    
  } catch (error) {
    console.error('加载所有省份市级数据失败:', error)
  } finally {
    mapLoading.value = false
  }
}

const loadCityDistribution = async (province) => {
  console.log(`=== 开始加载${province}的市级数据 ===`)
  mapLoading.value = true
  try {
    console.log(`开始加载${province}的市级数据...`)
    
    // 更新筛选条件中的hometown为选中的省份
    dashboardStore.filters.hometown = province
    console.log('更新筛选条件hometown为:', province)
    
    // 调用真实API获取市级分布数据
    console.log('调用API:', `getCityDistribution(${province})`)
    
    // 传递筛选参数
    const filterParams = {
      organizationRegion: dashboardStore.filters.organizationRegion,
      region: dashboardStore.filters.region,
      department: dashboardStore.filters.department
    }
    
    const response = await householdMapApi.getCityDistribution(province, filterParams)
    console.log('API响应:', response)
    
    if (response.success && response.data) {
      console.log(`API返回的${province}市级数据:`, response.data)
      console.log('API数据示例:', response.data[0])
      
      // 转换API数据格式，包含地址信息
      const apiData = response.data.map(item => ({
        name: item.city,
        value: item.count,
        employeeNames: item.employeeNames || [], // 添加员工姓名字段
        address: item.addresses || '' // 使用API返回的地址信息
      }))
      
      cityData.value = apiData
      tableData.value = apiData // 更新表格数据
      
      console.log('更新后的表格数据:', tableData.value)
      
      // 使用地图模式显示市级数据（保持在中国地图上），同时保持选中省份的黄色标记
      console.log('当前selectedProvince:', selectedProvince.value)
      console.log('当前province:', province)
      
      // 在城市视图中，我们需要保持省份的高亮，而不是城市的高亮
      // 所以我们需要将省份数据也包含在地图数据中
      const allMapData = []
      
      // 添加省份数据（用于高亮显示）
      allMapData.push({
        name: province,
        value: 0, // 省份本身不显示数值
        selected: true, // 省份始终选中
        itemStyle: {
          areaColor: '#ffd700' // 选中省份显示黄色
        }
      })
      
      // 添加城市数据
      apiData.forEach(item => {
        allMapData.push({
          name: item.name,
          value: item.value,
          selected: false, // 城市不选中
          itemStyle: undefined
        })
      })
      
      mapData.value = {
        mapType: 'china',
        data: allMapData
      }
      
      console.log('设置的地图数据:', mapData.value)
      
      console.log(`成功加载${province}的市级数据`)
      
      // 刷新其他图表数据以反映省份筛选
      console.log('刷新其他图表数据以反映省份筛选')
      await dashboardStore.refreshAll()
    } else {
      console.warn(`API返回数据格式异常，使用模拟数据`)
      // 如果API失败，使用模拟数据作为备用
      const mockData = mockCityData(province).map((item, index) => ({
        ...item,
        employeeNames: [`模拟员工${index + 1}`, `测试员工${index + 1}`], // 添加模拟员工姓名
        address: `浙江省义乌市${item.name}街道${index + 1}号; 浙江省义乌市${item.name}区${index + 2}号` // 添加模拟地址
      }))
      cityData.value = mockData
      tableData.value = mockData // 更新表格数据
      
      console.log('使用模拟数据更新表格:', tableData.value)
      
      // 在城市视图中，我们需要保持省份的高亮
      const allMapData = []
      
      // 添加省份数据（用于高亮显示）
      allMapData.push({
        name: province,
        value: 0, // 省份本身不显示数值
        selected: true, // 省份始终选中
        itemStyle: {
          areaColor: '#ffd700' // 选中省份显示黄色
        }
      })
      
      // 添加城市数据
      mockData.forEach(item => {
        allMapData.push({
          name: item.name,
          value: item.value,
          selected: false, // 城市不选中
          itemStyle: undefined
        })
      })
      
      mapData.value = {
        mapType: 'china',
        data: allMapData
      }
      
      // 刷新其他图表数据以反映省份筛选（模拟数据情况）
      console.log('刷新其他图表数据以反映省份筛选（模拟数据）')
      await dashboardStore.refreshAll()
    }
    
    currentProvince.value = province
    mapLoading.value = false
    
  } catch (error) {
    console.error(`获取${province}市级分布数据失败:`, error)
    console.log('使用模拟数据作为备用')
    
    // 如果API调用失败，使用模拟数据
    const mockData = mockCityData(province).map((item, index) => ({
      ...item,
      employeeNames: [`模拟员工${index + 1}`, `测试员工${index + 1}`], // 添加模拟员工姓名
      address: `浙江省义乌市${item.name}街道${index + 1}号; 浙江省义乌市${item.name}区${index + 2}号` // 添加模拟地址
    }))
    cityData.value = mockData
    tableData.value = mockData // 更新表格数据
    
    console.log('错误处理中使用模拟数据更新表格:', tableData.value)
    
    // 在城市视图中，我们需要保持省份的高亮
    const allMapData = []
    
    // 添加省份数据（用于高亮显示）
    allMapData.push({
      name: province,
      value: 0, // 省份本身不显示数值
      selected: true, // 省份始终选中
      itemStyle: {
        areaColor: '#ffd700' // 选中省份显示黄色
      }
    })
    
    // 添加城市数据
    mockData.forEach(item => {
      allMapData.push({
        name: item.name,
        value: item.value,
        selected: false, // 城市不选中
        itemStyle: undefined
      })
    })
    
    mapData.value = {
      mapType: 'china',
      data: allMapData
    }
    
    // 刷新其他图表数据以反映省份筛选（错误处理情况）
    console.log('刷新其他图表数据以反映省份筛选（错误处理）')
    await dashboardStore.refreshAll()
    
    currentProvince.value = province
    mapLoading.value = false
  }
}

// 更新地图显示所有市级数据
const updateMapWithAllCityData = async (cityData) => {
  console.log('=== 更新地图显示所有市级数据 ===')
  console.log('市级数据:', cityData)
  
  try {
    // 加载中国地图
    await loadChinaMap()
    
    // 构建地图数据，包含所有市级数据
    const allMapData = cityData.map(item => ({
      name: item.name,
      value: item.value,
      selected: false,
      itemStyle: undefined
    }))
    
    mapData.value = {
      mapType: 'china',
      data: allMapData
    }
    
    // 设置为市级视图模式
    currentProvince.value = 'all-cities'
    
    console.log('地图数据更新完成，共', allMapData.length, '个城市')
    
  } catch (error) {
    console.error('更新地图显示失败:', error)
  }
}

// 处理地图点击事件
const handleMapClick = (params) => {
  console.log('=== 地图点击事件开始 ===')
  console.log('接收到的参数:', params)
  console.log('当前省份状态:', currentProvince.value)
  console.log('当前表格数据:', tableData.value)
  
  const clickedRegion = params.value
  console.log('点击的区域:', clickedRegion)
  
  if (!currentProvince.value) {
    // 当前是全国地图，点击省份时加载该省的城市数据
    console.log('全国地图模式，点击省份:', clickedRegion)
    if (clickedRegion) {
      console.log('开始加载省份数据:', clickedRegion)
      selectedProvince.value = clickedRegion // 更新选中省份
      console.log('设置selectedProvince为:', selectedProvince.value)
      loadCityDistribution(clickedRegion)
    }
  } else {
    // 当前是省份地图，判断点击的是省份还是城市
    console.log('省份地图模式，当前省份:', currentProvince.value, '点击区域:', clickedRegion)
    
    // 如果点击的是其他省份，切换到该省份的城市数据
    if (clickedRegion && clickedRegion !== currentProvince.value && !clickedRegion.includes('市') && !clickedRegion.includes('县')) {
      console.log('点击了其他省份，切换到:', clickedRegion)
      selectedProvince.value = clickedRegion // 更新选中省份
      loadCityDistribution(clickedRegion)
    } else if (clickedRegion && (clickedRegion.includes('市') || clickedRegion.includes('县'))) {
      // 如果点击的是城市，显示城市详情
      console.log('点击了城市:', clickedRegion)
      ElMessage.info(`点击了城市: ${clickedRegion}`)
    } else {
      // 其他情况，显示提示
      console.log('点击了当前省份或其他区域:', clickedRegion)
      ElMessage.info(`当前查看: ${currentProvince.value}`)
    }
  }
  console.log('=== 地图点击事件结束 ===')
}

// 重置地图状态到初始状态
const resetMapState = async () => {
  console.log('重置地图状态到初始状态')
  
  // 重置地图相关状态
  currentProvince.value = null
  selectedProvince.value = null
  provinceData.value = []
  cityData.value = []
  tableData.value = []
  
  // 清除地图相关的筛选条件
  dashboardStore.filters.hometown = ''
  
  // 重新加载全国地图数据
  await loadChinaMapData()
  
  console.log('地图状态重置完成')
}

// 返回全国地图
const backToChina = async () => {
  currentProvince.value = null
  selectedProvince.value = null // 清除选中省份
  
  // 清除省份筛选条件
  dashboardStore.filters.hometown = ''
  console.log('清除省份筛选条件，返回全国视图')
  
  // 重新加载全国地图数据
  await loadChinaMapData()
  
  // 刷新其他图表数据以显示全国数据
  console.log('刷新其他图表数据以显示全国数据')
  await dashboardStore.refreshAll()
}

// 组件挂载时初始化数据
onMounted(async () => {
  try {
    await dashboardStore.fetchFilterOptions()
    if (activeTab.value === 'overview') {
      await Promise.all([
        dashboardStore.refreshAll(),
        fetchDepartmentTransferData(),
        loadChinaMapData() // 在总看板页面也加载地图数据
      ])
    } else if (activeTab.value === 'turnover') {
      await loadTurnoverData()
    } else if (activeTab.value === 'archive') {
      await loadEmployeeList()
    }

    // 标记初始化完成，允许watch监听器工作
    isInitialized.value = true
  } catch (error) {
    ElMessage.error('初始化数据失败')
    // 即使出错也要标记初始化完成
    isInitialized.value = true
  }
})
</script>

<style scoped>
.dashboard {
  padding: 6px 16px 16px 16px;
  /* 进一步减少padding，让布局更紧凑 */
  background: white;
  min-height: 100vh;
}

/* 页面切换标签样式 */
.page-tabs {
  margin-bottom: 8px;
}

.dashboard-tabs {
  background: white;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.dashboard-tabs :deep(.el-tabs__header) {
  margin: 0;
  border-bottom: none;
}

.dashboard-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
  display: flex;
  justify-content: center;
  width: 100%;
}

.dashboard-tabs :deep(.el-tabs__nav) {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.dashboard-tabs :deep(.el-tabs__item) {
  padding: 8px 20px;
  font-weight: 600;
  font-size: 14px;
  border-radius: 12px;
  margin-right: 0;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 36px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #666;
  line-height: 1;
}

.dashboard-tabs :deep(.el-tabs__item:hover) {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.dashboard-tabs :deep(.el-tabs__item.is-active) {
  background: linear-gradient(135deg, #409eff, #36cfc9);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

.dashboard-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

/* 图表筛选状态样式 */
.chart-filters-status {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 6px 10px;
  margin: 6px 0;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.chart-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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
  gap: 4px;
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
  margin-bottom: 24px;
}

/* 统计卡片网格 - 新布局：单行7个卡片 */
.stats-single-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stats-single-row.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* 保持原有的 stats-grid 样式以兼容其他页面 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
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
  margin-bottom: 12px;
}

/* 人才流失筛选显示 - 使用与总览页面相同的样式 */
.turnover-filters-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 6px 10px;
  margin: 6px 0;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 整体主布局：左侧统计卡片+饼图，右侧高条形图 */
.dashboard-main-layout {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 左侧区域：统计卡片 + 饼图 */
.dashboard-left-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 主要内容布局：左侧(统计卡片+图表) + 右侧条形图 */
.main-content-layout {
  display: grid;
  grid-template-columns: 70% 30%; /* 左侧70%，右侧30% */
  gap: 8px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  align-items: start; /* 顶部对齐 */
}

/* 左侧列 */
.main-content-left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 统计卡片区域 - 现在是左侧列的一部分 */
.stats-section {
  width: 100%;
  display: block;
}

/* 左侧图表区域：饼图和地图 */
.charts-left-area {
  display: grid;
  grid-template-columns: 1fr 2fr; /* 饼图列:地图列 = 1:2 */
  gap: 8px;
  height: 500px;
}

/* 右侧条形图区域 */
.charts-right-area {
  display: flex;
  flex-direction: column;
  align-self: stretch; /* 让右侧区域自动匹配左侧区域的高度 */
}

.charts-right-area > * {
  height: 100%;
  width: 100%;
  flex: 1;
}

/* 保持原有的charts-main-section样式以兼容其他代码 */
.charts-main-section {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 400px;
  margin-top: 0;
}

/* 保持原有的charts-middle-section样式以兼容其他代码 */
.charts-middle-section {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 500px;
}

/* 左列：司龄分布和学历分布（上下排列） */
.charts-left-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.charts-left-column > * {
  height: calc(50% - 4px); /* 每个饼图占一半高度，减去间隙 */
  min-height: 240px; /* 确保最小高度 */
  flex: 1;
}

/* 中列：地图（占据整个高度） */
.charts-center-column {
  display: flex;
  flex-direction: column;
}

.charts-center-column > * {
  height: 100%;
  width: 100%;
  flex: 1;
}

/* 右列：人员异动图 */
.charts-right-column {
  display: flex;
  flex-direction: column;
}

.charts-right-column > * {
  height: 100%;
  width: 100%;
  flex: 1;
}

/* 饼图区域 */
.charts-pie-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.charts-pie-section > * {
  height: 300px;
}

/* 右侧条形图区域 - 高度覆盖整个左侧区域 */
.dashboard-right-section {
  display: flex;
}

.dashboard-right-section > * {
  width: 100%;
  /* 动态计算高度：统计卡片区域(120px) + 间隙(8px) + 饼图区域(300px) = 428px */
  min-height: 428px;
}

/* 底部图表区域 - 独立于主内容布局，占满整个容器宽度 */
.charts-bottom-section {
  margin-top: 8px;
  position: relative;
  z-index: 2; /* 确保底部图表在右侧图表之上 */
  width: 100%; /* 确保图表卡片占满整个宽度 */
  clear: both; /* 清除浮动，确保独立于上方布局 */
  display: block; /* 确保是块级元素 */
  margin-left: 0; /* 确保没有左边距 */
  margin-right: 0; /* 确保没有右边距 */
  padding-left: 0; /* 确保没有左内边距 */
  padding-right: 0; /* 确保没有右内边距 */
}

.charts-bottom-section > * {
  height: 240px;
  width: 100%; /* 确保图表卡片占满整个宽度 */
}

/* 占位卡片样式 */
.placeholder-card {
  height: 100px;
  border-radius: 12px;
  background: transparent;
}

/* 底部图表行：全宽条形图 */
.charts-bottom-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: 100%; /* 确保占满整个宽度 */
  max-width: 100%; /* 防止超出容器宽度 */
  margin-left: 0; /* 确保没有左边距 */
  margin-right: 0; /* 确保没有右边距 */
  padding-left: 0; /* 确保没有左内边距 */
  padding-right: 0; /* 确保没有右内边距 */
}

.charts-bottom-row > * {
  height: 240px;
  width: 100%; /* 确保图表卡片占满整个宽度 */
  max-width: 100%; /* 防止超出容器宽度 */
  margin-left: 0; /* 确保没有左边距 */
  margin-right: 0; /* 确保没有右边距 */
}

/* 保持原有的底部图表行样式 */
.charts-bottom-row-old {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.charts-bottom-row > * {
  height: 400px;
}

/* 人才流失分析网格布局 */
.turnover-grid-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 第一行：总离职人数和离职率卡片（占左边两列） */
.turnover-top-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

/* 第二行：三列布局（左侧两个饼图垂直排列，中间词云图，右侧各部门离职人数） */
.turnover-main-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  height: 500px; /* 调整高度与左侧内容对齐 */
}

/* 左侧列：两个饼图垂直排列 */
.turnover-left-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 中间列：词云图 */
.turnover-middle-column {
  display: flex;
  flex-direction: column;
  height: 100%; /* 确保占满父容器高度 */
}

/* 右侧列：各部门离职人数 */
.turnover-right-column {
  display: flex;
  flex-direction: column;
  height: 100%; /* 确保占满父容器高度 */
  align-self: stretch; /* 让右侧区域自动匹配左侧区域的高度 */
}

.turnover-right-column > * {
  height: 100%;
  width: 100%;
  flex: 1;
}

/* 第三行：各岗位离职人数（全宽） */
.turnover-bottom-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

/* 卡片通用样式 */
.turnover-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%; /* 确保卡片占满父容器高度 */
}

/* 各部门离职人数区域 */
.turnover-department-stats {
  height: 100%;
  padding: 0 !important;
  margin: 0 !important;
}

.turnover-department-stats > * {
  width: 100%;
  height: 100%;
}

/* 词云图区域 */
.turnover-reason-wordcloud {
  height: 100%;
}

.turnover-reason-wordcloud > * {
  width: 100%;
  height: 100%;
  min-height: 500px; /* 设置最小高度确保词云图能够正常显示 */
}

/* 各岗位离职人数区域 */
.turnover-position-bar > * {
  width: 100%;
  height: 300px;
}

/* 饼图区域 */
.turnover-department-pie,
.turnover-tenure-pie {
  height: calc(50% - 4px); /* 减去间隔的一半 */
}

.turnover-department-pie > *,
.turnover-tenure-pie > * {
  height: 100%;
}

/* 加载状态 */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* 已移除人才流失底部图表区域，整合到右侧列中 */

/* 保持原有样式以兼容其他页面 */
.charts-main-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.charts-main-row>* {
  height: 280px;
}

.charts-detail-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.charts-detail-row>* {
  height: 280px;
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .stats-single-row {
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }
  
  /* 确保底部图表在所有屏幕尺寸下都占满宽度 */
  .charts-bottom-section {
    width: 100%;
    max-width: 100%;
  }
  
  .charts-bottom-row {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 1400px) {
  .stats-single-row {
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }

  .main-content-layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .charts-left-area {
    grid-template-columns: 1fr 1fr;
    height: 300px;
  }
  
  .charts-right-area {
    height: 300px;
  }

  .charts-main-section,
  .charts-middle-section {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    height: 500px;
  }
  }

  .charts-main-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  /* 人才流失分析响应式 */
  .turnover-top-row {
    grid-template-columns: 1fr 1fr 1fr;
  }
  
  .turnover-main-content {
    grid-template-columns: 1fr 1fr 1fr;
    height: auto;
  }
  
  /* 确保左侧列的两个饼图始终垂直排列 */
  .turnover-left-column {
    flex-direction: column;
    gap: 8px;
  }
  
  .turnover-department-pie,
  .turnover-tenure-pie {
    height: calc(50% - 4px);
    width: 100%;
  }

@media (max-width: 1200px) {
  .stats-single-row {
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }

  .main-content-layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .charts-left-area {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .charts-right-area {
    height: 300px;
  }

  .charts-main-section,
  .charts-middle-section {
    grid-template-columns: 1fr;
    gap: 8px;
    height: auto;
  }
  
  .charts-left-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .charts-left-column > * {
    height: 300px;
  }
  
  .charts-center-column > *,
  .charts-right-column > * {
    height: 300px;
  }

  /* 人才流失分析响应式 */
  .turnover-top-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .turnover-empty-space {
    display: none;
  }
  
  .turnover-main-content {
    grid-template-columns: 1fr;
    gap: 8px;
    height: auto;
  }
  
  .turnover-left-column {
    flex-direction: column;
    gap: 8px;
  }
  
  .turnover-department-pie,
  .turnover-tenure-pie {
    height: 300px;
    width: 100%;
  }
  
  .turnover-bottom-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .turnover-position-bar > * {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 8px;
  }

  .stats-single-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .charts-middle-section {
    grid-template-columns: 1fr;
    gap: 8px;
    height: auto;
  }

  .charts-left-column {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .charts-left-column > *,
  .charts-center-column > *,
  .charts-right-column > * {
    height: 280px;
  }

  /* 人才流失分析移动端响应式 */
  .turnover-top-layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .turnover-middle-layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .turnover-pie-section {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .turnover-wordcloud-section > * {
    min-height: 400px;
  }

  .turnover-stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .charts-main-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .secondary-stat-card {
    padding: 10px 8px;
    min-height: 70px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 8px;
    background: #f5f7fa;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .charts-main-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .charts-main-row>* {
    height: 280px;
  }

  .charts-detail-row>* {
    height: 280px;
  }
}

/* 户籍地分析样式 */
.household-content {
  padding: 16px;
  background: white;
  min-height: calc(100vh - 200px);
  position: relative;
}


/* 悬浮数据表格样式 */
.floating-data-table {
  position: absolute;
  top: 32px;
  left: 16px;
  width: 420px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  z-index: 1000;
}

.floating-data-table .table-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.floating-data-table .table-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.floating-data-table .header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.floating-data-table .table-content {
  background: white;
  border-radius: 0 0 8px 8px;
  overflow: visible; /* 确保tooltip可以正常显示 */
}

.floating-data-table .el-table {
  background: transparent;
  z-index: 1001; /* 确保表格在正确的层级 */
}

.floating-data-table .el-table th {
  background: rgba(245, 247, 250, 0.8);
  color: #606266;
  font-weight: 600;
}

.floating-data-table .el-table td {
  background: rgba(255, 255, 255, 0.9);
}

/* 修复tooltip定位问题 */
.floating-data-table .el-tooltip__popper {
  z-index: 2000 !important;
  max-width: 300px;
  position: fixed !important;
}

/* 强制修复tooltip定位 */
.floating-data-table .el-table .el-tooltip__popper {
  position: fixed !important;
  z-index: 9999 !important;
  transform: none !important;
}

/* 确保tooltip容器不会影响定位 */
.floating-data-table .el-table__body-wrapper {
  overflow: visible !important;
}

.floating-data-table .el-table__body {
  overflow: visible !important;
}

/* 自定义tooltip样式 */
.address-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

/* 强制修复tooltip换行 */
.custom-tooltip {
  max-width: 300px !important;
  z-index: 9999 !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  line-height: 1.4 !important;
}

.custom-tooltip .el-tooltip__popper {
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  line-height: 1.4 !important;
  max-width: 300px !important;
}

/* 全局tooltip样式修复 */
.el-tooltip__popper.custom-tooltip {
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  line-height: 1.4 !important;
  max-width: 300px !important;
}

.map-container {
  margin-top: 16px;
  height: calc(100vh - 120px);
  min-height: 750px;
  width: 100%;
}

</style>