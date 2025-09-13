<template>
  <el-dialog v-model="dialogVisible" title="编辑获奖记录" width="800px" :before-close="handleClose" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="edit-award-form">
      <!-- 员工基本信息 -->
      <el-divider content-position="left">员工信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-select v-model="form.name" placeholder="选择员工" clearable filterable>
              <el-option v-for="employee in employees" :key="employee.name" :label="employee.name" :value="employee.name" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-select v-model="form.department" placeholder="选择部门" clearable>
              <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="入职时间" prop="entry_date">
            <el-date-picker v-model="form.entry_date" type="date" placeholder="选择入职时间" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 获奖信息 -->
      <el-divider content-position="left">获奖信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="获奖年份" prop="award_year">
            <el-date-picker v-model="form.award_year" type="year" placeholder="选择获奖年份" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="获奖时间" prop="award_date">
            <el-input v-model="form.award_date" placeholder="请输入获奖时间，如：2024年12月" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="获奖月份" prop="award_month">
            <el-input v-model="form.award_month" placeholder="请输入获奖月份，如：12月" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="奖项名称" prop="award_name">
            <el-select v-model="form.award_name" placeholder="选择奖项" clearable filterable allow-create>
              <el-option v-for="award in awardNames" :key="award" :label="award" :value="award" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="金额" prop="award_amount">
            <el-input-number v-model="form.award_amount" :min="0" :precision="2" placeholder="请输入金额" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remarks">
            <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
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
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { employeeApi, commonApi } from '@/api'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  awardData: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:visible', 'success'])

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()

// 下拉选项数据
const employees = ref([])
const departments = ref([])
const awardNames = ref([])

// 表单数据
const form = reactive({
  name: '',
  department: '',
  entry_date: '',
  award_year: '',
  award_date: '',
  award_month: '',
  award_name: '',
  award_amount: 0,
  remarks: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请选择员工姓名', trigger: 'change' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }],
  award_year: [{ required: true, message: '请选择获奖年份', trigger: 'change' }],
  award_date: [{ required: true, message: '请输入获奖时间', trigger: 'blur' }],
  award_name: [{ required: true, message: '请选择奖项名称', trigger: 'change' }]
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    initFormData()
  }
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 初始化表单数据
const initFormData = () => {
  const data = props.awardData

  form.name = data.name || ''
  form.department = data.department || ''
  form.entry_date = data.entry_date || ''
  form.award_year = data.award_year ? new Date(data.award_year, 0, 1) : ''
  form.award_date = data.award_date || ''
  form.award_month = data.award_month || ''
  form.award_name = data.award_name || ''
  form.award_amount = data.award_amount || 0
  form.remarks = data.remarks || ''
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

    const formatYearSafely = (date) => {
      if (!date) return null
      if (typeof date === 'string' && date.match(/^\d{4}$/)) {
        return date
      }
      if (date instanceof Date) {
        return date.getFullYear().toString()
      }
      return null
    }

    const submitData = { ...form }
    
    // 处理日期字段
    if (submitData.entry_date) {
      submitData.entry_date = formatDateSafely(submitData.entry_date)
    }
    if (submitData.award_year) {
      submitData.award_year = formatYearSafely(submitData.award_year)
    }

    await employeeApi.updateAward(props.awardData.id, submitData)

    ElMessage.success('获奖记录更新成功')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '更新失败')
  } finally {
    loading.value = false
  }
}

// 获取下拉选项数据
const fetchOptions = async () => {
  try {
    // 获取员工列表
    const employeeResponse = await commonApi.getCommonData()
    employees.value = employeeResponse.employees || []
    
    // 正确解析部门数据格式：将对象数组转换为字符串数组
    const departmentsData = employeeResponse.departments || []
    departments.value = departmentsData.map(dept => 
      typeof dept === 'string' ? dept : dept.department || dept.id
    )

    // 获取奖项名称列表
    const awardResponse = await employeeApi.getAwardsFilterOptions()
    if (awardResponse.success) {
      awardNames.value = awardResponse.data.awardNames || []
    }
  } catch (error) {
    console.error('获取下拉选项失败:', error)
  }
}

onMounted(() => {
  fetchOptions()
})
</script>

<style scoped>
.edit-award-form {
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

