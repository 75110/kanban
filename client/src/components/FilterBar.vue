<template>
  <div class="filter-container">
    <div class="filter-header">
      <div class="filter-title">
        <el-icon><Filter /></el-icon>
        数据筛选
      </div>
      <div class="filter-summary" v-if="hasActiveFilters">
        已应用 {{ activeFilterCount }} 个筛选条件
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-item">
        <label class="filter-label">组织区域</label>
        <el-select
          v-model="localFilters.organizationRegion"
          placeholder="全部组织区域"
          clearable
          size="default"
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
        <label class="filter-label">区域</label>
        <el-select
          v-model="localFilters.region"
          placeholder="全部区域"
          clearable
          size="default"
          @change="handleFilterChange"
        >
          <el-option
            v-for="region in filterOptions.regions"
            :key="region.id"
            :label="region.region"
            :value="region.region"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label class="filter-label">部门</label>
        <el-select
          v-model="localFilters.department"
          placeholder="全部部门"
          clearable
          size="default"
          @change="handleFilterChange"
        >
          <el-option
            v-for="dept in filterOptions.departments"
            :key="dept.id"
            :label="dept.department"
            :value="dept.department"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label class="filter-label">年份</label>
        <el-select
          v-model="localFilters.year"
          placeholder="选择年份"
          size="default"
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
        <label class="filter-label">月份</label>
        <el-select
          v-model="localFilters.month"
          placeholder="全年"
          clearable
          size="default"
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

      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch" size="default">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="handleReset" size="default">
          <el-icon><RefreshLeft /></el-icon>
          重置筛选
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Search, Refresh, Filter, RefreshLeft } from '@element-plus/icons-vue'

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

// 检查是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return Object.values(localFilters.value).some(value => value !== '' && value !== null && value !== undefined)
})

// 活跃筛选条件数量
const activeFilterCount = computed(() => {
  return Object.values(localFilters.value).filter(value => value !== '' && value !== null && value !== undefined).length
})

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
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.filter-container:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.filter-title .el-icon {
  color: #1890ff;
}

.filter-summary {
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #91d5ff;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  margin: 0;
}

.filter-item .el-select {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  grid-column: span 2;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .filter-row {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .filter-actions {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .filter-container {
    padding: 20px;
    margin-bottom: 20px;
  }

  .filter-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .filter-actions {
    grid-column: span 1;
    justify-content: stretch;
  }

  .filter-actions .el-button {
    flex: 1;
  }
}
</style>
