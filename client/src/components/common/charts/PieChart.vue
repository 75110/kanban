<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-actions">
        <el-dropdown @command="handleExportCommand" :disabled="isEmpty">
          <el-button
            size="small"
            type="text"
            :disabled="isEmpty"
            :loading="isExporting"
          >
            <el-icon><Download /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="png">导出PNG图片</el-dropdown-item>
              <el-dropdown-item command="jpg">导出JPG图片</el-dropdown-item>
              <el-dropdown-item command="svg">导出SVG矢量图</el-dropdown-item>
              <el-dropdown-item command="pdf" divided>导出PDF文档</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-tooltip content="全屏查看" placement="top">
          <el-button
            size="small"
            type="text"
            @click="toggleFullscreen"
            :disabled="isEmpty"
          >
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <div class="chart-content">
      <v-chart
        ref="chartRef"
        :key="chartKey"
        :option="chartOption"
        :update-options="{ notMerge: true, lazyUpdate: false }"
        :init-options="{ devicePixelRatio: 1, renderer: 'canvas' }"
        autoresize
        @click="handleChartClick"
      />

      <!-- 加载遮罩层 -->
      <div v-if="showLoadingOverlay" class="loading-overlay">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span style="margin-left: 8px;">更新中...</span>
      </div>

      <!-- 空数据遮罩层 -->
      <div v-else-if="isEmpty" class="empty-overlay">
        <el-icon class="empty-icon"><DocumentRemove /></el-icon>
        <div class="empty-text">暂无数据</div>
      </div>
    </div>
  </div>

  <!-- 全屏模态框 -->
  <el-dialog
    v-model="isFullscreen"
    :title="title"
    width="90%"
    top="5vh"
    :show-close="true"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    class="fullscreen-chart-dialog"
    @opened="onFullscreenOpened"
    @closed="onFullscreenClosed"
  >
    <div class="fullscreen-chart-container">
      <div class="fullscreen-chart-actions">
        <el-dropdown @command="handleFullscreenExportCommand">
          <el-button
            size="small"
            type="primary"
            :loading="isExporting"
          >
            <el-icon><Download /></el-icon>
            导出图片
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="png">导出PNG图片</el-dropdown-item>
              <el-dropdown-item command="jpg">导出JPG图片</el-dropdown-item>
              <el-dropdown-item command="svg">导出SVG矢量图</el-dropdown-item>
              <el-dropdown-item command="pdf" divided>导出PDF文档</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="fullscreen-chart-content">
        <v-chart
          ref="fullscreenChartRef"
          :option="fullscreenChartOption"
          :update-options="{ notMerge: true, lazyUpdate: false }"
          :init-options="{ devicePixelRatio: 1, renderer: 'canvas' }"
          autoresize
          @click="handleChartClick"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, watch, ref, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Loading, DocumentRemove, Download, FullScreen, ArrowDown } from '@element-plus/icons-vue'

