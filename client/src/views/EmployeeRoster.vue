<template>
  <div class="employee-roster">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">员工花名册</h1>
      <div class="page-actions">
        <el-button type="primary">
          <el-icon><Plus /></el-icon>
          新增员工
        </el-button>
        <el-button>
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
          <el-input
            v-model="searchForm.position"
            placeholder="请输入岗位"
            clearable
            @keyup.enter="handleSearch"
          />
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
        :default-sort="{ prop: 'entry_date', order: 'descending' }"
      >
        <el-table-column prop="sequence_number" label="序列" width="80" />
        <el-table-column prop="name" label="姓名" width="100" fixed="left" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="education_group" label="学历" width="100" />
        <el-table-column prop="work_age_group" label="工龄" width="100" />
        <el-table-column prop="entry_date" label="入职时间" width="120" sortable />
        <el-table-column prop="organization_region" label="组织区域" width="100" />
        <el-table-column prop="region" label="区域" width="100" />
        <el-table-column prop="employee_type" label="员工性质" width="100" />
        <el-table-column prop="marital_status" label="婚姻状况" width="100" />
        <el-table-column prop="personal_contact" label="联系方式" width="120" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, User, Search, Refresh } from '@element-plus/icons-vue'
import { employeeApi } from '../api'

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

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取员工数据
const fetchEmployeeData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    const response = await employeeApi.getRoster(params)
    tableData.value = response.data
    pagination.total = response.total
  } catch (error) {
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

// 编辑员工
const handleEdit = (row) => {
  ElMessage.info('编辑功能开发中...')
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

// 组件挂载时获取数据
onMounted(() => {
  fetchEmployeeData()
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
