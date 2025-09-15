<template>
  <div class="map-chart-container">
    <!-- 地图标题 -->
    <div class="map-header">
      <h3 class="map-title">{{ currentTitle }}</h3>
      <div class="map-controls">
        <!-- 返回按钮 -->
        <el-button
          v-if="currentProvince && showBackButton"
          type="primary"
          size="small"
          @click="backToChina"
          class="back-button"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回全国地图
        </el-button>
        
        <!-- 自定义控制按钮插槽 -->
        <slot name="controls"></slot>
      </div>
    </div>

    <!-- 地图容器 -->
    <div 
      ref="mapContainer" 
      class="map-container"
      :style="{ height: mapHeight }"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="map-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>地图加载中...</span>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="map-error">
        <el-icon><Warning /></el-icon>
        <span>{{ error }}</span>
        <el-button type="text" @click="retryLoad">重试</el-button>
      </div>
    </div>

    <!-- 地图信息面板 -->
    <div v-if="showInfoPanel && selectedRegion" class="map-info-panel">
      <div class="info-header">
        <span class="region-name">{{ selectedRegion.name }}</span>
        <span class="region-value">{{ selectedRegion.value }}人</span>
      </div>
      <div class="info-details">
        <slot name="info-panel" :region="selectedRegion"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { loadChinaMap, loadProvinceMap } from '../../../utils/map'

// 定义组件属性
const props = defineProps({
  // 地图数据
  data: {
    type: Object,
    default: () => ({})
  },
  // 地图标题
  title: {
    type: String,
    default: '地图分布'
  },
  // 地图高度
  mapHeight: {
    type: String,
    default: '500px'
  },
  // 是否显示返回按钮
  showBackButton: {
    type: Boolean,
    default: true
  },
  // 是否显示信息面板
  showInfoPanel: {
    type: Boolean,
    default: false
  },
  // 地图配色方案
  colorScheme: {
    type: Array,
    default: () => ['#e0f3ff', '#abd9ea', '#74add1', '#4575b4', '#313695']
  },
  // 是否启用省份钻取
  enableDrillDown: {
    type: Boolean,
    default: true
  },
  // 自定义地图配置
  mapOptions: {
    type: Object,
    default: () => ({})
  }
})

// 定义事件
const emit = defineEmits([
  'region-click',
  'province-change',
  'back-to-china',
  'map-ready'
])

// 响应式数据
const mapContainer = ref(null)
const chartInstance = ref(null)
const loading = ref(false)
const error = ref('')
const currentProvince = ref(null)
const selectedRegion = ref(null)

// 计算属性
const currentTitle = computed(() => {
  if (currentProvince.value) {
    return `${currentProvince.value}${props.title}`
  }
  return props.title
})

// 地图配置选项
const getMapOption = () => {
  const baseOption = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        if (params.data) {
          return `${params.data.name}: ${params.data.value}人`
        }
        return `${params.name}: 暂无数据`
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...(props.data.data || []).map(item => item.value || 0)),
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      inRange: {
        color: props.colorScheme
      },
      calculable: true
    },
    series: [
      {
        name: props.title,
        type: 'map',
        map: props.data.mapType || 'china',
        roam: true,
        emphasis: {
          label: {
            show: true
          }
        },
        data: props.data.data || []
      }
    ]
  }

  // 合并自定义配置
  return Object.assign({}, baseOption, props.mapOptions)
}

// 初始化地图
const initMap = async () => {
  if (!mapContainer.value) return

  try {
    loading.value = true
    error.value = ''

    // 确保地图数据已加载
    if (props.data.mapType === 'china') {
      await loadChinaMap()
    } else if (props.data.mapType && props.data.mapType !== 'china') {
      await loadProvinceMap(props.data.mapType)
    }

    // 创建图表实例
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
    
    chartInstance.value = echarts.init(mapContainer.value)
    
    // 设置地图配置
    const option = getMapOption()
    chartInstance.value.setOption(option)

    // 绑定点击事件
    chartInstance.value.on('click', handleMapClick)

    // 绑定鼠标悬停事件
    chartInstance.value.on('mouseover', (params) => {
      if (params.data) {
        selectedRegion.value = params.data
      }
    })

    emit('map-ready', chartInstance.value)
    
  } catch (err) {
    console.error('地图初始化失败:', err)
    error.value = '地图加载失败，请重试'
    ElMessage.error('地图加载失败')
  } finally {
    loading.value = false
  }
}

// 处理地图点击事件
const handleMapClick = (params) => {
  const regionName = params.name
  
  // 发送点击事件
  emit('region-click', {
    name: regionName,
    data: params.data,
    params: params
  })

  // 如果启用钻取且当前是全国地图
  if (props.enableDrillDown && !currentProvince.value && regionName) {
    drillDownToProvince(regionName)
  }
}

// 钻取到省份
const drillDownToProvince = async (provinceName) => {
  try {
    loading.value = true
    currentProvince.value = provinceName
    
    // 加载省份地图
    await loadProvinceMap(provinceName)
    
    // 更新地图配置
    const option = getMapOption()
    option.series[0].map = provinceName
    chartInstance.value.setOption(option, true)
    
    emit('province-change', provinceName)
    
  } catch (err) {
    console.error('省份地图加载失败:', err)
    ElMessage.error(`${provinceName}地图加载失败`)
    currentProvince.value = null
  } finally {
    loading.value = false
  }
}

// 返回全国地图
const backToChina = async () => {
  try {
    loading.value = true
    currentProvince.value = null
    selectedRegion.value = null
    
    // 重新加载全国地图
    await loadChinaMap()
    
    // 更新地图配置
    const option = getMapOption()
    option.series[0].map = 'china'
    chartInstance.value.setOption(option, true)
    
    emit('back-to-china')
    
  } catch (err) {
    console.error('返回全国地图失败:', err)
    ElMessage.error('返回全国地图失败')
  } finally {
    loading.value = false
  }
}

// 重试加载
const retryLoad = () => {
  initMap()
}

// 响应数据变化
watch(() => props.data, () => {
  if (chartInstance.value && props.data.data) {
    const option = getMapOption()
    chartInstance.value.setOption(option)
  }
}, { deep: true })

// 响应容器尺寸变化
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

// 组件挂载
onMounted(async () => {
  await nextTick()
  await initMap()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

// 暴露方法给父组件
defineExpose({
  backToChina,
  drillDownToProvince,
  retryLoad,
  chartInstance: () => chartInstance.value
})
</script>

<style scoped>
.map-chart-container {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
}

.map-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.map-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.map-container {
  position: relative;
  width: 100%;
  min-height: 400px;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #666;
  font-size: 14px;
}

.map-loading .el-icon {
  font-size: 24px;
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #f56c6c;
  font-size: 14px;
  text-align: center;
}

.map-error .el-icon {
  font-size: 24px;
}

.map-info-panel {
  padding: 16px 20px;
  border-top: 1px solid #e6e6e6;
  background: #f9f9f9;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.region-name {
  font-weight: 600;
  color: #333;
}

.region-value {
  color: #409eff;
  font-weight: 500;
}

.info-details {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .map-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .map-container {
    min-height: 300px;
  }
}
</style>