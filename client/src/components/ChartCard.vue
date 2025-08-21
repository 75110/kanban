<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-actions">
        <el-tooltip content="导出图片" placement="top">
          <el-button
            size="small"
            type="text"
            @click="exportChart"
            :disabled="isEmpty"
          >
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>
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
        :option="chartOption"
        :update-options="{ notMerge: false, replaceMerge: ['xAxis','series','legend'] }"
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
</template>

<script setup>
import { computed, watch, ref, onMounted, onBeforeUnmount } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { Loading, DocumentRemove, Download, FullScreen } from '@element-plus/icons-vue'

// 注册ECharts组件
use([
  SVGRenderer,
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'pie',
    validator: (value) => ['pie', 'bar', 'bubble'].includes(value)
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
    default: '', // 'workAge', 'education', 'department'
    validator: (value) => ['', 'workAge', 'education', 'department'].includes(value)
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

// 图表引用
const chartRef = ref(null)

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

onBeforeUnmount(() => {
  overlayTimer && clearTimeout(overlayTimer)
})

// 导出图表
const exportChart = () => {
  if (chartRef.value) {
    const chart = chartRef.value.getEchartsInstance()
    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    // 创建下载链接
    const link = document.createElement('a')
    link.download = `${props.title}.png`
    link.href = url
    link.click()
  }
}

// 全屏查看
const toggleFullscreen = () => {
  // 这里可以实现全屏功能，暂时用消息提示
  console.log('全屏功能待实现')
}


// 检查是否为空数据
const isEmpty = computed(() => {
  return !props.data.labels?.length || !props.data.values?.length
})

// 图表配置
const chartOption = computed(() => {
  if (isEmpty.value) return {}

  const { labels, values } = props.data

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
        left: '3%',
        right: '3%',
        top: '10%',
        bottom: labels.length > 8 ? '25%' : '15%',
        containLabel: true
      },
      dataZoom: labels.length > 10 ? [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 50
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 50
        }
      ] : [],
      xAxis: {
        type: 'category',
        data: labels || [],
        axisLabel: {
          interval: 0,
          rotate: (labels && labels.length > 8) ? 45 : 0,
          fontSize: 12,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#e6e6e6'
          }
        },
        boundaryGap: true
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#e6e6e6'
          }
        },
        splitLine: {
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
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
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
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#096dd9' },
                  { offset: 1, color: '#40a9ff' }
                ]
              }
            }
          },
          label: {
            show: values.length <= 10,
            position: 'top',
            fontSize: 11,
            color: '#666'
          }
        }
      ]
    }
  }
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
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.chart-container:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  border-color: rgba(24, 144, 255, 0.2);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
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
</style>
