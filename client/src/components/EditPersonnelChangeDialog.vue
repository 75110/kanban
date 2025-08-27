<template>
  <el-dialog v-model="dialogVisible" title="编辑异动记录" width="800px" :before-close="handleClose" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="edit-change-form">
      <!-- 员工基本信息（可编辑） -->
      <el-divider content-position="left">员工信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-select v-model="form.department" placeholder="选择部门" clearable>
              <el-option v-for="dept in departments" :key="dept.id" :label="dept.department" :value="dept.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 异动信息（可编辑） -->
      <el-divider content-position="left">异动信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="原岗位" prop="original_position">
            <el-select v-model="form.original_position" placeholder="选择岗位" clearable>
              <el-option v-for="pst in positions" :key="pst.id" :label="pst.position" :value="pst.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="新岗位" prop="new_position">
            <el-select v-model="form.new_position" placeholder="选择岗位" clearable>
              <el-option v-for="pst in positions" :key="pst.id" :label="pst.position" :value="pst.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="异动时间" prop="change_date">
            <el-date-picker v-model="form.change_date" type="date" placeholder="选择异动时间" style="width: 100%" />
          </el-form-item>
        </el-col>
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
  changeData: {
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
// 部门数据
const departments = ref([])
// 岗位数据
const positions = ref([])

// 表单数据
const form = reactive({
  department: '',
  name: '',
  original_position: '',
  new_position: '',
  change_date: '',
  change_reason: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  new_position: [{ required: true, message: '请输入新岗位', trigger: 'blur' }],
  change_date: [{ required: true, message: '请选择异动时间', trigger: 'change' }],
  change_reason: [{ required: true, message: '请选择异动类型', trigger: 'change' }]
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
  const data = props.changeData

  form.department = data.department || ''
  form.name = data.name || ''
  form.original_position = data.original_position || ''
  form.new_position = data.new_position || ''
  form.change_date = data.change_date || ''
  form.change_reason = data.change_reason || ''
  form.remarks = data.change_remarks || data.remarks || ''
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

    // 使用组合键更新（因为表没有主键id）
    const updateKey = {
      originalDepartment: props.changeData.department,
      originalName: props.changeData.name,
      originalDate: props.changeData.change_date
    }

    await employeeApi.updatePersonnelChange(updateKey, submitData)

    ElMessage.success('异动记录更新成功')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '更新失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  commonApi.getCommonData().then(res => {
    departments.value = res.departments
    positions.value = res.positions
  })
})
</script>

<style scoped>
.edit-change-form {
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
