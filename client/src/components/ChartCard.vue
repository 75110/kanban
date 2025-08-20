<template>
  <div class="chart-container">
    <div class="chart-title">{{ title }}</div>
    <div class="chart-content">
      <!-- 图表始终存在，避免重新渲染 -->
      <v-chart :option="chartOption" :update-options="{ notMerge: false, replaceMerge: ['xAxis','series','legend'] }" autoresize />

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
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { Loading, DocumentRemove } from '@element-plus/icons-vue'

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
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
  }
})

// 延迟的加载遮罩，避免轻微抖动造成闪一下
const showLoadingOverlay = ref(false)
let overlayTimer = null

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
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        show: false
      },
      series: [
        {
          name: props.title,
          type: 'pie',
          radius: props.pieStyle === 'solid' ? '80%' : ['50%', '80%'],
          center: props.pieStyle === 'solid' ? ['65%', '50%'] : ['65%', '50%'],
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
            color: props.pieStyle === 'solid' ? '#fff' : '#333',
            overflow: 'truncate',
            ellipsis: '...'
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
            length: 6,
            length2: 6
          },
          data: labels.map((label, index) => ({
            value: values[index],
            name: label
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
        }
      },
      grid: {
        left: '8%',
        right: '4%',
        top: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          interval: 0,
          rotate: labels.length > 8 ? 45 : 0,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: props.title,
          type: 'bar',
          data: values,
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
          }
        }
      ]
    }
  }
})
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.chart-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
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
