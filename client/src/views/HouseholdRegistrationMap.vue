<template>
  <div class="household-map">
    <FilterBar
      v-model:filters="filters"
      :filter-options="filterOptions"
      @search="handleSearch"
      @reset="handleReset"
    />
    
    <!-- 地图容器 -->
    <div class="map-container">
      <ChartCard
        :title="currentTitle"
        type="map"
        :data="mapData"
        :loading="loading"
        @chart-click="handleMapClick"
      />
    </div>
    
    <!-- 返回按钮，仅在查看省份详情时显示 -->
    <el-button
      v-if="currentProvince"
      type="primary"
      @click="backToChina"
      class="back-button"
    >
      返回全国地图
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import FilterBar from '../components/FilterBar.vue'
import ChartCard from '../components/ChartCard.vue'
import { householdMapApi } from '../api/household-map'
import * as echarts from 'echarts'

// 地图数据状态
const mapData = ref({})
const loading = ref(false)
const currentProvince = ref(null)
const provinceData = ref([])
const cityData = ref([])

// 筛选条件
const filters = ref({
  organizationRegion: '',
  region: '',
  department: '',
  year: '',
  month: '',
  dateRange: []
})

const filterOptions = ref({
  departments: [],
  positions: []
})

// 计算当前标题
const currentTitle = computed(() => {
  return currentProvince.value 
    ? `${currentProvince.value}省户籍员工分布` 
    : '全国户籍员工分布'
})

// 模拟省份数据（根据筛选条件调整）
const mockProvinceData = () => {
  const provinces = [
    '北京', '上海', '广东', '江苏', '浙江', '山东', 
    '河南', '四川', '湖北', '湖南', '河北', '福建', 
    '安徽', '江西', '广西', '云南', '贵州', '陕西'
  ]
  
  // 根据筛选条件调整数据
  let baseValue = 50
  if (filters.value.year) {
    baseValue += parseInt(filters.value.year) - 2020 // 年份越新，数据越多
  }
  if (filters.value.department) {
    baseValue += 20 // 有部门筛选时增加数据
  }
  if (filters.value.region) {
    baseValue += 15 // 有区域筛选时增加数据
  }
  
  return provinces.map(province => ({
    name: province,
    value: Math.floor(Math.random() * baseValue) + 10
  }))
}

// 模拟城市数据（根据筛选条件调整）
const mockCityData = (province) => {
  const citiesMap = {
    '北京': ['朝阳区', '海淀区', '东城区', '西城区', '丰台区'],
    '上海': ['浦东新区', '徐汇区', '静安区', '黄浦区', '长宁区'],
    '广东': ['广州', '深圳', '珠海', '佛山', '东莞'],
    '江苏': ['南京', '苏州', '无锡', '常州', '南通'],
    '浙江': ['杭州', '宁波', '温州', '嘉兴', '湖州']
  }
  
  const cities = citiesMap[province] || ['城市1', '城市2', '城市3', '城市4', '城市5']
  
  // 根据筛选条件调整数据
  let baseValue = 30
  if (filters.value.year) {
    baseValue += parseInt(filters.value.year) - 2020
  }
  if (filters.value.department) {
    baseValue += 15
  }
  if (filters.value.region) {
    baseValue += 10
  }
  
  return cities.map(city => ({
    name: city,
    value: Math.floor(Math.random() * baseValue) + 5
  }))
}

// 加载中国地图数据
const loadChinaMap = async () => {
  loading.value = true
  try {
    // 模拟加载中国地图数据
    setTimeout(() => {
      // 使用模拟数据
      const mockData = mockProvinceData()
      provinceData.value = mockData
      
      // 转换为地图数据格式
      mapData.value = {
        mapType: 'china',
        data: mockData
      }
      
      currentProvince.value = null
      loading.value = false
    }, 1000)
  } catch (error) {
    console.error('加载中国地图失败:', error)
    ElMessage.error('加载中国地图失败')
    loading.value = false
  }
}

// 加载省级分布数据
const loadProvinceDistribution = async () => {
  loadChinaMap()
}

// 加载市级分布数据
const loadCityDistribution = async (province) => {
  loading.value = true
  try {
    // 模拟加载省份地图数据
    setTimeout(() => {
      // 使用模拟数据
      const mockData = mockCityData(province)
      cityData.value = mockData
      
      // 转换为地图数据格式
      mapData.value = {
        mapType: province,
        data: mockData
      }
      
      currentProvince.value = province
      loading.value = false
    }, 1000)
  } catch (error) {
    console.error(`获取${province}市级分布数据失败:`, error)
    ElMessage.error(`获取${province}市级分布数据失败`)
    loading.value = false
  }
}

// 处理地图点击事件
const handleMapClick = (params) => {
  if (!currentProvince.value) {
    // 当前是全国地图，点击省份时加载该省的地图
    const province = params.name
    if (province) {
      loadCityDistribution(province)
    }
  }
}

// 返回全国地图
const backToChina = () => {
  loadProvinceDistribution()
}

// 处理搜索
const handleSearch = () => {
  console.log('户籍地分析筛选条件:', filters.value)
  if (currentProvince.value) {
    loadCityDistribution(currentProvince.value)
  } else {
    loadProvinceDistribution()
  }
}

// 处理重置
const handleReset = () => {
  filters.value = {
    organizationRegion: '',
    region: '',
    department: '',
    year: '',
    month: '',
    dateRange: []
  }
  loadProvinceDistribution()
}

// 组件挂载时加载数据
onMounted(async () => {
  try {
    // 加载筛选选项
    // 这里可以添加获取部门、职位等筛选选项的代码
    
    // 加载中国地图
    await loadChinaMap()
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败')
  }
})
</script>

<style scoped>
.household-map {
  padding: 16px;
  background: #f5f7fa;
  min-height: 100vh;
}

.map-container {
  margin-top: 16px;
  height: calc(100vh - 200px);
}

.back-button {
  margin-top: 16px;
}
</style>


