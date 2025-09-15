<template>
  <div class="chart-container" :class="containerClass">
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
      <!-- 图表内容插槽 -->
      <slot 
        name="chart" 
        :chart-option="chartOption"
        :chart-key="chartKey"
        :handle-chart-click="handleChartClick"
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
        <!-- 全屏图表内容插槽 -->
        <slot 
          name="fullscreen-chart" 
          :chart-option="fullscreenChartOption"
          :handle-chart-click="handleChartClick"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, watch, ref, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, DocumentRemove, Download, FullScreen, ArrowDown } from '@element-plus/icons-vue'

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
  containerClass: {
    type: String,
    default: ''
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
  console.log('图表点击:', props.title, params)

  if (!params || !props.chartType) {
    console.log('点击参数无效:', { params, chartType: props.chartType })
    return
  }

  // 获取点击的值，对于不同类型的图表，参数结构可能不同
  let clickedValue = null

  // 通用的点击值提取逻辑
  if (params.name) {
    clickedValue = params.name
  } else if (params.axisValue) {
    clickedValue = params.axisValue
  }

  if (clickedValue) {
    const eventData = {
      type: props.chartType,
      value: clickedValue,
      data: params
    }
    console.log('✅ 发送点击事件:', eventData)
    emit('chart-click', eventData)
  } else {
    console.log('❌ 无法获取点击值:', params)
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

  // 尝试从vue-echarts组件获取canvas
  const chartElement = chartRef.$el || chartRef
  if (chartElement) {
    // 查找canvas元素
    const canvas = chartElement.querySelector('canvas')
    if (canvas) {
      return canvas
    }
  }

  return null
}

// 获取ECharts实例的通用方法（用于PDF导出时获取渲染的canvas）
const getChartInstance = (chartRef) => {
  if (!chartRef) return null

  // 尝试多种方式获取ECharts实例
  if (typeof chartRef.getEchartsInstance === 'function') {
    return chartRef.getEchartsInstance()
  }

  // 尝试直接访问chart属性
  if (chartRef.chart) {
    return chartRef.chart
  }

  // 尝试访问$refs.chart
  if (chartRef.$refs && chartRef.$refs.chart) {
    return chartRef.$refs.chart
  }

  // 尝试访问内部的echarts实例
  if (chartRef.$el && chartRef.$el.__echarts_instance__) {
    return chartRef.$el.__echarts_instance__
  }

  // 最后尝试从DOM元素获取
  const element = chartRef.$el || chartRef
  if (element && element.__echarts_instance__) {
    return element.__echarts_instance__
  }

  return null
}

watch(() => props.loading, (val) => {
  if (val) {
    // 200ms 后再显示遮罩，短暂加载不显示
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
    // 通过改变key强制重新渲染图表组件
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
    // 等待图表完全渲染
    await nextTick()

    let url, fileName

    if (format === 'svg') {
      // SVG导出需要通过ECharts实例
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
      // PNG/JPG导出直接从canvas获取
      const canvas = getChartCanvas(chartRef.value)
      if (!canvas) {
        throw new Error('无法获取图表Canvas')
      }

      // 如果是JPG格式，需要先在白色背景上绘制
      if (format === 'jpg') {
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height

        // 填充白色背景
        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

        // 绘制原图表
        tempCtx.drawImage(canvas, 0, 0)

        url = tempCanvas.toDataURL(`image/${format}`, 0.9)
      } else {
        url = canvas.toDataURL(`image/${format}`)
      }

      fileName = `${props.title}.${format}`
    }

    // 创建下载链接
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.click()

    // 显示成功消息
    ElMessage.success(`图表已导出为${format.toUpperCase()}格式`)
  } catch (error) {
    console.error('导出图表失败:', error)
    ElMessage.error(`导出图表失败：${error.message || '请重试'}`)
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
    // 等待图表完全渲染
    await nextTick()

    // 动态导入jsPDF
    const { jsPDF } = await import('jspdf')

    // 获取图表Canvas
    const canvas = getChartCanvas(chartRef.value)
    if (!canvas) {
      throw new Error('无法获取图表Canvas')
    }

    // 创建PDF，使用UTF-8编码
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    })

    // 计算图片尺寸以适应PDF页面
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth - 20 // 留出边距
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 如果图片高度超过页面高度，则调整尺寸
    const finalHeight = Math.min(imgHeight, pdfHeight - 40)
    const finalWidth = (canvas.width * finalHeight) / canvas.height

    // 添加标题 - 使用图片方式避免中文乱码
    pdf.setFontSize(16)

    // 创建一个临时canvas来渲染中文标题
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

    // 将标题作为图片添加到PDF
    pdf.addImage(
      titleCanvas.toDataURL('image/png'),
      'PNG',
      10,
      5,
      100,
      10
    )

    // 添加图片
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      (pdfWidth - finalWidth) / 2,
      25,
      finalWidth,
      finalHeight
    )

    // 保存PDF
    pdf.save(`${props.title}.pdf`)

    ElMessage.success('图表已导出为PDF格式')
  } catch (error) {
    console.error('导出PDF失败:', error)
    ElMessage.error(`导出PDF失败：${error.message || '请重试'}`)
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
    // 等待图表完全渲染
    await nextTick()

    let url, fileName

    if (format === 'svg') {
      // SVG导出需要通过ECharts实例
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
      // PNG/JPG导出直接从canvas获取
      const canvas = getChartCanvas(fullscreenChartRef.value)
      if (!canvas) {
        throw new Error('无法获取全屏图表Canvas')
      }

      // 如果是JPG格式，需要先在白色背景上绘制
      if (format === 'jpg') {
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height

        // 填充白色背景
        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

        // 绘制原图表
        tempCtx.drawImage(canvas, 0, 0)

        url = tempCanvas.toDataURL(`image/${format}`, 0.9)
      } else {
        url = canvas.toDataURL(`image/${format}`)
      }

      fileName = `${props.title}_全屏.${format}`
    }

    // 创建下载链接
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.click()

    // 显示成功消息
    ElMessage.success(`全屏图表已导出为${format.toUpperCase()}格式`)
  } catch (error) {
    console.error('导出全屏图表失败:', error)
    ElMessage.error(`导出全屏图表失败：${error.message || '请重试'}`)
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
    // 等待图表完全渲染
    await nextTick()

    // 动态导入jsPDF
    const { jsPDF } = await import('jspdf')

    // 获取全屏图表Canvas
    const canvas = getChartCanvas(fullscreenChartRef.value)
    if (!canvas) {
      throw new Error('无法获取全屏图表Canvas')
    }

    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    })

    // 计算图片尺寸以适应PDF页面
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth - 20 // 留出边距
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 如果图片高度超过页面高度，则调整尺寸
    const finalHeight = Math.min(imgHeight, pdfHeight - 40)
    const finalWidth = (canvas.width * finalHeight) / canvas.height

    // 添加标题 - 使用图片方式避免中文乱码
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

    // 将标题作为图片添加到PDF
    pdf.addImage(
      titleCanvas.toDataURL('image/png'),
      'PNG',
      10,
      5,
      120,
      10
    )

    // 添加图片
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      (pdfWidth - finalWidth) / 2,
      25,
      finalWidth,
      finalHeight
    )

    // 保存PDF
    pdf.save(`${props.title}_全屏.pdf`)

    ElMessage.success('全屏图表已导出为PDF格式')
  } catch (error) {
    console.error('导出全屏PDF失败:', error)
    ElMessage.error(`导出全屏PDF失败：${error.message || '请重试'}`)
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
  // 延迟一下确保DOM已渲染
  nextTick(() => {
    if (fullscreenChartRef.value) {
      const chart = fullscreenChartRef.value.getEchartsInstance()
      chart.resize()
    }
  })
}

// 全屏模态框关闭时的处理
const onFullscreenClosed = () => {
  // 可以在这里做一些清理工作
}

// 检查是否为空数据
const isEmpty = computed(() => {
  if (!props.data) return true
  
  // 地图类型的数据检查
  if (props.data.mapType) {
    return !props.data.mapType || !props.data.data?.length
  }
  
  // 其他图表类型的数据检查
  return !props.data.labels?.length || !props.data.values?.length
})

// 暴露给子组件使用的方法和数据
const chartOption = ref({})
const fullscreenChartOption = computed(() => {
  if (!chartOption.value || Object.keys(chartOption.value).length === 0) return {}

  // 深拷贝基础配置
  const fullscreenOption = JSON.parse(JSON.stringify(chartOption.value))

  // 调整全屏显示的特定参数
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

  // 调整图表内边距以适应更大的显示区域
  fullscreenOption.grid = {
    ...fullscreenOption.grid,
    left: '5%',
    right: '5%',
    top: '15%',
    bottom: '15%'
  }

  return fullscreenOption
})

// 暴露给子组件的方法
defineExpose({
  chartRef,
  fullscreenChartRef,
  chartKey,
  chartOption,
  fullscreenChartOption,
  getChartCanvas,
  getChartInstance
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