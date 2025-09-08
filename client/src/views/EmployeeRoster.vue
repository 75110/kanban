<template>
  <div class="employee-roster">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">员工花名册</h1>
      <div class="page-actions">
        <el-button type="primary" @click="handleAddEmployee">
          <el-icon>
            <Plus />
          </el-icon>
          新增员工
        </el-button>
        <el-upload ref="uploadRef" :action="uploadUrl" :headers="uploadHeaders" :before-upload="beforeUpload"
          :on-success="onUploadSuccess" :on-error="onUploadError" :show-file-list="false" accept=".xlsx,.xls"
          style="display: inline-block; margin-right: 12px;">
          <el-button>
            <el-icon>
              <Upload />
            </el-icon>
            导入数据
          </el-button>
        </el-upload>
        <el-button @click="handleDownloadTemplate">
          <el-icon>
            <Download />
          </el-icon>
          下载模板
        </el-button>
        <el-button @click="handleExport">
          <el-icon>
            <Download />
          </el-icon>
          导出数据
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
          <el-input v-model="searchForm.name" placeholder="请输入员工姓名" clearable @keyup.enter="handleSearch">
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </div>
        <div class="search-item">
          <el-select v-model="searchForm.department" placeholder="选择部门" clearable>
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.department" :value="dept.id" />
          </el-select>
        </div>
        <div class="search-item">
          <el-input v-model="searchForm.position" placeholder="请输入岗位" clearable @keyup.enter="handleSearch" />
        </div>
        <div class="search-item">
          <el-button type="primary" @click="handleSearch">
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
            page-key="employee-roster"
            :default-visible-columns="defaultVisibleColumns"
            @update:visible-columns="handleVisibleColumnsChange"
          />
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table">
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%"
        :default-sort="{ prop: 'entry_date', order: 'descending' }"
        @sort-change="handleSortChange">
        <el-table-column 
          v-for="column in visibleTableColumns" 
          :key="column.prop"
          :prop="column.prop" 
          :label="column.label" 
          :width="column.width"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :show-overflow-tooltip="column.showOverflowTooltip"
        >
          <template v-if="column.prop === 'operation'" #default="{ row }">
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
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 编辑对话框 -->
    <EmployeeEditDialog v-model:visible="editDialogVisible" :employee-data="currentEmployee"
      @success="handleEditSuccess" />

    <!-- 新增员工对话框 -->
    <AddEmployeeDialog v-model:visible="addDialogVisible" @success="handleAddSuccess" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload, User, Search, Refresh, Delete } from '@element-plus/icons-vue'
import { dashboardApi, employeeApi } from '../api'
import { calculateAge, calculateWorkAge } from '../utils'
import EmployeeEditDialog from '@/components/EmployeeEditDialog.vue'
import AddEmployeeDialog from '@/components/AddEmployeeDialog.vue'
import ColumnSelector from '@/components/ColumnSelector.vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  department: '',
  position: ''
})

// 部门列表
const departments = ref([])

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 上传相关
const uploadRef = ref()
const uploadUrl = ref('/api/employee/roster/import')  // 使用相对路径，让Vite代理处理
const uploadHeaders = ref({})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 排序信息
const sortInfo = reactive({
  sortField: 'entry_date',
  sortOrder: 'desc'
})

