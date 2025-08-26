<template>
  <el-dialog
    v-model="dialogVisible"
    title="新增离职记录"
    width="800px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="add-resignation-form"
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

      <!-- 离职信息 -->
      <el-divider content-position="left">离职信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="离职时间" prop="resignation_date">
            <el-date-picker
              v-model="form.resignation_date"
              type="date"
              placeholder="选择离职时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="离职类型" prop="resignation_type">
            <el-select v-model="form.resignation_type" placeholder="请选择离职类型" style="width: 100%">
              <el-option label="主动离职" value="主动离职" />
              <el-option label="被动离职" value="被动离职" />
              <el-option label="合同到期" value="合同到期" />
              <el-option label="试用期离职" value="试用期离职" />
              <el-option label="协商离职" value="协商离职" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="离职原因" prop="resignation_reason">
            <el-input
              v-model="form.resignation_reason"
              type="textarea"
              :rows="3"
              placeholder="请输入离职原因"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="resignation_remarks">
            <el-input
              v-model="form.resignation_remarks"
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
  resignation_date: '',
  resignation_type: '',
  resignation_reason: '',
  resignation_remarks: ''
})

// 表单验证规则
const rules = {
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  resignation_date: [{ required: true, message: '请选择离职时间', trigger: 'change' }],
  resignation_type: [{ required: true, message: '请选择离职类型', trigger: 'change' }],
  resignation_reason: [{ required: true, message: '请输入离职原因', trigger: 'blur' }]
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
    
    // 处理日期格式
    const submitData = { ...form }
    if (submitData.resignation_date) {
      submitData.resignation_date = new Date(submitData.resignation_date).toISOString().split('T')[0]
    }
    
    await employeeApi.postResignation(submitData)
    
    ElMessage.success('离职记录添加成功')
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
.add-resignation-form {
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
