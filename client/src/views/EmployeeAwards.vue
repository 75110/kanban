<template>
  <div class="employee-awards" ref="pageContainer">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">员工获奖记录</h1>
      <div class="page-actions">
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-button type="danger" @click="handleDeleteAll">
          <el-icon>
            <Delete />
          </el-icon>
          清空数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-container">
      <div class="search-row">
        <div class="search-item">
          <el-input v-model="searchForm.name" placeholder="请输入员工姓名" clearable @keyup.enter="handleNameSearch">
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </div>
        <div class="search-item">
          <el-select v-model="searchForm.department" placeholder="选择部门" clearable @change="() => handleFilterChange(true)">
            <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </div>
        <div class="search-item">
          <el-select v-model="searchForm.award_name" placeholder="选择奖项" clearable @change="() => handleFilterChange(true)">
            <el-option v-for="award in awardNames" :key="award" :label="award" :value="award" />
          </el-select>
        </div>
        <div class="search-item">
          <el-select v-model="searchForm.award_year" placeholder="选择年份" clearable @change="() => handleFilterChange(true)">
            <el-option v-for="year in years" :key="year" :label="year" :value="year" />
          </el-select>
        </div>
        <div class="search-item">
          <el-button type="primary" @click="handleNameSearch">
            <el-icon>
              <Search />
            </el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon>
              <Refresh />
            </el-icon>
            重置
          </el-button>
          <!-- 列显示设置 -->
          <ColumnSelector
            :columns="tableColumns"
            page-key="employee-awards"
            :default-visible-columns="defaultVisibleColumns"
            @update:visible-columns="handleVisibleColumnsChange"
          />
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table">
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%"
        :default-sort="{ prop: 'award_year', order: 'descending' }"
        @sort-change="handleSortChange">
        <el-table-column 
          v-for="column in visibleTableColumns" 
          :key="column.prop"
          :prop="column.prop" 
          :label="column.label" 
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :show-overflow-tooltip="column.showOverflowTooltip"
        >
          <template v-if="column.prop === 'award_amount'" #default="{ row }">
            <span v-if="row.award_amount > 0" class="amount">¥{{ row.award_amount.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.prop === 'operation'" #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 编辑获奖记录对话框 -->
    <EditAwardDialog
      v-model:visible="editDialogVisible"
      :award-data="currentEditData"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, inject, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Upload, User, Delete } from '@element-plus/icons-vue'
import { employeeApi } from '../api'
import EditAwardDialog from '../components/EditAwardDialog.vue'
import ColumnSelector from '@/components/ColumnSelector.vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  department: '',
  award_name: '',
  award_year: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 筛选选项
const departments = ref([])
const years = ref([])
const awardNames = ref([])

// 滚动监听相关
const pageContainer = ref(null)
const searchSection = ref(null)
const setShowFilterInHeader = inject('setShowFilterInHeader', () => {})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 排序信息
const sortInfo = reactive({
  sortField: 'award_year',
  sortOrder: 'desc'
})

// 表格列配置 - 包含employee_awards表的所有12个列
const tableColumns = ref([
  { prop: 'id', label: 'ID', width: 80, sortable: 'custom' },
  { prop: 'award_year', label: '获奖年份', width: 100, sortable: 'custom' },
  { prop: 'award_date', label: '获奖时间', width: 150, sortable: 'custom' },
  { prop: 'name', label: '姓名', width: 100, fixed: 'left', sortable: 'custom' },
  { prop: 'department', label: '部门', width: 120, sortable: 'custom' },
  { prop: 'entry_date', label: '入职时间', width: 120, sortable: 'custom' },
  { prop: 'award_month', label: '获奖月份', width: 120, sortable: 'custom' },
  { prop: 'award_name', label: '奖项名称', width: 200, sortable: 'custom' },
  { prop: 'award_amount', label: '金额', width: 120, sortable: 'custom' },
  { prop: 'remarks', label: '备注', minWidth: 200, showOverflowTooltip: true },
  { prop: 'created_at', label: '创建时间', width: 160, sortable: 'custom' },
  { prop: 'updated_at', label: '更新时间', width: 160, sortable: 'custom' },
  { prop: 'operation', label: '操作', width: 150, fixed: 'right' }
])

// 默认可见的列 - 显示最常用的列
const defaultVisibleColumns = ref([
  'award_year', 'award_date', 'name', 'department', 'award_name', 'award_amount', 'operation'
])

// 当前可见的列
const visibleColumns = ref([...defaultVisibleColumns.value])

// 计算可见的表格列
const visibleTableColumns = computed(() => {
  return tableColumns.value.filter(column => visibleColumns.value.includes(column.prop))
})

// 处理可见列变化
const handleVisibleColumnsChange = (newVisibleColumns) => {
  visibleColumns.value = newVisibleColumns
}

// 编辑对话框状态
const editDialogVisible = ref(false)
const currentEditData = ref({})

// 获取获奖记录数据
const fetchAwardsData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortField: sortInfo.sortField,
      sortOrder: sortInfo.sortOrder,
      ...searchForm
    }

    console.log('发送获奖记录请求，参数:', params)
    const response = await employeeApi.getAwards(params)
    console.log('获奖记录响应:', response)
    tableData.value = response.data
    pagination.total = response.total
  } catch (error) {
    console.error('获取获奖记录失败:', error)
    ElMessage.error('获取获奖记录失败')
  } finally {
    loading.value = false
  }
}