// 注册ECharts组件
use([
  SVGRenderer,
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: () => ({ labels: [], values: [] })
  },
  loading: {
    type: Boolean,
    default: false
  },
  pieStyle: {
    type: String,
    default: 'donut', // 'donut' 环形, 'solid' 实心
    validator: (value) => ['donut', 'solid'].includes(value)
  },
  chartType: {
    type: String,
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['chart-click'])

// 处理图表点击事件
const handleChartClick = (params) => {
  console.log('饼图点击:', props.title, params)

  if (!params || !props.chartType) {
    console.log('点击参数无效:', { params, chartType: props.chartType })
    return
  }

  const clickedValue = params.name

  if (clickedValue) {
    const eventData = {
      type: props.chartType,
      value: clickedValue,
      data: params
    }
    console.log('✅ 发送饼图点击事件:', eventData)
    emit('chart-click', eventData)
  } else {
    console.log('❌ 无法获取饼图点击值:', params)
  }
}

// 延迟的加载遮罩，避免轻微抖动造成闪一下
const showLoadingOverlay = ref(false)
let overlayTimer = null
const chartKey = ref(0)

// 图表引用
const chartRef = ref(null)
const fullscreenChartRef = ref(null)

// 全屏状态
const isFullscreen = ref(false)
const isExporting = ref(false)

// 获取图表Canvas元素的通用方法
const getChartCanvas = (chartRef) => {
  if (!chartRef) return null

  const chartElement = chartRef.$el || chartRef
  if (chartElement) {
    const canvas = chartElement.querySelector('canvas')
    if (canvas) {
      return canvas
    }
  }

  return null
}

// 获取ECharts实例的通用方法
const getChartInstance = (chartRef) => {
  if (!chartRef) return null

  if (typeof chartRef.getEchartsInstance === 'function') {
    return chartRef.getEchartsInstance()
  }

  if (chartRef.chart) {
    return chartRef.chart
  }

  if (chartRef.$refs && chartRef.$refs.chart) {
    return chartRef.$refs.chart
  }

  if (chartRef.$el && chartRef.$el.__echarts_instance__) {
    return chartRef.$el.__echarts_instance__
  }

  const element = chartRef.$el || chartRef
  if (element && element.__echarts_instance__) {
    return element.__echarts_instance__
  }

  return null
}

watch(() => props.loading, (val) => {
  if (val) {
    overlayTimer && clearTimeout(overlayTimer)
    overlayTimer = setTimeout(() => {
      showLoadingOverlay.value = true
    }, 200)
  } else {
    overlayTimer && clearTimeout(overlayTimer)
    showLoadingOverlay.value = false
  }
})

// 监听数据变化，强制重新渲染图表
watch(() => props.data, (newData, oldData) => {
  if (newData && oldData && JSON.stringify(newData) !== JSON.stringify(oldData)) {
    chartKey.value++
  }
}, { deep: true })

onBeforeUnmount(() => {
  overlayTimer && clearTimeout(overlayTimer)
})

// 处理导出命令
const handleExportCommand = (command) => {
  switch (command) {
    case 'png':
      exportChart('png')
      break
    case 'jpg':
      exportChart('jpg')
      break
    case 'svg':
      exportChart('svg')
      break
    case 'pdf':
      exportChartAsPDF()
      break
    default:
      exportChart('png')
  }
}

// 导出图表
const exportChart = async (format = 'png') => {
  if (!chartRef.value) {
    ElMessage.error('图表未加载完成，请稍后重试')
    return
  }

  isExporting.value = true
  try {
    await nextTick()

    let url, fileName

    if (format === 'svg') {
      const chart = getChartInstance(chartRef.value)
      if (!chart) {
        throw new Error('无法获取图表实例')
      }
      url = chart.getDataURL({
        type: 'svg',
        backgroundColor: '#fff'
      })
      fileName = `${props.title}.svg`
    } else {
      const canvas = getChartCanvas(chartRef.value)
      if (!canvas) {
        throw new Error('无法获取图表Canvas')
      }

      if (format === 'jpg') {
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height

        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.drawImage(canvas, 0, 0)

        url = tempCanvas.toDataURL(`image/${format}`, 0.9)
      } else {
        url = canvas.toDataURL(`image/${format}`)
      }

      fileName = `${props.title}.${format}`
    }

    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.click()

    ElMessage.success(`饼图已导出为${format.toUpperCase()}格式`)
  } catch (error) {
    console.error('导出饼图失败:', error)
    ElMessage.error(`导出饼图失败：${error.message || '请重试'}`)
  } finally {
    isExporting.value = false
  }
}

// 导出为PDF
const exportChartAsPDF = async () => {
  if (!chartRef.value) {
    ElMessage.error('图表未加载完成，请稍后重试')
    return
  }

  isExporting.value = true
  try {
    await nextTick()

    const { jsPDF } = await import('jspdf')
    const canvas = getChartCanvas(chartRef.value)
    if (!canvas) {
      throw new Error('无法获取图表Canvas')
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const finalHeight = Math.min(imgHeight, pdfHeight - 40)
    const finalWidth = (canvas.width * finalHeight) / canvas.height

    const titleCanvas = document.createElement('canvas')
    const titleCtx = titleCanvas.getContext('2d')
    titleCanvas.width = 800
    titleCanvas.height = 60
    titleCtx.fillStyle = '#ffffff'
    titleCtx.fillRect(0, 0, titleCanvas.width, titleCanvas.height)
    titleCtx.fillStyle = '#000000'
    titleCtx.font = '24px Arial, "Microsoft YaHei", "SimHei", sans-serif'
    titleCtx.textAlign = 'left'
    titleCtx.fillText(props.title, 10, 35)

    pdf.addImage(
      titleCanvas.toDataURL('image/png'),
      'PNG',
      10,
      5,
      100,
      10
    )

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      (pdfWidth - finalWidth) / 2,
      25,
      finalWidth,
      finalHeight
    )

    pdf.save(`${props.title}.pdf`)

    ElMessage.success('饼图已导出为PDF格式')
  } catch (error) {
    console.error('导出饼图PDF失败:', error)
    ElMessage.error(`导出饼图PDF失败：${error.message || '请重试'}`)
  } finally {
    isExporting.value = false
  }
}

// 处理全屏导出命令
const handleFullscreenExportCommand = (command) => {
  switch (command) {
    case 'png':
      exportFullscreenChart('png')
      break
    case 'jpg':
      exportFullscreenChart('jpg')
      break
    case 'svg':
      exportFullscreenChart('svg')
      break
    case 'pdf':
      exportFullscreenChartAsPDF()
      break
    default:
      exportFullscreenChart('png')
  }
}

// 导出全屏图表
const exportFullscreenChart = async (format = 'png') => {
  if (!fullscreenChartRef.value) {
    ElMessage.error('全屏图表未加载完成，请稍后重试')
    return
  }

  isExporting.value = true
  try {
    await nextTick()

    let url, fileName

    if (format === 'svg') {
      const chart = getChartInstance(fullscreenChartRef.value)
      if (!chart) {
        throw new Error('无法获取全屏图表实例')
      }
      url = chart.getDataURL({
        type: 'svg',
        backgroundColor: '#fff'
      })
      fileName = `${props.title}_全屏.svg`
    } else {
      const canvas = getChartCanvas(fullscreenChartRef.value)
      if (!canvas) {
        throw new Error('无法获取全屏图表Canvas')
      }

      if (format === 'jpg') {
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height

        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.drawImage(canvas, 0, 0)

        url = tempCanvas.toDataURL(`image/${format}`, 0.9)
      } else {
        url = canvas.toDataURL(`image/${format}`)
      }

      fileName = `${props.title}_全屏.${format}`
    }

    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.click()

    ElMessage.success(`全屏饼图已导出为${format.toUpperCase()}格式`)
  } catch (error) {
    console.error('导出全屏饼图失败:', error)
    ElMessage.error(`导出全屏饼图失败：${error.message || '请重试'}`)
  } finally {
    isExporting.value = false
  }
}

// 导出全屏图表为PDF
const exportFullscreenChartAsPDF = async () => {
  if (!fullscreenChartRef.value) {
    ElMessage.error('全屏图表未加载完成，请稍后重试')
    return
  }

  isExporting.value = true
  try {
    await nextTick()

    const { jsPDF } = await import('jspdf')
    const canvas = getChartCanvas(fullscreenChartRef.value)
    if (!canvas) {
      throw new Error('无法获取全屏图表Canvas')
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const finalHeight = Math.min(imgHeight, pdfHeight - 40)
    const finalWidth = (canvas.width * finalHeight) / canvas.height

    const titleCanvas = document.createElement('canvas')
    const titleCtx = titleCanvas.getContext('2d')
    titleCanvas.width = 800
    titleCanvas.height = 60
    titleCtx.fillStyle = '#ffffff'
    titleCtx.fillRect(0, 0, titleCanvas.width, titleCanvas.height)
    titleCtx.fillStyle = '#000000'
    titleCtx.font = '24px Arial, "Microsoft YaHei", "SimHei", sans-serif'
    titleCtx.textAlign = 'left'
    titleCtx.fillText(props.title + ' (全屏)', 10, 35)

    pdf.addImage(
      titleCanvas.toDataURL('image/png'),
      'PNG',
      10,
      5,
      120,
      10
    )

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      (pdfWidth - finalWidth) / 2,
      25,
      finalWidth,
      finalHeight
    )

    pdf.save(`${props.title}_全屏.pdf`)

    ElMessage.success('全屏饼图已导出为PDF格式')
  } catch (error) {
    console.error('导出全屏饼图PDF失败:', error)
    ElMessage.error(`导出全屏饼图PDF失败：${error.message || '请重试'}`)
  } finally {
    isExporting.value = false
  }
}

// 全屏查看
const toggleFullscreen = () => {
  isFullscreen.value = true
}

// 全屏模态框打开时的处理
const onFullscreenOpened = () => {
  nextTick(() => {
    if (fullscreenChartRef.value) {
      const chart = fullscreenChartRef.value.getEchartsInstance()
      chart.resize()
    }
  })
}

// 全屏模态框关闭时的处理
const onFullscreenClosed = () => {
  // 清理工作
}

// 检查是否为空数据
const isEmpty = computed(() => {
  if (!props.data) return true
  return !props.data.labels?.length || !props.data.values?.length
})

// 饼图配置
const chartOption = computed(() => {
  if (isEmpty.value || !props.data) return {}

  const { labels, values } = props.data

  return {
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      confine: true,
      hideDelay: 100,
      textStyle: {
        fontSize: 13,
        fontWeight: 500
      }
    },
    legend: {
      show: false
    },
    series: [
      {
        name: props.title,
        type: 'pie',
        radius: props.pieStyle === 'solid' ? '75%' : ['50%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: props.pieStyle === 'solid' ? 'inside' : 'outside',
          formatter: props.pieStyle === 'solid' ? '{b}\n{d}%' : '{b}: {d}%',
          fontSize: 12,
          fontWeight: 'normal',
          color: props.pieStyle === 'solid' ? '#fff' : '#333',
          overflow: 'break',
          width: 60,
          lineHeight: 14
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: props.pieStyle !== 'solid',
          length: 8,
          length2: 10,
          smooth: true
        },
        data: labels.map((label, index) => ({
          value: values[index],
          name: label,
          selected: false
        }))
      }
    ],
    color: ['#1890ff', '#40a9ff', '#69c0ff', '#91d5ff', '#bae7ff', '#e6f7ff', '#096dd9', '#0050b3']
  }
})

