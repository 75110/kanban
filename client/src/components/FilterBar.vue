<template>
  <div class="filter-container">
    <div class="filter-header">
      <div class="filter-title">
        <el-icon><Filter /></el-icon>
        数据筛选
      </div>
      
      <!-- 页面切换选项卡 -->
      <div class="page-tabs-section">
        <el-tabs v-model="localActiveTab" @tab-click="handleTabChange" class="dashboard-tabs">
          <el-tab-pane label="总数据看板" name="overview"></el-tab-pane>
          <el-tab-pane label="人才流失分析" name="turnover"></el-tab-pane>
          <el-tab-pane label="人员档案" name="archive"></el-tab-pane>
          <el-tab-pane label="户籍地分析" name="household"></el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 右上角按钮 -->
      <div class="filter-actions-header">
        <el-dropdown @command="handleExportCommand" :disabled="isExporting">
          <el-button type="default" size="default" class="action-btn" :loading="isExporting">
            <el-icon><Download /></el-icon>
            导出报告
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="png">导出PNG报告</el-dropdown-item>
              <el-dropdown-item command="png-watermark">导出PNG报告（带水印）</el-dropdown-item>
              <el-dropdown-item command="excel" divided>导出Excel报告</el-dropdown-item>
              <el-dropdown-item command="images" divided>导出所有图表</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="handleRefresh" size="default" :loading="isRefreshing" class="action-btn">
          <el-icon><Refresh /></el-icon>
          {{ isRefreshing ? '刷新中...' : '刷新数据' }}
        </el-button>
      </div>
    </div>

    <!-- 通用筛选器（非人员档案页面） -->
    <div v-if="localActiveTab !== 'archive'" class="filter-module">
      <!-- 筛选条件显示 -->
      <div v-if="hasActiveFilters" class="filter-status">
        <div class="filter-status-header">
          <span class="filter-status-title">
            <el-icon><Filter /></el-icon>
            当前筛选条件
          </span>
          <el-button
            type="text"
            size="small"
            @click="handleReset"
            class="clear-filters-btn"
          >
            <el-icon><RefreshLeft /></el-icon>
            清除筛选
          </el-button>
        </div>
        <div class="filter-tags">
          <el-tag
            v-if="localFilters.organizationRegion"
            type="primary"
            closable
            @close="clearFilter('organizationRegion')"
          >
            组织区域: {{ getFilterLabel('organizationRegion') }}
          </el-tag>
          <el-tag
            v-if="localFilters.region && activeTab !== 'household'"
            type="success"
            closable
            @close="clearFilter('region')"
          >
            区域: {{ getFilterLabel('region') }}
          </el-tag>
          <el-tag
            v-if="localFilters.department"
            type="warning"
            closable
            @close="clearFilter('department')"
          >
            部门: {{ getFilterLabel('department') }}
          </el-tag>
          <el-tag
            v-if="localFilters.year"
            type="info"
            closable
            @close="clearFilter('year')"
          >
            年份: {{ localFilters.year }}年
          </el-tag>
          <el-tag
            v-if="localFilters.month"
            type="danger"
            closable
            @close="clearFilter('month')"
          >
            月份: {{ localFilters.month }}月
          </el-tag>
          <el-tag
            v-if="localFilters.dateRange && localFilters.dateRange.length === 2"
            type="success"
            closable
            @close="clearFilter('dateRange')"
          >
            日期: {{ localFilters.dateRange[0] }} 至 {{ localFilters.dateRange[1] }}
          </el-tag>
        </div>
      </div>

      <!-- 筛选器表单 -->
      <div class="filter-row">
        <!-- 户籍地分析页面显示区域和部门筛选器 -->
        <template v-if="activeTab === 'household'">
          <div class="filter-item">
            <label class="filter-label">区域</label>
            <el-select
              v-model="localFilters.organizationRegion"
              placeholder="全部区域"
              clearable
              size="default"
              @change="handleFilterChange"
            >
              <el-option
                v-for="region in regionOptions"
                :key="region.value"
                :label="region.label"
                :value="region.value"
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
                v-for="dept in props.filterOptions?.departments || []"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </div>
        </template>
        
        <!-- 其他页面显示完整筛选器 -->
        <template v-else>
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
                :key="region.value"
                :label="region.label"
                :value="region.value"
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
                :key="region.value"
                :label="region.label"
                :value="region.value"
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
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </div>

          <!-- 人才流失分析页面不显示年月筛选器 -->
          <template v-if="activeTab !== 'turnover'">
            <div class="filter-item">
              <label class="filter-label">年份</label>
              <el-select
                v-model="localFilters.year"
                placeholder="选择年份"
                clearable
                size="default"
                @change="handleFilterChange"
              >
                <el-option
                  v-for="year in filterOptions.years"
                  :key="year.value"
                  :label="year.label + '年'"
                  :value="year.value"
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
          </template>

          <div class="filter-item">
            <label class="filter-label">日期范围</label>
            <el-date-picker
              v-model="localFilters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              size="default"
              clearable
              @change="handleFilterChange"
              class="date-range-picker"
            />
          </div>
        </template>

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

    <!-- 员工档案筛选器 -->
    <div v-else class="filter-row">
      <div class="filter-item">
        <label class="filter-label">部门</label>
        <el-select
          v-model="localEmployeeFilters.department"
          placeholder="选择部门"
          clearable
          filterable
          size="default"
          @change="handleEmployeeFilterChange"
        >
          <el-option
            v-for="dept in employeeFilterOptions.departments"
            :key="dept.value"
            :label="dept.label"
            :value="dept.value"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label class="filter-label">员工</label>
        <el-select
          v-model="localEmployeeFilters.name"
          placeholder="选择员工"
          clearable
          filterable
          size="default"
          @change="handleEmployeeSelect"
        >
          <el-option
            v-for="employee in filteredEmployees"
            :key="employee.name"
            :label="employee.name"
            :value="employee.name"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label class="filter-label">搜索</label>
        <el-input
          v-model="localSearchKeyword"
          placeholder="输入姓名或工号搜索"
          clearable
          size="default"
          @input="handleSearchKeywordChange"
          @keyup.enter="handleEmployeeSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="filter-actions">
        <el-button
          type="primary"
          @click="handleEmployeeSearch"
          size="default"
          :loading="isEmployeeLoading"
        >
          <el-icon><Search /></el-icon>
          查看档案
        </el-button>
        <el-button @click="handleEmployeeReset" size="default">
          <el-icon><RefreshLeft /></el-icon>
          重置筛选
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive, nextTick } from 'vue'
import { Search, Refresh, Filter, RefreshLeft, Download, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  filterOptions: {
    type: Object,
    required: true
  },
  activeTab: {
    type: String,
    default: 'overview'
  },
  isExporting: {
    type: Boolean,
    default: false
  },
  isRefreshing: {
    type: Boolean,
    default: false
  },
  // 员工档案相关props
  employeeFilters: {
    type: Object,
    default: () => ({ department: '', name: '' })
  },
  employeeFilterOptions: {
    type: Object,
    default: () => ({ departments: [], employees: [] })
  },
  isEmployeeLoading: {
    type: Boolean,
    default: false
  },
  searchKeyword: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:filters', 'search', 'reset', 'export', 'refresh', 'tab-change', 'update:employeeFilters', 'employee-search', 'employee-reset', 'update:searchKeyword'])

// 本地筛选条件
const localFilters = ref({ ...props.filters })

// 本地员工筛选条件
const localEmployeeFilters = reactive({
  department: props.employeeFilters.department || '',
  name: props.employeeFilters.name || ''
})

// 本地搜索关键词
const localSearchKeyword = ref(props.searchKeyword)

// 本地激活的选项卡
const localActiveTab = ref(props.activeTab)

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

// 户籍地分析页面的区域选项
const regionOptions = computed(() => [
  { label: '全部区域', value: '' },
  { label: '华东地区', value: '华东' },
  { label: '华中地区', value: '华中' },
  { label: '华南地区', value: '华南' },
  { label: '西南地区', value: '西南' },
  { label: '西北地区', value: '西北' }
])

// 检查是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return Object.values(localFilters.value).some(value => value !== '' && value !== null && value !== undefined)
})

