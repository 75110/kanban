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
    <div class="chart-content" @click="testClick">
      <!-- 图表始终存在，避免重新渲染 -->
      <v-chart
        ref="chartRef"
        :key="chartKey"
        :option="chartOption"
        :update-options="{ notMerge: true, lazyUpdate: false }"
        :init-options="{ devicePixelRatio: 1, renderer: 'canvas' }"
        autoresize
        @click="handleChartClick"
      />

      <!-- 加载遮罩层（延迟显示，避免快速闪一下） -->
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
import { PieChart, BarChart, HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  VisualMapComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Loading, DocumentRemove, Download, FullScreen, ArrowDown } from '@element-plus/icons-vue'
// 引入词云图
import 'echarts-wordcloud'

// 注册ECharts组件
use([
  SVGRenderer,
  CanvasRenderer,
  PieChart,
  BarChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  VisualMapComponent
])

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'pie',
    validator: (value) => ['pie', 'bar', 'bubble', 'heatmap', 'wordcloud'].includes(value)
  },
  horizontal: {
    type: Boolean,
    default: false
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
    default: '', // 'workAge', 'education', 'department', 'resignationDepartment', 'resignationReason', 'resignationDepartmentStats', 'resignationPosition', 'resignationTenure'
    validator: (value) => ['', 'workAge', 'education', 'department', 'resignationDepartment', 'resignationReason', 'resignationDepartmentStats', 'resignationPosition', 'resignationTenure'].includes(value)
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

  if (props.type === 'pie') {
    // 饼图：使用 params.name
    clickedValue = params.name
  } else if (props.type === 'bar') {
    // 柱状图：使用 params.name 或 params.axisValue
    clickedValue = params.name || params.axisValue
  } else if (props.type === 'wordcloud') {
    // 词云图：使用 params.name
    clickedValue = params.name
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

// 渲染计数器（仅用于调试）
const renderCount = ref(0)

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
  return !props.data || !props.data.labels?.length || !props.data.values?.length
})