// 表格列配置 - 包含employee_roster表的所有40个列
const tableColumns = ref([
  { prop: 'sequence_number', label: '序列', width: 80, fixed: 'left', sortable: 'custom' },
  { prop: 'region', label: '区域', width: 100, sortable: 'custom' },
  { prop: 'department', label: '部门', width: 120, sortable: 'custom' },
  { prop: 'position', label: '岗位', width: 120, sortable: 'custom' },
  { prop: 'name', label: '姓名', width: 100, fixed: 'left', sortable: 'custom' },
  { prop: 'gender', label: '性别', width: 80, sortable: 'custom' },
  { prop: 'ethnicity', label: '民族', width: 80, sortable: 'custom' },
  { prop: 'political_status', label: '政治面貌', width: 100, sortable: 'custom' },
  { prop: 'employee_type', label: '员工性质', width: 100, sortable: 'custom' },
  { prop: 'insurance_type', label: '险种', width: 100, sortable: 'custom' },
  { prop: 'birth_date', label: '出生日期', width: 120, sortable: 'custom' },
  { prop: 'birthday', label: '生日', width: 120, sortable: 'custom' },
  { prop: 'entry_date', label: '入职时间', width: 120, sortable: 'custom' },
  { prop: 'actual_regularization_date', label: '实际转正日期', width: 140, sortable: 'custom' },
  { prop: 'remarks', label: '备注', width: 200, showOverflowTooltip: true },
  { prop: 'contract_end_date', label: '合同终止日期', width: 140, sortable: 'custom' },
  { prop: 'work_age_months', label: '工龄(月)', width: 100, sortable: 'custom' },
  { prop: 'id_card_number', label: '身份证号', width: 180, sortable: 'custom' },
  { prop: 'id_card_address', label: '身份证地址', width: 200, showOverflowTooltip: true },
  { prop: 'age', label: '年龄', width: 80, sortable: 'custom' },
  { prop: 'hometown', label: '籍贯', width: 100, sortable: 'custom' },
  { prop: 'graduation_school', label: '毕业院校', width: 200, sortable: 'custom' },
  { prop: 'major', label: '专业', width: 100, sortable: 'custom' },
  { prop: 'education', label: '学历', width: 100, sortable: 'custom' },
  { prop: 'education_method', label: '教育方式', width: 100, sortable: 'custom' },
  { prop: 'graduation_date', label: '毕业日期', width: 120, sortable: 'custom' },
  { prop: 'interviewer_name', label: '面试官姓名', width: 120, sortable: 'custom' },
  { prop: 'marital_status', label: '婚姻状况', width: 100, sortable: 'custom' },
  { prop: 'current_address', label: '现居住地', width: 200, showOverflowTooltip: true },
  { prop: 'personal_contact', label: '本人联系方式', width: 140, sortable: 'custom' },
  { prop: 'emergency_contact_name', label: '紧急联系人姓名', width: 140, sortable: 'custom' },
  { prop: 'emergency_contact_phone', label: '紧急联系人电话', width: 140, sortable: 'custom' },
  { prop: 'bank_card_number', label: '银行卡号', width: 180, sortable: 'custom' },
  { prop: 'bank_branch_info', label: '详细支行信息', width: 200, showOverflowTooltip: true },
  { prop: 'labor_relation_affiliation', label: '劳动关系隶属', width: 200, minWidth: 200, sortable: 'custom' },
  { prop: 'social_insurance_affiliation', label: '社保隶属', width: 160, minWidth: 160, sortable: 'custom' },
  { prop: 'non_compete_agreement', label: '竞业协议', width: 120, sortable: 'custom' },
  { prop: 'confidentiality_agreement', label: '保密协议', width: 120, sortable: 'custom' },
  { prop: 'remarks1', label: '备注1', width: 200, showOverflowTooltip: true },
  { prop: 'remarks2', label: '备注2', width: 200, showOverflowTooltip: true },
  { prop: 'operation', label: '操作', width: 150, fixed: 'right' }
])

// 默认可见的列 - 显示最常用的列
const defaultVisibleColumns = ref([
  'sequence_number', 'name', 'department', 'position', 'gender', 'age', 
  'education', 'work_age_months', 'entry_date', 'personal_contact', 
  'labor_relation_affiliation', 'social_insurance_affiliation', 'operation'
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

// 获取员工数据
const fetchEmployeeData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortField: sortInfo.sortField,
      sortOrder: sortInfo.sortOrder,
      ...searchForm
    }
    const response = await employeeApi.getRoster(params)

    const items = response.data.map((item) => {
      const age = calculateAge(item.birth_date)
      const workAge = calculateWorkAge(item.entry_date)
      const tmp = {
        age,
        workAge,
        ...item
      }
      return tmp
    })
    tableData.value = items
    pagination.total = response.total
  } catch (error) {
    console.error('获取员工数据失败', error)
    ElMessage.error('获取员工数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchEmployeeData()
}

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.page = 1
  fetchEmployeeData()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchEmployeeData()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchEmployeeData()
}

// 排序改变
const handleSortChange = ({ prop, order }) => {
  console.log('排序改变:', { prop, order })

  if (prop && order) {
    sortInfo.sortField = prop
    sortInfo.sortOrder = order === 'ascending' ? 'asc' : 'desc'
  } else {
    // 取消排序，恢复默认
    sortInfo.sortField = 'entry_date'
    sortInfo.sortOrder = 'desc'
  }

  pagination.page = 1 // 排序时重置到第一页
  fetchEmployeeData()
}

// 新增员工
const addDialogVisible = ref(false)