// 活跃筛选条件数量
const activeFilterCount = computed(() => {
  return Object.values(localFilters.value).filter(value => value !== '' && value !== null && value !== undefined).length
})

// 根据部门和搜索关键词筛选员工
const filteredEmployees = computed(() => {
  let employees = props.employeeFilterOptions.employees || []
  
  // 按部门筛选
  if (localEmployeeFilters.department) {
    employees = employees.filter(emp => emp.department === localEmployeeFilters.department)
  }
  
  // 按搜索关键词筛选
  if (localSearchKeyword.value) {
    const keyword = localSearchKeyword.value.toLowerCase()
    employees = employees.filter(emp => 
      emp.name.toLowerCase().includes(keyword) ||
      (emp.employee_id && emp.employee_id.toString().toLowerCase().includes(keyword)) ||
      (emp.phone && emp.phone.includes(keyword))
    )
  }
  
  return employees
})

// 当部门变化时，清空员工选择
watch(() => localEmployeeFilters.department, (newDepartment) => {
  // 如果部门变化了，清空员工选择
  if (localEmployeeFilters.name) {
    const currentEmployee = props.employeeFilterOptions.employees.find(emp => emp.name === localEmployeeFilters.name)
    // 只有当选中的员工不属于新部门时才清空
    if (!currentEmployee || currentEmployee.department !== newDepartment) {
      localEmployeeFilters.name = ''
    }
  }
  
  // 触发筛选条件更新
  emit('update:employeeFilters', {
    department: localEmployeeFilters.department,
    name: localEmployeeFilters.name
  })
})

// 监听props变化
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

watch(() => props.employeeFilters, (newFilters) => {
  localEmployeeFilters.department = newFilters.department || ''
  localEmployeeFilters.name = newFilters.name || ''
}, { deep: true })