// 图表配置
const chartOption = computed(() => {
  if (isEmpty.value || !props.data) return {}

  const { labels, values } = props.data

  // 添加调试信息 - 只在开发环境输出
  if (process.env.NODE_ENV === 'development') {
    renderCount.value++
    const dataHash = JSON.stringify({ labels, values }).slice(0, 50)
    const stackTrace = new Error().stack?.split('\n')[1]?.trim()
    console.log(`${props.title} - 图表数据更新 (第${renderCount.value}次):`, {
      labels: labels?.length,
      values: values?.length,
      total: values?.reduce((sum, val) => sum + val, 0),
      dataHash,
      calledFrom: stackTrace
    })
  }

  if (props.type === 'pie') {
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
          radius: props.pieStyle === 'solid' ? '70%' : ['40%', '70%'],
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
            // 确保数据项可以被点击
            selected: false
          }))
        }
      ],
      color: ['#1890ff', '#40a9ff', '#69c0ff', '#91d5ff', '#bae7ff', '#e6f7ff', '#096dd9', '#0050b3']
    }
  } else if (props.type === 'bubble') {
    // 气泡图配置
    if (!values || values.length === 0) {
      console.log('Bubble chart: No data available')
      return {}
    }

    console.log('Bubble chart data:', { labels, values })
    const maxValue = Math.max(...values)
    const totalValue = values.reduce((sum, val) => sum + val, 0)

    // 创建简单的气泡数据
    const bubbleData = labels.map((label, index) => {
      const value = values[index]
      const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0

      // 简单的气泡大小计算
      const size = Math.max(20, Math.min(80, value * 3))

      // 简单的位置布局 - 一行排列
      const x = (index + 1) * (100 / (labels.length + 1))
      const y = 50

      return {
        name: label,
        value: [x, y],
        symbolSize: size,
        itemStyle: {
          color: ['#1890ff', '#40a9ff', '#69c0ff', '#91d5ff', '#bae7ff'][index % 5],
          opacity: 0.8
        },
        label: {
          show: true,
          formatter: `${label}\n${value}人`,
          position: 'inside',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#fff'
        }
      }
    })

    console.log('Bubble data:', bubbleData)

    return {
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const percentage = totalValue > 0 ? ((params.value[2] / totalValue) * 100).toFixed(1) : 0
          return `${params.name}<br/>人数: ${params.value[2]}人<br/>占比: ${percentage}%`
        },
        textStyle: {
          fontSize: 13,
          fontWeight: 500
        }
      },
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      xAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: 100
      },
      yAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: 100
      },
      series: [
        {
          name: props.title,
          type: 'scatter',
          data: bubbleData,
          emphasis: {
            scale: true,
            scaleSize: 10
          },
          animation: true,
          animationDuration: 1000,
          animationEasing: 'elasticOut'
        }
      ]
    }
  } else if (props.type === 'heatmap') {
    // 热图配置 - 用于离职原因分析
    const heatmapData = labels.map((label, index) => [0, index, values[index]])

    return {
      animation: true,
      animationDuration: 800,
      tooltip: {
        position: 'top',
        formatter: function(params) {
          return `${labels[params.data[1]]}: ${params.data[2]}人`
        }
      },
      grid: {
        height: '50%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: ['离职原因'],
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        data: labels,
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: 0,
        max: Math.max(...values),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: {
          color: ['#e6f7ff', '#bae7ff', '#91d5ff', '#69c0ff', '#40a9ff', '#1890ff', '#096dd9']
        }
      },
      series: [{
        name: '离职人数',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          formatter: '{c}人'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  } else if (props.type === 'wordcloud') {
    // 词云图配置
    if (!values || values.length === 0) {
      console.log('WordCloud: No data available')
      return {}
    }

    // 转换数据格式为词云图需要的格式
    const wordCloudData = labels.map((label, index) => ({
      name: label,
      value: values[index]
    }))

    // 计算字体大小范围
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const maxFontSize = 80
    const minFontSize = 16

    return {
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const total = values.reduce((sum, val) => sum + val, 0)
          const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0
          return `${params.name}<br/>人数: ${params.value}人<br/>占比: ${percentage}%`
        },
        textStyle: {
          fontSize: 13,
          fontWeight: 500
        }
      },
      backgroundColor: 'transparent',
      series: [{
        type: 'wordCloud',
        gridSize: 2,
        sizeRange: [minFontSize, maxFontSize],
        rotationRange: [-45, 45],
        rotationStep: 45,
        shape: 'square',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        right: 0,
        bottom: 0,
        drawOutOfBound: true,
        layoutAnimation: true,
        maskImage: null,
        keepAspect: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: function () {
            // 随机颜色，使用蓝色系
            const colors = ['#1890ff', '#40a9ff', '#69c0ff', '#91d5ff', '#096dd9', '#0050b3', '#003a8c']
            return colors[Math.floor(Math.random() * colors.length)]
          }
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        data: wordCloudData
      }]
    }
  } else {
    return {
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#333',
        textStyle: {
          color: '#fff',
          fontSize: 13,
          fontWeight: 500
        },
        confine: true,
        hideDelay: 100
      },
      grid: {
        left: props.horizontal ? '2%' : '2%',
        right: props.horizontal ? '1%' : '1%',
        top: '5%',
        bottom: props.horizontal ? '8%' : (labels.length > 8 ? '15%' : '8%'),
        containLabel: true
      },
      dataZoom: labels.length > 10 ? [
        {
          type: 'slider',
          show: true,
          [props.horizontal ? 'yAxisIndex' : 'xAxisIndex']: [0],
          start: props.chartType === 'departmentTransfer' ? 50 : 0,
          end: props.chartType === 'departmentTransfer' ? 100 : 50,
          top: props.horizontal ? '5%' : undefined,
          bottom: props.horizontal ? undefined : '5%'
        },
        {
          type: 'inside',
          [props.horizontal ? 'yAxisIndex' : 'xAxisIndex']: [0],
          start: props.chartType === 'departmentTransfer' ? 50 : 0,
          end: props.chartType === 'departmentTransfer' ? 100 : 50
        }
      ] : [],
      xAxis: {
        type: props.horizontal ? 'value' : 'category',
        data: props.horizontal ? undefined : (labels || []),
        min: props.horizontal ? 0 : undefined,
        axisLabel: {
          interval: props.horizontal ? undefined : 0,
          rotate: (props.horizontal || (labels && labels.length <= 8)) ? 0 : 45,
          fontSize: 12,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#e6e6e6'
          }
        },
        boundaryGap: props.horizontal ? false : true,
        splitLine: props.horizontal ? {
          lineStyle: {
            color: '#f0f0f0'
          }
        } : undefined
      },
      yAxis: {
        type: props.horizontal ? 'category' : 'value',
        data: props.horizontal ? (labels || []) : undefined,
        min: props.horizontal ? undefined : 0,
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#e6e6e6'
          }
        },
        splitLine: props.horizontal ? undefined : {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [
        {
          name: props.title,
          type: 'bar',
          data: values,
          barWidth: '60%',
          itemStyle: {
            borderRadius: props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: props.horizontal ? 1 : 0,
              y2: props.horizontal ? 0 : 1,
              colorStops: [
                { offset: 0, color: '#1890ff' },
                { offset: 1, color: '#69c0ff' }
              ]
            }
          },
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: props.horizontal ? 1 : 0,
                y2: props.horizontal ? 0 : 1,
                colorStops: [
                  { offset: 0, color: '#096dd9' },
                  { offset: 1, color: '#40a9ff' }
                ]
              }
            }
          },
          label: {
            show: values.length <= 10,
            position: props.horizontal ? 'right' : 'top',
            fontSize: 11,
            color: '#666'
          }
        }
      ]
    }
  }
})

// 全屏图表配置（基于普通图表配置，但调整了尺寸相关参数）
const fullscreenChartOption = computed(() => {
  if (isEmpty.value || !props.data) return {}

  // 基于普通图表配置，但调整一些参数以适应全屏显示
  const baseOption = chartOption.value
  if (!baseOption || Object.keys(baseOption).length === 0) return {}

  // 深拷贝基础配置
  const fullscreenOption = JSON.parse(JSON.stringify(baseOption))

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

// 测试点击函数
const testClick = (event) => {
  console.log('容器点击测试:', props.title, event)
}

// vue-echarts 会自动处理 @click 事件
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.chart-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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
