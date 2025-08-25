<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title-section">
        <div class="logo-title-container">
          <div class="logo-and-badge">
            <img src="/src/assets/images/logo.png" alt="公司Logo" class="page-logo" />
          </div>
          <div class="title-content">
            <h1 class="page-title">人事数据看板</h1>
            <p class="page-subtitle">实时监控人力资源关键指标</p>
          </div>
        </div>
      </div>
      <div class="page-actions">
        <el-dropdown @command="handleExportCommand" :disabled="isExporting">
          <el-button type="default" size="default" class="action-btn" :loading="isExporting">
            <el-icon><Download /></el-icon>
            导出报告
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pdf">导出PDF报告</el-dropdown-item>
              <el-dropdown-item command="excel">导出Excel报告</el-dropdown-item>
              <el-dropdown-item command="images" divided>导出所有图表</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="refreshData" size="default" :loading="isRefreshing" class="action-btn">
          <el-icon><Refresh /></el-icon>
          {{ isRefreshing ? '刷新中...' : '刷新数据' }}
        </el-button>
      </div>
    </div>

    <!-- 页面切换选项卡 -->
    <div class="page-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="dashboard-tabs">
        <el-tab-pane label="总数据看板" name="overview"></el-tab-pane>
        <el-tab-pane label="人才流失分析" name="turnover"></el-tab-pane>
      </el-tabs>
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

    <!-- 总数据看板内容 -->
    <div v-if="activeTab === 'overview'" class="overview-content">
      <!-- 统计卡片 - 新布局 -->
      <div class="dashboard-layout">
        <!-- 第一行：4个主要指标卡片 -->
        <div class="stats-main-row" :class="{ 'loading': isRefreshing }">
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
        </div>

        <!-- 第二行：2个比率指标卡片 -->
        <div class="stats-secondary-row" :class="{ 'loading': isRefreshing }">
          <StatCard
            title="综合异动率"
            :value="parseFloat(calculateChangeRate().toFixed(2))"
            type="info"
            :growth="getGrowthRate('changeRate')"
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
        <!-- 主要图表区域：左侧两个饼图，右侧一个高条形图 -->
        <div class="charts-main-section">
          <!-- 左侧饼图区域 -->
          <div class="charts-left-section">
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

          <!-- 右侧条形图区域 -->
          <div class="charts-right-section">
            <ChartCard
              v-if="dashboardStore.departmentChartData"
              title="各部门人员异动"
              type="bar"
              :horizontal="true"
              chart-type="department"
              :data="dashboardStore.departmentChartData"
              :loading="dashboardStore.loading.department"
              @chart-click="handleChartClick"
            />
          </div>
        </div>

        <!-- 下方行：各部门在职人数详细图表 -->
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
    </div>

    <!-- 人才流失分析内容 -->
    <div v-if="activeTab === 'turnover'" class="turnover-content">
      <!-- 人才流失分析筛选状态显示 -->
      <div v-if="hasTurnoverFilters" class="turnover-filters-display">
        <div class="chart-filters-header">
          <span class="chart-filters-title">
            <el-icon><Filter /></el-icon>
            人才流失筛选
          </span>
          <el-button
            type="text"
            size="small"
            @click="clearAllTurnoverFilters"
            class="clear-filters-btn"
          >
            <el-icon><Close /></el-icon>
            清除筛选
          </el-button>
        </div>
        <div class="chart-filters-tags">
          <el-tag
            v-if="dashboardStore.turnoverChartFilters.department"
            type="primary"
            closable
            @close="clearTurnoverFilter('department')"
          >
            部门：{{ dashboardStore.turnoverChartFilters.department }}
          </el-tag>
          <el-tag
            v-if="dashboardStore.turnoverChartFilters.reason"
            type="success"
            closable
            @close="clearTurnoverFilter('reason')"
          >
            离职原因：{{ dashboardStore.turnoverChartFilters.reason }}
          </el-tag>
          <el-tag
            v-if="dashboardStore.turnoverChartFilters.position"
            type="warning"
            closable
            @close="clearTurnoverFilter('position')"
          >
            岗位：{{ dashboardStore.turnoverChartFilters.position }}
          </el-tag>
          <el-tag
            v-if="dashboardStore.turnoverChartFilters.tenure"
            type="info"
            closable
            @close="clearTurnoverFilter('tenure')"
          >
            在职时间：{{ dashboardStore.turnoverChartFilters.tenure }}
          </el-tag>
        </div>
      </div>

      <!-- 人才流失统计卡片 -->
      <div class="dashboard-layout">
        <div class="stats-grid" :class="{ 'loading': isRefreshing }">
          <StatCard
            title="总离职人数"
            :value="turnoverStats.totalResigned || 0"
            type="danger"
            :growth="getTurnoverGrowthRate('totalResigned')"
            :growth-type="getGrowthType()"
          />

          <StatCard
            title="离职率"
            :value="parseFloat(calculateTurnoverRate().toFixed(2))"
            type="warning"
            :growth="getTurnoverGrowthRate('turnoverRate')"
            :growth-type="getGrowthType()"
            suffix="%"
          />
        </div>
      </div>

      <!-- 人才流失图表区域 -->
      <div class="charts-layout">
        <!-- 第一行：离职部门分布、在职时间分布和离职原因 -->
        <div class="charts-main-row">
          <ChartCard
            v-if="turnoverDepartmentData"
            title="离职最多的部门前5"
            type="pie"
            chart-type="resignationDepartment"
            :data="turnoverDepartmentData"
            :loading="turnoverLoading.department"
            @chart-click="handleTurnoverChartClick"
          />
          <ChartCard
            v-if="turnoverTenureData"
            title="离职人员在职时间分布"
            type="pie"
            pie-style="solid"
            chart-type="resignationTenure"
            :data="turnoverTenureData"
            :loading="turnoverLoading.tenure"
            @chart-click="handleTurnoverChartClick"
          />
          <ChartCard
            v-if="turnoverReasonData"
            title="离职原因分析"
            type="bar"
            chart-type="resignationReason"
            :data="turnoverReasonData"
            :loading="turnoverLoading.reason"
            @chart-click="handleTurnoverChartClick"
          />
        </div>

        <!-- 第二行：离职人员部门统计 -->
        <div class="charts-detail-row">
          <ChartCard
            v-if="turnoverDepartmentStatsData"
            title="离职人员的部门人数统计"
            type="bar"
            chart-type="resignationDepartmentStats"
            :data="turnoverDepartmentStatsData"
            :loading="turnoverLoading.departmentStats"
            @chart-click="handleTurnoverChartClick"
          />
        </div>

        <!-- 第三行：离职岗位分布 -->
        <div class="charts-detail-row">
          <ChartCard
            v-if="turnoverPositionData"
            title="离职岗位分布"
            type="bar"
            chart-type="resignationPosition"
            :data="turnoverPositionData"
            :loading="turnoverLoading.position"
            @chart-click="handleTurnoverChartClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, watch, ref, nextTick, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Filter, Close, ArrowDown } from '@element-plus/icons-vue'