watch(() => props.searchKeyword, (newKeyword) => {
  localSearchKeyword.value = newKeyword
})

// 监听activeTab变化
watch(() => props.activeTab, (newTab) => {
  localActiveTab.value = newTab
})

// 处理筛选条件变化
const handleFilterChange = () => {
  emit('update:filters', { ...localFilters.value })
}

// 处理选项卡变化
const handleTabChange = (tab) => {
  emit('tab-change', tab)
}

// 处理导出命令
const handleExportCommand = (command) => {
  emit('export', command)
}

// 处理刷新
const handleRefresh = () => {
  emit('refresh')
}

// 处理搜索
const handleSearch = () => {
  emit('search')
}

// 获取筛选条件标签显示文本
const getFilterLabel = (type) => {
  switch (type) {
    case 'organizationRegion':
      const orgRegion = props.filterOptions.organizationRegions.find(r => r.value === localFilters.value.organizationRegion)
      return orgRegion?.label || localFilters.value.organizationRegion
    case 'region':
      const region = props.filterOptions.regions.find(r => r.value === localFilters.value.region)
      return region?.label || localFilters.value.region
    case 'department':
      const dept = props.filterOptions.departments.find(d => d.value === localFilters.value.department)
      return dept?.label || localFilters.value.department
    default:
      return ''
  }
}

// 清除单个筛选条件
const clearFilter = (type) => {
  if (type === 'year') {
    localFilters.value[type] = ''
  } else if (type === 'dateRange') {
    localFilters.value[type] = []
  } else {
    localFilters.value[type] = ''
  }
  handleFilterChange()
}

// 处理重置
const handleReset = () => {
  localFilters.value = {
    organizationRegion: '',
    region: '',
    department: '',
    year: '',
    month: '',
    dateRange: []
  }
  emit('reset')
}

// 处理员工筛选条件变化
const handleEmployeeFilterChange = () => {
  console.log('员工筛选条件变化:', localEmployeeFilters)
  // 发送更新事件
  emit('update:employeeFilters', {
    department: localEmployeeFilters.department,
    name: localEmployeeFilters.name
  })
  
  // 如果是部门变化，自动触发筛选
  if (localEmployeeFilters.department) {
    console.log('部门选择变化，过滤员工列表:', localEmployeeFilters.department)
    // 员工列表会通过 computed 属性自动过滤
  }
}

// 专门处理员工选择事件
const handleEmployeeSelect = () => {
  const selectedName = localEmployeeFilters.name
  
  // 如果选择了员工，自动设置部门
  if (selectedName) {
    const selectedEmployee = props.employeeFilterOptions.employees.find(emp => emp.name === selectedName)
    if (selectedEmployee) {
      localEmployeeFilters.department = selectedEmployee.department
    }
  }
  
  // 更新筛选条件
  const newFilters = {
    department: localEmployeeFilters.department,
    name: selectedName
  }
  
  // 先触发更新
  emit('update:employeeFilters', newFilters)
  
  // 等待下一个 tick 再触发搜索，确保数据已经更新
  if (selectedName) {
    nextTick(() => {
      emit('employee-search')
    })
  }
}

// 处理搜索关键词变化
const handleSearchKeywordChange = () => {
  emit('update:searchKeyword', localSearchKeyword.value)
}

// 处理员工搜索
const handleEmployeeSearch = () => {
  emit('employee-search')
}

// 处理员工筛选重置
const handleEmployeeReset = () => {
  // 重置所有筛选条件
  localEmployeeFilters.department = ''
  localEmployeeFilters.name = ''
  localSearchKeyword.value = ''
  
  // 发送更新事件
  emit('update:employeeFilters', {
    department: '',
    name: ''
  })
  emit('update:searchKeyword', '')
  
  // 清空数据
  emit('employee-reset')
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

.filter-module {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-status {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.filter-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-status-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tags .el-tag {
  border-radius: 6px;
  padding: 0 10px;
  height: 28px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.filter-tags .el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.page-tabs-section {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 20px;
}

.dashboard-tabs {
  width: 100%;
  max-width: 400px;
}

.dashboard-tabs .el-tabs__header {
  margin-bottom: 0;
}

.dashboard-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.dashboard-tabs .el-tabs__item {
  font-size: 14px;
  font-weight: 500;
  padding: 0 20px;
  height: 36px;
  line-height: 36px;
  border-radius: 18px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.dashboard-tabs .el-tabs__item.is-active {
  background-color: #1890ff;
  color: white;
}

.dashboard-tabs .el-tabs__item:not(.is-active):hover {
  background-color: #f0f8ff;
  color: #1890ff;
}

.filter-actions-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
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

  .date-range-picker {
    width: 100%;
  }

  .date-range-picker .el-input__wrapper {
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

  .filter-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-tabs-section {
    margin: 0;
    order: 2;
  }

  .filter-actions-header {
    order: 3;
    justify-content: center;
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
