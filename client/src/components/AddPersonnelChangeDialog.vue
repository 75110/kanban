<template>
  <el-dialog
    v-model="dialogVisible"
    title="新增异动记录"
    width="800px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="add-change-form"
    >
      <!-- 员工选择 -->
      <el-divider content-position="left">员工信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="选择员工" prop="employeeId">
            <el-select
              v-model="form.employeeId"
              placeholder="请选择员工"
              filterable
              remote
              :remote-method="searchEmployees"
              :loading="employeeLoading"
              style="width: 100%"
              @change="handleEmployeeChange"
            >
              <el-option
                v-for="employee in employeeOptions"
                :key="employee.sequence_number || employee.name"
                :label="`${employee.name} - ${employee.department} - ${employee.position}`"
                :value="employee.sequence_number || employee.name"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="员工姓名" prop="name">
            <el-input v-model="form.name" placeholder="选择员工后自动填入" readonly />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-input v-model="form.department" placeholder="选择员工后自动填入" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="原岗位" prop="original_position">
            <el-input v-model="form.original_position" placeholder="选择员工后自动填入" readonly />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 异动信息 -->
      <el-divider content-position="left">异动信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="新岗位" prop="new_position">
            <el-input v-model="form.new_position" placeholder="请输入新岗位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="异动时间" prop="change_date">
            <el-date-picker
              v-model="form.change_date"
              type="date"
              placeholder="选择异动时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="异动类型" prop="change_reason">
            <el-select v-model="form.change_reason" placeholder="请选择异动类型" style="width: 100%">
              <el-option label="调动" value="调动" />
              <el-option label="晋升" value="晋升" />
              <el-option label="降职" value="降职" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remarks">
            <el-input
              v-model="form.remarks"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { employeeApi } from '@/api'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'success'])

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const employeeLoading = ref(false)
const formRef = ref()
const employeeOptions = ref([])

// 表单数据
const form = reactive({
  employeeId: '',
  name: '',
  department: '',
  original_position: '',
  new_position: '',
  change_date: '',
  change_reason: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  new_position: [{ required: true, message: '请输入新岗位', trigger: 'blur' }],
  change_date: [{ required: true, message: '请选择异动时间', trigger: 'change' }],
  change_reason: [{ required: true, message: '请选择异动类型', trigger: 'change' }]
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    resetForm()
    searchEmployees('') // 初始加载员工列表
  }
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
  employeeOptions.value = []
}

// 搜索员工
const searchEmployees = async (query) => {
  if (!query && employeeOptions.value.length > 0) return
  
  try {
    employeeLoading.value = true
    const response = await employeeApi.getRoster({
      name: query,
      page: 1,
      pageSize: 50
    })
    employeeOptions.value = response.data || []
  } catch (error) {
    console.error('搜索员工失败:', error)
  } finally {
    employeeLoading.value = false
  }
}

// 员工选择变化
const handleEmployeeChange = (value) => {
  const selectedEmployee = employeeOptions.value.find(emp => 
    (emp.sequence_number || emp.name) === value
  )
  if (selectedEmployee) {
    form.name = selectedEmployee.name
    form.department = selectedEmployee.department
    form.original_position = selectedEmployee.position
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 提交表单
const handleSubmit = async () => {
  const formEl = formRef.value
  if (!formEl) return
  
  const valid = await formEl.validate().catch(() => false)
  if (!valid) return
  
  try {
    loading.value = true
    
    // 处理日期格式 - 避免时区转换问题
    const formatDateSafely = (date) => {
      if (!date) return null
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date
      }
      if (date instanceof Date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      return null
    }

    const submitData = { ...form }
    if (submitData.change_date) {
      submitData.change_date = formatDateSafely(submitData.change_date)
    }

    await employeeApi.postTransfer(submitData)
    
    ElMessage.success('异动记录添加成功')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '添加失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.add-change-form {
  padding: 10px 0;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-divider__text) {
  font-weight: bold;
  color: #409eff;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}
</style>