// 姓名搜索（点击搜索按钮）
const handleNameSearch = () => {
  console.log('执行姓名搜索，搜索条件:', searchForm.name)
  pagination.page = 1
  fetchAwardsData()
}

// 防抖定时器
let debounceTimer = null

// 筛选条件改变（立即生效，但输入框有防抖）
const handleFilterChange = (immediate = false) => {
  console.log('筛选条件改变，当前条件:', searchForm)

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  const doFilter = () => {
    pagination.page = 1
    fetchAwardsData()
  }

  if (immediate) {
    // 下拉框选择立即生效
    doFilter()
  } else {
    // 输入框延迟500ms生效
    debounceTimer = setTimeout(doFilter, 500)
  }
}

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.page = 1
  fetchAwardsData()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchAwardsData()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchAwardsData()
}

// 排序改变
const handleSortChange = ({ prop, order }) => {
  console.log('获奖记录排序改变:', { prop, order })
  
  if (prop && order) {
    sortInfo.sortField = prop
    sortInfo.sortOrder = order === 'ascending' ? 'asc' : 'desc'
  } else {
    sortInfo.sortField = 'award_year'
    sortInfo.sortOrder = 'desc'
  }
  
  pagination.page = 1
  fetchAwardsData()
}

// 编辑获奖记录
const handleEdit = (row) => {
  console.log('编辑获奖记录:', row)
  currentEditData.value = { ...row }
  editDialogVisible.value = true
}

// 删除获奖记录
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.name} 的获奖记录"${row.award_name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('删除成功')
    fetchAwardsData()
  } catch {
    // 用户取消删除
  }
}

// 删除全部数据
const handleDeleteAll = async () => {
  try {
    await ElMessageBox.confirm(
      '仅测试！确定要清空所有员工获奖数据吗？此操作不可恢复！',
      '确认清空数据',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'error',
        dangerouslyUseHTMLString: true
      }
    )
    
    loading.value = true
    try {
      await employeeApi.deleteAllAwards()
      ElMessage.success('数据清空成功')
      fetchAwardsData() // 刷新数据
    } catch (error) {
      console.error('清空数据失败:', error)
      ElMessage.error('清空数据失败')
    } finally {
      loading.value = false
    }
  } catch {
    // 用户取消删除
  }
}



// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const response = await employeeApi.getAwardsFilterOptions()
    if (response.success) {
      departments.value = response.data.departments
      years.value = response.data.years
      awardNames.value = response.data.awardNames
    }
  } catch (error) {
    console.error('获取筛选选项失败:', error)
  }
}