// 全屏图表配置
const fullscreenChartOption = computed(() => {
  if (isEmpty.value || !props.data) return {}

  const baseOption = chartOption.value
  if (!baseOption || Object.keys(baseOption).length === 0) return {}

  const fullscreenOption = JSON.parse(JSON.stringify(baseOption))

  if (fullscreenOption.title) {
    fullscreenOption.title.textStyle = {
      ...fullscreenOption.title.textStyle,
      fontSize: 20
    }
  }

  if (fullscreenOption.legend) {
    fullscreenOption.legend.textStyle = {
      ...fullscreenOption.legend.textStyle,
      fontSize: 14
    }
  }

  return fullscreenOption
})
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.chart-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-actions .el-button {
  color: #8c8c8c;
  transition: color 0.2s;
}

.chart-actions .el-button:hover {
  color: #1890ff;
}

.chart-content {
  flex: 1;
  min-height: 0;
  position: relative;
}

.chart-content .echarts {
  height: 100% !important;
  width: 100% !important;
}

/* 遮罩层样式 */
.loading-overlay,
.empty-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  z-index: 10;
  border-radius: 8px;
}

.loading-overlay {
  color: var(--text-secondary);
}

.empty-overlay {
  flex-direction: column;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

/* 全屏模态框样式 */
.fullscreen-chart-dialog {
  --el-dialog-padding-primary: 20px;
}

.fullscreen-chart-dialog .el-dialog__body {
  padding: 0 20px 20px 20px;
}

.fullscreen-chart-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.fullscreen-chart-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.fullscreen-chart-content {
  flex: 1;
  min-height: 0;
  position: relative;
}

.fullscreen-chart-content .echarts {
  height: 100% !important;
  width: 100% !important;
}
</style>