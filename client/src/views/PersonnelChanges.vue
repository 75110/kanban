<template>
  <div class="personnel-changes">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">人员异动明细</h1>
      <div class="page-actions">
        <el-button type="primary" @click="handleAddChange">
          <el-icon><Plus /></el-icon>
          新增异动记录
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-container">
      <div class="search-row">
        <div class="search-item">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入员工姓名"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="search-item">
          <el-select v-model="searchForm.department" placeholder="选择部门" clearable>
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </div>
        <div class="search-item">
          <el-select v-model="searchForm.changeType" placeholder="异动类型" clearable>
            <el-option label="调动" value="调动" />
            <el-option label="晋升" value="晋升" />
            <el-option label="降职" value="降职" />
          </el-select>
        </div>
        <div class="search-item">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        :default-sort="{ prop: 'change_date', order: 'descending' }"
      >
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="name" label="姓名" width="100" fixed="left" />
        <el-table-column prop="original_position" label="原岗位" width="150" />
        <el-table-column prop="new_position" label="新岗位" width="150" />
        <el-table-column prop="change_date" label="异动时间" width="120" sortable />
        <el-table-column prop="change_reason" label="异动原因" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getChangeTypeTag(row.change_reason)"
              size="small"
            >
              {{ row.change_reason }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="change_remarks" label="备注" width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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

    <!-- 新增异动记录对话框 -->
    <AddPersonnelChangeDialog
      v-model:visible="addDialogVisible"
      @success="handleAddSuccess"
    />

    <!-- 编辑异动记录对话框 -->
    <EditPersonnelChangeDialog
      v-model:visible="editDialogVisible"
      :change-data="currentChange"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, User, Search, Refresh } from '@element-plus/icons-vue'
import { employeeApi } from '../api'
import AddPersonnelChangeDialog from '@/components/AddPersonnelChangeDialog.vue'
import EditPersonnelChangeDialog from '@/components/EditPersonnelChangeDialog.vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  department: '',
  changeType: ''
})

// 部门列表
const departments = ref([])

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取异动类型标签样式
const getChangeTypeTag = (type) => {
  const tagMap = {
    '调动': 'info',
    '晋升': 'success',
    '降职': 'warning'
  }
  return tagMap[type] || ''
}

// 获取异动数据
const fetchChangesData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    const response = await employeeApi.getChanges(params)
    tableData.value = response.data
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('获取异动数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchChangesData()
}

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.page = 1
  fetchChangesData()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchChangesData()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchChangesData()
}

// 新增异动记录
const addDialogVisible = ref(false)

const handleAddChange = () => {
  addDialogVisible.value = true
}

// 新增成功回调
const handleAddSuccess = () => {
  fetchChangesData() // 刷新数据
}

// 导出数据
const handleExport = async () => {
  try {
    const params = { ...searchForm }
    const response = await employeeApi.exportChanges(params)

    if (response.data && response.data.length > 0) {
      // 转换为CSV格式
      const headers = Object.keys(response.data[0])
      const csvContent = [
        headers.join(','),
        ...response.data.map(row =>
          headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n')

      // 创建下载链接
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `人员异动数据_${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      ElMessage.success(`导出成功，共 ${response.data.length} 条记录`)
    } else {
      ElMessage.warning('没有数据可导出')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 编辑记录
const editDialogVisible = ref(false)
const currentChange = ref({})

const handleEdit = (row) => {
  console.log('编辑异动记录:', row)
  currentChange.value = { ...row }
  editDialogVisible.value = true
}

// 编辑成功回调
const handleEditSuccess = () => {
  fetchChangesData() // 刷新数据
}

// 删除记录
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.name} 的异动记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await employeeApi.deleteChange({
      department: row.department,
      name: row.name,
      change_date: row.change_date
    })
    ElMessage.success('删除成功')
    fetchChangesData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchChangesData()
})
</script>

<style scoped>
.personnel-changes {
  padding: 20px;
  background-color: var(--bg-color);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  background: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-base);
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .personnel-changes {
    padding: 16px;
  }
  
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
