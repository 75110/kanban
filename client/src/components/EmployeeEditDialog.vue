<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-tabs v-model="activeTab" type="card">
      <!-- 基本信息编辑 -->
      <el-tab-pane label="基本信息" name="basic">
        <el-form
          ref="basicFormRef"
          :model="basicForm"
          :rules="basicRules"
          label-width="120px"
          class="edit-form"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="basicForm.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="部门" prop="department">
                <el-input v-model="basicForm.department" placeholder="请输入部门" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="岗位" prop="position">
                <el-input v-model="basicForm.position" placeholder="请输入岗位" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="区域" prop="region">
                <el-input v-model="basicForm.region" placeholder="请输入区域" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系方式" prop="personal_contact">
                <el-input v-model="basicForm.personal_contact" placeholder="请输入联系方式" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <!-- 离职操作 -->
      <el-tab-pane label="离职操作" name="resignation">
        <el-form
          ref="resignationFormRef"
          :model="resignationForm"
          :rules="resignationRules"
          label-width="120px"
          class="edit-form"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="离职时间" prop="resignation_date">
                <el-date-picker
                  v-model="resignationForm.resignation_date"
                  type="date"
                  placeholder="选择离职时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="离职类型" prop="resignation_type">
                <el-select v-model="resignationForm.resignation_type" placeholder="请选择离职类型" style="width: 100%">
                  <el-option label="主动离职" value="主动离职" />
                  <el-option label="被动离职" value="被动离职" />
                  <el-option label="合同到期" value="合同到期" />
                  <el-option label="试用期离职" value="试用期离职" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="离职原因" prop="resignation_reason">
                <el-input
                  v-model="resignationForm.resignation_reason"
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
                  v-model="resignationForm.resignation_remarks"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <!-- 调动操作 -->
      <el-tab-pane label="调动操作" name="transfer">
        <el-form
          ref="transferFormRef"
          :model="transferForm"
          :rules="transferRules"
          label-width="120px"
          class="edit-form"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="部门" prop="department">
                <el-input v-model="transferForm.department" placeholder="部门（自动填入）" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="transferForm.name" placeholder="姓名（自动填入）" readonly />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="原岗位" prop="original_position">
                <el-input v-model="transferForm.original_position" placeholder="原岗位（自动填入）" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="新岗位" prop="new_position">
                <el-input v-model="transferForm.new_position" placeholder="请输入新岗位" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="异动时间" prop="change_date">
                <el-date-picker
                  v-model="transferForm.change_date"
                  type="date"
                  placeholder="选择异动时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="异动原因" prop="change_type">
                <el-select v-model="transferForm.change_type" placeholder="请选择异动原因" style="width: 100%">
                  <el-option label="调动" value="调动" />
                  <el-option label="晋升" value="晋升" />
                  <el-option label="降职" value="降职" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注" prop="change_remarks">
                <el-input
                  v-model="transferForm.change_remarks"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { employeeApi } from '@/api'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  employeeData: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:visible', 'success'])

// 响应式数据
const dialogVisible = ref(false)
const activeTab = ref('basic')
const loading = ref(false)

// 表单引用
const basicFormRef = ref()
const resignationFormRef = ref()
const transferFormRef = ref()

// 基本信息表单
const basicForm = reactive({
  name: '',
  department: '',
  position: '',
  region: '',
  personal_contact: '',
  originalName: '' // 用于标识原始姓名
})

// 离职表单
const resignationForm = reactive({
  resignation_date: '',
  resignation_type: '',
  resignation_reason: '',
  resignation_remarks: ''
})

// 调动表单
const transferForm = reactive({
  department: '',
  name: '',
  original_position: '',
  new_position: '',
  change_date: '',
  change_type: '',
  change_remarks: ''
})

// 表单验证规则
const basicRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  position: [{ required: true, message: '请输入岗位', trigger: 'blur' }],
  region: [{ required: true, message: '请输入区域', trigger: 'blur' }]
}

const resignationRules = {
  resignation_date: [{ required: true, message: '请选择离职时间', trigger: 'change' }],
  resignation_type: [{ required: true, message: '请选择离职类型', trigger: 'change' }],
  resignation_reason: [{ required: true, message: '请输入离职原因', trigger: 'blur' }]
}

const transferRules = {
  new_position: [{ required: true, message: '请输入新岗位', trigger: 'blur' }],
  change_date: [{ required: true, message: '请选择异动时间', trigger: 'change' }],
  change_type: [{ required: true, message: '请选择异动原因', trigger: 'change' }]
}

// 计算属性
const dialogTitle = computed(() => {
  const name = props.employeeData?.name || '员工'
  return `编辑 ${name} 的信息`
})

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
  const data = props.employeeData
  
  // 基本信息表单
  basicForm.name = data.name || ''
  basicForm.department = data.department || ''
  basicForm.position = data.position || ''
  basicForm.region = data.region || ''
  basicForm.personal_contact = data.personal_contact || ''
  basicForm.originalName = data.name || ''
  
  // 调动表单自动填入信息
  transferForm.department = data.department || ''
  transferForm.name = data.name || ''
  transferForm.original_position = data.position || ''
  transferForm.new_position = ''
  transferForm.change_date = ''
  transferForm.change_type = ''
  transferForm.change_remarks = ''
  
  // 重置离职表单
  resignationForm.resignation_date = ''
  resignationForm.resignation_type = ''
  resignationForm.resignation_reason = ''
  resignationForm.resignation_remarks = ''
  
  // 重置到基本信息标签页
  activeTab.value = 'basic'
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 确认操作
const handleConfirm = async () => {
  try {
    loading.value = true

    if (activeTab.value === 'basic') {
      await handleBasicUpdate()
    } else if (activeTab.value === 'resignation') {
      await handleResignation()
    } else if (activeTab.value === 'transfer') {
      await handleTransfer()
    }

  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理基本信息更新
const handleBasicUpdate = async () => {
  const formRef = basicFormRef.value
  if (!formRef) return

  const valid = await formRef.validate().catch(() => false)
  if (!valid) return

  try {
    const employeeId = props.employeeData.sequence_number || props.employeeData.name
    await employeeApi.updateRoster(employeeId, basicForm)

    ElMessage.success('员工信息更新成功')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '更新失败')
  }
}

// 处理离职操作
const handleResignation = async () => {
  const formRef = resignationFormRef.value
  if (!formRef) return

  const valid = await formRef.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm(
      `确定要将 ${props.employeeData.name} 设置为离职状态吗？此操作将把员工信息迁移到离职监控表，并从花名册中删除。`,
      '确认离职',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const resignationData = {
      employeeId: props.employeeData.sequence_number || props.employeeData.name,
      name: props.employeeData.name,
      ...resignationForm
    }

    await employeeApi.postResignation(resignationData)

    ElMessage.success('离职操作完成，员工信息已迁移到离职监控表')
    emit('success')
    handleClose()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '离职操作失败')
    }
  }
}

// 处理调动操作
const handleTransfer = async () => {
  const formRef = transferFormRef.value
  if (!formRef) return

  const valid = await formRef.validate().catch(() => false)
  if (!valid) return

  try {
    const transferData = {
      employeeId: props.employeeData.sequence_number || props.employeeData.name,
      ...transferForm
    }

    await employeeApi.postTransfer(transferData)

    ElMessage.success('调动操作完成，记录已保存到人员异动表')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '调动操作失败')
  }
}
</script>

<style scoped>
.edit-form {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
