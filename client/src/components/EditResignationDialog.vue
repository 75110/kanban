<template>
  <el-dialog v-model="dialogVisible" title="编辑离职记录" width="800px" :before-close="handleClose" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="edit-resignation-form">
      <!-- 员工基本信息（只读） -->
      <el-divider content-position="left">员工信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="姓名">
            <el-input v-model="form.name" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="部门">
            <el-select v-model="form.department" placeholder="选择部门" clearable>
              <el-option v-for="dept in departments" :key="dept.id" :label="dept.department" :value="dept.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="岗位">
            <el-select v-model="form.position" placeholder="选择岗位" clearable>
              <el-option v-for="pst in positions" :key="pst.id" :label="pst.position" :value="pst.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 离职信息（可编辑） -->
      <el-divider content-position="left">离职信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="离职时间" prop="resignation_date">
            <el-date-picker v-model="form.resignation_date" type="date" placeholder="选择离职时间" style="width: 100%" ,
              format="YYYY-MM-DD" />
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
            <el-input v-model="form.resignation_reason" type="textarea" :rows="3" placeholder="请输入离职原因" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="resignation_remarks">
            <el-input v-model="form.resignation_remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
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
  resignationData: {
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
const departments = ref([])
const positions = ref([])

// 表单数据
const form = reactive({
  id: '',
  name: '',
  department: '',
  position: '',
  resignation_date: '',
  resignation_type: '',
  resignation_reason: '',
  resignation_remarks: ''
})

// 表单验证规则
const rules = {
  resignation_date: [{ required: true, message: '请选择离职时间', trigger: 'change' }],
  resignation_type: [{ required: true, message: '请选择离职类型', trigger: 'change' }],
  resignation_reason: [{ required: true, message: '请输入离职原因', trigger: 'blur' }]
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
  const data = props.resignationData

  form.id = data.id || ''
  form.name = data.name || ''
  form.department = data.department || ''
  form.position = data.position || ''
  form.resignation_date = data.resignation_date || ''
  form.resignation_type = data.resignation_type || ''
  form.resignation_reason = data.resignation_reason || ''
  form.resignation_remarks = data.resignation_remarks || ''
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

    await employeeApi.updateResignation(form.id, submitData)

    ElMessage.success('离职记录更新成功')
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
.edit-resignation-form {
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
