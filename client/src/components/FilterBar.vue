<template>
  <div class="filter-container">
    <div class="filter-row">
      <div class="filter-item">
        <el-select
          v-model="localFilters.organizationRegion"
          placeholder="选择组织区域"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="region in filterOptions.organizationRegions"
            :key="region"
            :label="region"
            :value="region"
          />
        </el-select>
      </div>
      
      <div class="filter-item">
        <el-select
          v-model="localFilters.region"
          placeholder="选择区域"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="region in filterOptions.regions"
            :key="region"
            :label="region"
            :value="region"
          />
        </el-select>
      </div>
      
      <div class="filter-item">
        <el-select
          v-model="localFilters.department"
          placeholder="选择部门"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="dept in filterOptions.departments"
            :key="dept"
            :label="dept"
            :value="dept"
          />
        </el-select>
      </div>
      
      <div class="filter-item">
        <el-select
          v-model="localFilters.year"
          placeholder="选择年份"
          @change="handleFilterChange"
        >
          <el-option
            v-for="year in filterOptions.years"
            :key="year"
            :label="year + '年'"
            :value="year"
          />
        </el-select>
      </div>
      
      <div class="filter-item">
        <el-select
          v-model="localFilters.month"
          placeholder="选择月份"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="month in months"
            :key="month.value"
            :label="month.label"
            :value="month.value"
          />
        </el-select>
      </div>
      
      <div class="filter-item">
        <el-button type="primary" @click="handleSearch">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Search /></el-icon>
          重置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  filterOptions: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:filters', 'search', 'reset'])

// 本地筛选条件
const localFilters = ref({ ...props.filters })

// 月份选项
const months = computed(() => [
  { label: '1月', value: 1 },
  { label: '2月', value: 2 },
  { label: '3月', value: 3 },
  { label: '4月', value: 4 },
  { label: '5月', value: 5 },
  { label: '6月', value: 6 },
  { label: '7月', value: 7 },
  { label: '8月', value: 8 },
  { label: '9月', value: 9 },
  { label: '10月', value: 10 },
  { label: '11月', value: 11 },
  { label: '12月', value: 12 }
])

// 监听props变化
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

// 处理筛选条件变化
const handleFilterChange = () => {
  emit('update:filters', { ...localFilters.value })
}

// 处理搜索
const handleSearch = () => {
  emit('search')
}

// 处理重置
const handleReset = () => {
  localFilters.value = {
    organizationRegion: '',
    region: '',
    department: '',
    year: new Date().getFullYear(),
    month: ''
  }
  emit('reset')
}
</script>

<style scoped>
.filter-container {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-base);
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  min-width: 200px;
}

.filter-item .el-select {
  width: 100%;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    min-width: auto;
    width: 100%;
  }
}
</style>