// 下载导入模板
const handleDownloadTemplate = () => {
  try {
    // 定义模板列名
    const headers = [
      '获奖年份', '获奖时间', '姓名', '部门', '入职时间',
      '获奖月份', '奖项名称', '金额', '备注'
    ]

    // 创建CSV内容（只有表头）
    const csvContent = headers.join(',')

    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `员工获奖记录导入模板_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('模板下载失败:', error)
    ElMessage.error('模板下载失败')
  }
}

// 导入数据
const handleImport = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,.xlsx,.xls'
  input.style.display = 'none'
  
  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      // 读取文件内容
      const text = await file.text()
      
      // 解析CSV内容
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        ElMessage.error('文件格式错误，至少需要包含表头和数据行')
        return
      }
      
      // 解析表头
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      // 验证表头格式
      const expectedHeaders = [
        '获奖年份', '获奖时间', '姓名', '部门', '入职时间',
        '获奖月份', '奖项名称', '金额', '备注'
      ]
      
      const isValidFormat = expectedHeaders.every(header => headers.includes(header))
      if (!isValidFormat) {
        ElMessage.error('文件格式错误，请使用正确的模板格式')
        return
      }
      
      // 解析数据行
      const data = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        if (values.length !== headers.length) continue
        
        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        data.push(row)
      }
      
      if (data.length === 0) {
        ElMessage.error('没有找到有效的数据行')
        return
      }
      
      // 确认导入
      const result = await ElMessageBox.confirm(
        `即将导入 ${data.length} 条获奖记录，是否继续？`,
        '确认导入',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      if (result === 'confirm') {
        // 调用导入API
        const response = await employeeApi.importAwards(data)
        
        if (response.success) {
          ElMessage.success(`成功导入 ${response.importedCount} 条记录`)
          // 刷新数据
          await fetchAwardsData()
        } else {
          ElMessage.error(response.message || '导入失败')
        }
      }
      
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败：' + error.message)
    } finally {
      // 清理文件输入元素
      document.body.removeChild(input)
    }
  }
  
  // 触发文件选择
  document.body.appendChild(input)
  input.click()
}

// 导出数据
const handleExport = async () => {
  try {
    const params = {
      ...searchForm
    }

    console.log('导出参数:', params)
    const response = await employeeApi.exportAwards(params)
    console.log('导出响应:', response)

    if (response.success) {
      const data = response.data
      console.log('导出数据:', data)
      const headers = [
        '获奖年份', '获奖时间', '姓名', '部门', '入职时间',
        '获奖月份', '奖项名称', '金额', '备注'
      ]

      // 转换数据为CSV格式（后端已经返回中文键的数据）
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          let value = row[header] || ''
          // 如果值中包含逗号，用引号包裹
          if (String(value).includes(',')) {
            value = `"${value}"`
          }
          return value
        }).join(','))
      ].join('\n')

      // 创建下载链接
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `员工获奖记录_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      ElMessage.success('导出成功')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 编辑成功回调
const handleEditSuccess = () => {
  fetchAwardsData()
}

// 滚动监听
const handleScroll = () => {
  if (!searchSection.value) return

  const searchRect = searchSection.value.getBoundingClientRect()
  const isSearchVisible = searchRect.bottom > 0

  // 当搜索区域滚出视野时，在导航栏显示筛选控件
  setShowFilterInHeader(!isSearchVisible)
}

// 组件挂载时获取数据
onMounted(async () => {
  fetchFilterOptions()
  fetchAwardsData()

  // 等待DOM渲染完成后添加滚动监听
  await nextTick()
  window.addEventListener('scroll', handleScroll)

  // 初始检查一次
  handleScroll()
})

// 页面销毁时清理
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  setShowFilterInHeader(false) // 重置导航栏状态
})
</script>

<style scoped>
.employee-awards {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.breadcrumb {
  margin-bottom: 20px;
}

.search-container {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-base);
}

.search-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-item {
  min-width: 200px;
}

.search-item .el-select,
.search-item .el-input {
  width: 100%;
}

.data-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.amount {
  color: #67C23A;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    min-width: auto;
    width: 100%;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>
