<template>
  <el-dialog
    v-model="dialogVisible"
    title="新增员工"
    width="1000px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      class="add-employee-form"
    >
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="序列" prop="sequence_number">
            <el-input v-model="form.sequence_number" placeholder="请输入序列号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="区域" prop="region">
            <el-input v-model="form.region" placeholder="请输入区域" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="部门" prop="department">
            <el-input v-model="form.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="岗位" prop="position">
            <el-input v-model="form.position" placeholder="请输入岗位" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="名字" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="民族" prop="ethnicity">
            <el-input v-model="form.ethnicity" placeholder="请输入民族" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="政治面貌" prop="political_status">
            <el-select v-model="form.political_status" placeholder="请选择政治面貌" style="width: 100%">
              <el-option label="群众" value="群众" />
              <el-option label="共青团员" value="共青团员" />
              <el-option label="中共党员" value="中共党员" />
              <el-option label="民主党派" value="民主党派" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="员工性质" prop="employee_type">
            <el-select v-model="form.employee_type" placeholder="请选择员工性质" style="width: 100%">
              <el-option label="正式" value="正式" />
              <el-option label="试用" value="试用" />
              <el-option label="实习" value="实习" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="险种" prop="insurance_type">
            <el-select v-model="form.insurance_type" placeholder="请选择险种" style="width: 100%">
              <el-option label="社保" value="社保" />
              <el-option label="工伤" value="工伤" />
              <el-option label="无" value="无" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="出生日期" prop="birth_date">
            <el-date-picker
              v-model="form.birth_date"
              type="date"
              placeholder="选择出生日期"
              style="width: 100%"
              @change="calculateAge"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生日" prop="birthday">
            <el-input v-model="form.birthday" placeholder="MM-DD格式，如：01-15" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="婚姻状况" prop="marital_status">
            <el-select v-model="form.marital_status" placeholder="请选择婚姻状况" style="width: 100%">
              <el-option label="未婚" value="未婚" />
              <el-option label="已婚" value="已婚" />
              <el-option label="离异" value="离异" />
              <el-option label="丧偶" value="丧偶" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 工作信息 -->
      <el-divider content-position="left">工作信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="入职时间" prop="entry_date">
            <el-date-picker
              v-model="form.entry_date"
              type="date"
              placeholder="选择入职时间"
              style="width: 100%"
              @change="calculateWorkAge"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="实际转正日期" prop="actual_regularization_date">
            <el-date-picker
              v-model="form.actual_regularization_date"
              type="date"
              placeholder="选择转正日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="合同终止日期" prop="contract_end_date">
            <el-date-picker
              v-model="form.contract_end_date"
              type="date"
              placeholder="选择合同终止日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="工龄（月）" prop="work_age_months">
            <el-input-number v-model="form.work_age_months" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="年龄" prop="age">
            <el-input-number v-model="form.age" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="面试官姓名" prop="interviewer_name">
            <el-input v-model="form.interviewer_name" placeholder="请输入面试官姓名" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 身份信息 -->
      <el-divider content-position="left">身份信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="身份证号" prop="id_card_number">
            <el-input v-model="form.id_card_number" placeholder="请输入身份证号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="籍贯" prop="hometown">
            <el-input v-model="form.hometown" placeholder="请输入籍贯" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="身份证地址" prop="id_card_address">
            <el-input v-model="form.id_card_address" placeholder="请输入身份证地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="现居住地" prop="current_address">
            <el-input v-model="form.current_address" placeholder="请输入现居住地" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 教育信息 -->
      <el-divider content-position="left">教育信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="毕业院校" prop="graduation_school">
            <el-input v-model="form.graduation_school" placeholder="请输入毕业院校" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="专业" prop="major">
            <el-input v-model="form.major" placeholder="请输入专业" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="学历" prop="education">
            <el-select v-model="form.education" placeholder="请选择学历" style="width: 100%">
              <el-option label="高中及以下" value="高中及以下" />
              <el-option label="大专" value="大专" />
              <el-option label="本科" value="本科" />
              <el-option label="硕士" value="硕士" />
              <el-option label="博士" value="博士" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="教育方式" prop="education_method">
            <el-select v-model="form.education_method" placeholder="请选择教育方式" style="width: 100%">
              <el-option label="全日制" value="全日制" />
              <el-option label="非全日制" value="非全日制" />
              <el-option label="自考" value="自考" />
              <el-option label="成人教育" value="成人教育" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="毕业日期" prop="graduation_date">
            <el-date-picker
              v-model="form.graduation_date"
              type="date"
              placeholder="选择毕业日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 联系信息 -->
      <el-divider content-position="left">联系信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="本人联系方式" prop="personal_contact">
            <el-input v-model="form.personal_contact" placeholder="请输入联系方式" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="紧急联系人姓名" prop="emergency_contact_name">
            <el-input v-model="form.emergency_contact_name" placeholder="请输入紧急联系人姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="紧急联系人电话" prop="emergency_contact_phone">
            <el-input v-model="form.emergency_contact_phone" placeholder="请输入紧急联系人电话" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 银行信息 -->
      <el-divider content-position="left">银行信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="银行卡号" prop="bank_card_number">
            <el-input v-model="form.bank_card_number" placeholder="请输入银行卡号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="详细支行信息" prop="bank_branch_info">
            <el-input v-model="form.bank_branch_info" placeholder="请输入详细支行信息" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 隶属信息 -->
      <el-divider content-position="left">隶属信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="劳动关系隶属(*)" prop="labor_relation_affiliation">
            <el-input v-model="form.labor_relation_affiliation" placeholder="请输入劳动关系隶属" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="社保隶属(*)" prop="social_insurance_affiliation">
            <el-input v-model="form.social_insurance_affiliation" placeholder="请输入社保隶属" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 协议信息 -->
      <el-divider content-position="left">协议信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="竞业协议" prop="non_compete_agreement">
            <el-select v-model="form.non_compete_agreement" placeholder="请选择" style="width: 100%">
              <el-option label="是" value="是" />
              <el-option label="否" value="否" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="保密协议" prop="confidentiality_agreement">
            <el-select v-model="form.confidentiality_agreement" placeholder="请选择" style="width: 100%">
              <el-option label="是" value="是" />
              <el-option label="否" value="否" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 备注信息 -->
      <el-divider content-position="left">备注信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remarks">
            <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="备注1" prop="remarks1">
            <el-input v-model="form.remarks1" type="textarea" :rows="2" placeholder="请输入备注1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注2" prop="remarks2">
            <el-input v-model="form.remarks2" type="textarea" :rows="2" placeholder="请输入备注2" />
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
const formRef = ref()