const handleAddEmployee = () => {
  addDialogVisible.value = true
}

// 新增成功回调
const handleAddSuccess = () => {
  fetchEmployeeData() // 刷新数据
}

// 下载导入模板
const handleDownloadTemplate = () => {
  try {
    // 定义模板列名
    const headers = [
      '序列', '区域', '部门', '岗位', '名字', '性别', '民族', '政治面貌', '员工性质', '险种',
      '出生日期', '生日', '入职时间', '实际转正日期', '备注', '合同终止日期', '工龄（月）',
      '身份证号', '身份证地址', '年龄', '籍贯', '毕业院校', '专业', '学历', '教育方式',
      '毕业日期', '面试官姓名', '婚姻状况', '现居住地', '本人联系方式', '紧急联系人姓名',
      '紧急联系人电话', '银行卡号', '详细支行信息', '劳动关系隶属(*)', '社保隶属(*)',
      '竞业协议', '保密协议', '备注1', '备注2'
    ]

    // 创建CSV内容（只有表头）
    const csvContent = headers.join(',')

    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `员工花名册导入模板_${new Date().toISOString().split('T')[0]}.csv`)
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

// 导出数据
const handleExport = async () => {
  try {
    const params = {
      ...searchForm
    }

    console.log('花名册导出参数:', params)
    const response = await employeeApi.exportRoster(params)
    console.log('花名册导出响应:', response)

    if (response.success) {
      // 创建Excel文件并下载
      const data = response.data
      console.log('花名册导出数据:', data)
      const headers = [
        '序列', '区域', '部门', '岗位', '名字', '性别', '民族', '政治面貌', '员工性质', '险种',
        '出生日期', '生日', '入职时间', '实际转正日期', '备注', '合同终止日期', '工龄（月）',
        '身份证号', '身份证地址', '年龄', '籍贯', '毕业院校', '专业', '学历', '教育方式',
        '毕业日期', '面试官姓名', '婚姻状况', '现居住地', '本人联系方式', '紧急联系人姓名',
        '紧急联系人电话', '银行卡号', '详细支行信息', '劳动关系隶属(*)', '社保隶属(*)',
        '竞业协议', '保密协议', '备注1', '备注2'
      ]

      // 转换数据为CSV格式
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          // 后端返回的数据已经是中文键，直接使用
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
      link.setAttribute('download', `员工花名册_${new Date().toISOString().split('T')[0]}.csv`)
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

// 上传前验证
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件!')
    return false
  }

  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }

  return true
}

// 上传成功
const onUploadSuccess = (response) => {
  // 后端会返回 { success, message, successCount, errorCount, errors }
  if (response?.success) {
    if (response.errorCount && response.errorCount > 0) {
      const details = (response.errors || []).map((e, i) => `${i + 1}. ${e}`).join('<br/>')
      ElMessageBox.alert(
        `成功：${response.successCount || 0} 条，失败：${response.errorCount} 条` + (details ? `<br/><br/>详情：<br/>${details}` : ''),
        '导入完成',
        { dangerouslyUseHTMLString: true }
      )
    } else {
      ElMessage.success(response.message || '导入完成')
    }
    fetchEmployeeData() // 刷新数据
  } else {
    ElMessage.error(response?.error || '上传失败')
  }
}

// 上传失败
const onUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败，请重试')
}

// 编辑员工
const editDialogVisible = ref(false)
const currentEmployee = ref({})

const handleEdit = (row) => {
  console.log('编辑员工:', row)
  currentEmployee.value = { ...row }
  editDialogVisible.value = true
}

// 编辑成功回调
const handleEditSuccess = () => {
  fetchEmployeeData() // 刷新数据
}

// 删除员工
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除员工 ${row.name} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('删除成功')
    fetchEmployeeData()
  } catch {
    // 用户取消删除
  }
}

// 删除全部数据
const handleDeleteAll = async () => {
  try {
    await ElMessageBox.confirm(
      '仅测试！确定要清空所有员工花名册数据吗？此操作不可恢复！',
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
      await employeeApi.deleteAllRoster()
      ElMessage.success('数据清空成功')
      fetchEmployeeData() // 刷新数据
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

// 组件挂载时获取数据
onMounted(() => {
  fetchEmployeeData()
  dashboardApi.getFilterOptions().then(res => {
    departments.value = res.departments
  })
})
</script>

<style scoped>
.employee-roster {
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
  .employee-roster {
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