import { useDashboardStore } from '../stores/dashboard'
import { dashboardApi } from '../api'
import FilterBar from '../components/FilterBar.vue'
import StatCard from '../components/StatCard.vue'
import ChartCard from '../components/ChartCard.vue'

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

// 人才流失加载状态
const turnoverLoading = ref({
  department: false,
  reason: false,
  departmentStats: false,
  position: false,
  tenure: false
})

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

// 处理导出命令
const handleExportCommand = (command) => {
  switch (command) {
    case 'pdf':
      exportDashboardAsPDF()
      break
    case 'excel':
      exportDashboardAsExcel()
      break
    case 'images':
      exportAllCharts()
      break
    default:
      exportDashboardAsPDF()
  }
}

// 导出仪表板为PDF
const exportDashboardAsPDF = async () => {
  if (isExporting.value) return

  isExporting.value = true
  try {
    ElMessage.info('正在生成PDF报告，请稍候...')

    // 动态导入html2canvas和jsPDF
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ])

    // 创建PDF文档
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let currentY = 20

    // 创建标题canvas来避免中文乱码
    const createTextCanvas = (text, fontSize = 24, width = 800, height = 60) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = width
      canvas.height = height
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#000000'
      ctx.font = `${fontSize}px Arial, "Microsoft YaHei", "SimHei", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + fontSize / 3)
      return canvas
    }

    // 添加标题
    const titleCanvas = createTextCanvas('人事数据看板报告', 28, 600, 80)
    pdf.addImage(
      titleCanvas.toDataURL('image/png'),
      'PNG',
      (pageWidth - 150) / 2,
      currentY - 10,
      150,
      20
    )
    currentY += 25

    // 添加生成时间
    const now = new Date()
    const dateStr = `生成时间: ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const dateCanvas = createTextCanvas(dateStr, 16, 600, 40)
    pdf.addImage(
      dateCanvas.toDataURL('image/png'),
      'PNG',
      (pageWidth - 120) / 2,
      currentY - 5,
      120,
      10
    )
    currentY += 20

    // 获取统计卡片区域
    const statsContainer = document.querySelector('.stats-grid')
    if (statsContainer) {
      try {
        const statsCanvas = await html2canvas(statsContainer, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false
        })

        // 计算统计卡片的尺寸
        const statsImgWidth = pageWidth - 20
        const statsImgHeight = (statsCanvas.height * statsImgWidth) / statsCanvas.width
        const maxStatsHeight = Math.min(statsImgHeight, 60)
        const finalStatsWidth = (statsCanvas.width * maxStatsHeight) / statsCanvas.height

        // 添加统计卡片
        pdf.addImage(
          statsCanvas.toDataURL('image/png'),
          'PNG',
          (pageWidth - finalStatsWidth) / 2,
          currentY,
          finalStatsWidth,
          maxStatsHeight
        )

        currentY += maxStatsHeight + 20
      } catch (error) {
        console.error('添加统计卡片失败:', error)
        // 如果html2canvas失败，回退到文字方式
        const statsHeaderCanvas = createTextCanvas('关键指标', 20, 400, 50)
        pdf.addImage(
          statsHeaderCanvas.toDataURL('image/png'),
          'PNG',
          20,
          currentY - 5,
          80,
          12
        )
        currentY += 15

        const stats = dashboardStore.stats
        const statsText = [
          `在职人数: ${stats.totalEmployees || 0}`,
          `入职人数: ${stats.newEmployees || 0}`,
          `离职人数: ${stats.resignedEmployees || 0}`,
          `调动人数: ${stats.transferEmployees || 0}`
        ]

        statsText.forEach(text => {
          const statCanvas = createTextCanvas(text, 14, 400, 30)
          pdf.addImage(
            statCanvas.toDataURL('image/png'),
            'PNG',
            20,
            currentY - 3,
            100,
            8
          )
          currentY += 10
        })
        currentY += 10
      }
    }

    // 获取所有图表卡片并添加到PDF
    const chartCards = document.querySelectorAll('.chart-container')
    let chartIndex = 0

    for (const chartCard of chartCards) {
      if (currentY > pageHeight - 100) {
        pdf.addPage()
        currentY = 20
      }

      try {
        // 使用html2canvas截取整个图表卡片（包括标题和图表）
        const cardCanvas = await html2canvas(chartCard, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: chartCard.offsetWidth,
          height: chartCard.offsetHeight
        })

        // 计算图表卡片的尺寸
        const cardImgWidth = pageWidth - 20
        const cardImgHeight = (cardCanvas.height * cardImgWidth) / cardCanvas.width
        const maxCardHeight = Math.min(cardImgHeight, 120)
        const finalCardWidth = (cardCanvas.width * maxCardHeight) / cardCanvas.height

        // 添加图表卡片
        pdf.addImage(
          cardCanvas.toDataURL('image/png'),
          'PNG',
          (pageWidth - finalCardWidth) / 2,
          currentY,
          finalCardWidth,
          maxCardHeight
        )

        currentY += maxCardHeight + 15
        chartIndex++
      } catch (error) {
        console.error('添加图表卡片失败:', error)
        // 如果html2canvas失败，尝试只添加图表部分
        try {
          const chartElement = chartCard.querySelector('.echarts')
          if (chartElement && chartElement.__echarts_instance__) {
            const canvas = chartElement.__echarts_instance__.getRenderedCanvas({
              pixelRatio: 2,
              backgroundColor: '#fff'
            })

            const chartTitle = chartCard.querySelector('.chart-title')?.textContent || `图表 ${chartIndex + 1}`
            const chartTitleCanvas = createTextCanvas(chartTitle, 18, 500, 40)
            pdf.addImage(
              chartTitleCanvas.toDataURL('image/png'),
              'PNG',
              20,
              currentY - 5,
              120,
              10
            )
            currentY += 15

            const imgWidth = pageWidth - 40
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            const maxHeight = Math.min(imgHeight, 80)
            const finalWidth = (canvas.width * maxHeight) / canvas.height

            pdf.addImage(
              canvas.toDataURL('image/png'),
              'PNG',
              (pageWidth - finalWidth) / 2,
              currentY,
              finalWidth,
              maxHeight
            )

            currentY += maxHeight + 15
            chartIndex++
          }
        } catch (fallbackError) {
          console.error('回退方案也失败:', fallbackError)
        }
      }
    }

    // 保存PDF
    const fileName = `人事数据看板报告_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.pdf`
    pdf.save(fileName)

    ElMessage.success('PDF报告导出成功')
  } catch (error) {
    console.error('导出PDF失败:', error)
    ElMessage.error('导出PDF失败，请重试')
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

    // 添加统计数据工作表
    const stats = dashboardStore.stats
    const statsData = [
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
    const now = new Date()
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
  dashboardStore.refreshAll()
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
    await dashboardStore.refreshAll()
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
            await dashboardStore.refreshAll()
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

// 组件挂载时初始化数据
onMounted(async () => {
  try {
    await dashboardStore.fetchFilterOptions()
    if (activeTab.value === 'overview') {
      await dashboardStore.refreshAll()
    } else if (activeTab.value === 'turnover') {
      await loadTurnoverData()
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
  padding: 16px 32px 32px 32px; /* 减少顶部padding，保持其他方向 */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* 页面切换标签样式 */
.page-tabs {
  margin-bottom: 24px;
}

.dashboard-tabs {
  background: white;
  border-radius: 16px;
  padding: 12px;
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
  gap: 12px;
  justify-content: center;
  align-items: center;
}

.dashboard-tabs :deep(.el-tabs__item) {
  padding: 16px 36px;
  font-weight: 600;
  font-size: 15px;
  border-radius: 12px;
  margin-right: 0;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  height: 48px;
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-title-section {
  flex: 1;
}

.logo-title-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-and-badge {
  position: relative;
  display: flex;
  align-items: center;
}

.page-logo {
  width: 280px;
  height: 56px;
  object-fit: contain;
  object-position: left center;
  border-radius: 8px;
  background: transparent;
  mix-blend-mode: multiply;
  filter: contrast(1.2) brightness(1.1);
}



.title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #262626;
  margin: 0;
  background: linear-gradient(135deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 16px;
  color: #8c8c8c;
  margin: 0;
  font-weight: 400;
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

/* 统计卡片网格 - 新布局 */
.stats-main-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stats-secondary-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 40px;
  max-width: 600px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stats-main-row.loading,
.stats-secondary-row.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* 保持原有的 stats-grid 样式以兼容其他页面 */
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

/* 人才流失筛选显示 - 使用与总览页面相同的样式 */
.turnover-filters-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px 20px;
  margin: 16px 0;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 主要图表区域：左侧两个饼图，右侧一个高条形图 */
.charts-main-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 左侧饼图区域 */
.charts-left-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.charts-left-section > * {
  height: 400px;
}

/* 右侧条形图区域 - 高度与左侧整体对齐 */
.charts-right-section {
  display: flex;
}

.charts-right-section > * {
  height: 832px; /* 400px * 2 + 32px gap */
  width: 100%;
}

/* 底部图表行：全宽条形图 */
.charts-bottom-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.charts-bottom-row > * {
  height: 400px;
}

/* 保持原有样式以兼容其他页面 */
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
  .stats-main-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .stats-secondary-row {
    max-width: 500px;
  }
}

@media (max-width: 1400px) {
  .stats-main-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .stats-secondary-row {
    grid-template-columns: repeat(2, 1fr);
    max-width: 400px;
  }

  .charts-main-section {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .charts-left-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .charts-right-section > * {
    height: 400px;
  }

  .charts-main-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 1200px) {
  .stats-main-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stats-secondary-row {
    grid-template-columns: repeat(2, 1fr);
    max-width: 100%;
  }

  .charts-main-section {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .charts-left-section {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .charts-right-section > * {
    height: 400px;
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

  .stats-main-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stats-secondary-row {
    grid-template-columns: 1fr;
    max-width: 100%;
  }

  .charts-main-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .charts-left-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .charts-right-section > * {
    height: 400px;
  }

  .charts-main-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
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
</style>