// 表单数据
const form = reactive({
  sequence_number: '',
  region: '',
  department: '',
  position: '',
  name: '',
  gender: '',
  ethnicity: '',
  political_status: '',
  employee_type: '',
  insurance_type: '',
  birth_date: '',
  birthday: '',
  entry_date: '',
  actual_regularization_date: '',
  remarks: '',
  contract_end_date: '',
  work_age_months: null,
  id_card_number: '',
  id_card_address: '',
  age: null,
  hometown: '',
  graduation_school: '',
  major: '',
  education: '',
  education_method: '',
  graduation_date: '',
  interviewer_name: '',
  marital_status: '',
  current_address: '',
  personal_contact: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  bank_card_number: '',
  bank_branch_info: '',
  labor_relation_affiliation: '',
  social_insurance_affiliation: '',
  non_compete_agreement: '',
  confidentiality_agreement: '',
  remarks1: '',
  remarks2: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  position: [{ required: true, message: '请输入岗位', trigger: 'blur' }],
  region: [{ required: true, message: '请输入区域', trigger: 'blur' }],
  entry_date: [{ required: true, message: '请选择入职时间', trigger: 'change' }],
  id_card_number: [
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  personal_contact: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    resetForm()
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
    if (typeof form[key] === 'string') {
      form[key] = ''
    } else {
      form[key] = null
    }
  })
}

// 计算年龄
const calculateAge = () => {
  if (form.birth_date) {
    const birthDate = new Date(form.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    form.age = age

    // 自动填入生日（MM-DD格式）
    const month = String(birthDate.getMonth() + 1).padStart(2, '0')
    const day = String(birthDate.getDate()).padStart(2, '0')
    form.birthday = `${month}-${day}`
  }
}

// 计算工龄
const calculateWorkAge = () => {
  if (form.entry_date) {
    const entryDate = new Date(form.entry_date)
    const today = new Date()

    const yearDiff = today.getFullYear() - entryDate.getFullYear()
    const monthDiff = today.getMonth() - entryDate.getMonth()

    let totalMonths = yearDiff * 12 + monthDiff

    if (today.getDate() < entryDate.getDate()) {
      totalMonths--
    }

    form.work_age_months = Math.max(0, totalMonths)
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
    if (submitData.birth_date) {
      submitData.birth_date = new Date(submitData.birth_date).toISOString().split('T')[0]
    }
    if (submitData.entry_date) {
      submitData.entry_date = new Date(submitData.entry_date).toISOString().split('T')[0]
    }
    if (submitData.actual_regularization_date) {
      submitData.actual_regularization_date = new Date(submitData.actual_regularization_date).toISOString().split('T')[0]
    }
    if (submitData.contract_end_date) {
      submitData.contract_end_date = new Date(submitData.contract_end_date).toISOString().split('T')[0]
    }
    if (submitData.graduation_date) {
      submitData.graduation_date = new Date(submitData.graduation_date).toISOString().split('T')[0]
    }

    await employeeApi.postRoster(submitData)

    ElMessage.success('员工添加成功')
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
.add-employee-form {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 10px;
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
