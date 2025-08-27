<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1000px" :before-close="handleClose" destroy-on-close>
    <el-tabs v-model="activeTab" type="card">
      <!-- 基本信息编辑 -->
      <el-tab-pane label="基本信息" name="basic">
        <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-width="140px" class="edit-form">
          <!-- 基本信息 -->
          <el-divider content-position="left">基本信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="序列" prop="sequence_number">
                <el-input v-model="basicForm.sequence_number" placeholder="请输入序列号" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="区域" prop="region">
                <el-select v-model="basicForm.region" placeholder="请输入区域" clearable>
                  <el-option v-for="reg in regions" :key="reg.id" :label="reg.region" :value="reg.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="部门" prop="department">
                <el-select v-model="basicForm.department" placeholder="请输入部门" clearable>
                  <el-option v-for="dept in departments" :key="dept.id" :label="dept.department" :value="dept.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="岗位" prop="position">
                <el-select v-model="basicForm.position" placeholder="请输入岗位" clearable>
                  <el-option v-for="pst in positions" :key="pst.id" :label="pst.position" :value="pst.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="名字" prop="name">
                <el-input v-model="basicForm.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="性别" prop="gender">
                <el-select v-model="basicForm.gender" placeholder="请选择性别" style="width: 100%">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="民族" prop="ethnicity">
                <el-input v-model="basicForm.ethnicity" placeholder="请输入民族" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="政治面貌" prop="political_status">
                <el-select v-model="basicForm.political_status" placeholder="请选择政治面貌" style="width: 100%">
                  <el-option label="群众" value="群众" />
                  <el-option label="共青团员" value="共青团员" />
                  <el-option label="中共党员" value="中共党员" />
                  <el-option label="民主党派" value="民主党派" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="员工性质" prop="employee_type">
                <el-select v-model="basicForm.employee_type" placeholder="请选择员工性质" style="width: 100%">
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
                <el-select v-model="basicForm.insurance_type" placeholder="请选择险种" style="width: 100%">
                  <el-option label="社保" value="社保" />
                  <el-option label="工伤" value="工伤" />
                  <el-option label="无" value="无" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="出生日期" prop="birth_date">
                <el-date-picker v-model="basicForm.birth_date" type="date" placeholder="选择出生日期" style="width: 100%"
                  @change="calculateAge" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="生日" prop="birthday">
                <el-input v-model="basicForm.birthday" placeholder="MM-DD格式，如：01-15" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="婚姻状况" prop="marital_status">
                <el-select v-model="basicForm.marital_status" placeholder="请选择婚姻状况" style="width: 100%">
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
                <el-date-picker v-model="basicForm.entry_date" type="date" placeholder="选择入职时间" style="width: 100%"
                  @change="calculateWorkAge" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="实际转正日期" prop="actual_regularization_date">
                <el-date-picker v-model="basicForm.actual_regularization_date" type="date" placeholder="选择转正日期"
                  style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="合同终止日期" prop="contract_end_date">
                <el-date-picker v-model="basicForm.contract_end_date" type="date" placeholder="选择合同终止日期"
                  style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="工龄（月）" prop="work_age_months">
                <el-input-number v-model="basicForm.work_age_months" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="年龄" prop="age">
                <el-input-number v-model="basicForm.age" :min="0" :max="100" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="面试官姓名" prop="interviewer_name">
                <el-input v-model="basicForm.interviewer_name" placeholder="请输入面试官姓名" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 身份信息 -->
          <el-divider content-position="left">身份信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="身份证号" prop="id_card_number">
                <el-input v-model="basicForm.id_card_number" placeholder="请输入身份证号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="籍贯" prop="hometown">
                <el-input v-model="basicForm.hometown" placeholder="请输入籍贯" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="身份证地址" prop="id_card_address">
                <el-input v-model="basicForm.id_card_address" placeholder="请输入身份证地址" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="现居住地" prop="current_address">
                <el-input v-model="basicForm.current_address" placeholder="请输入现居住地" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 教育信息 -->
          <el-divider content-position="left">教育信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="毕业院校" prop="graduation_school">
                <el-input v-model="basicForm.graduation_school" placeholder="请输入毕业院校" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="专业" prop="major">
                <el-input v-model="basicForm.major" placeholder="请输入专业" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="学历" prop="education">
                <el-select v-model="basicForm.education" placeholder="请选择学历" style="width: 100%">
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
                <el-select v-model="basicForm.education_method" placeholder="请选择教育方式" style="width: 100%">
                  <el-option label="全日制" value="全日制" />
                  <el-option label="非全日制" value="非全日制" />
                  <el-option label="自考" value="自考" />
                  <el-option label="成人教育" value="成人教育" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="毕业日期" prop="graduation_date">
                <el-date-picker v-model="basicForm.graduation_date" type="date" placeholder="选择毕业日期"
                  style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 联系信息 -->
          <el-divider content-position="left">联系信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="本人联系方式" prop="personal_contact">
                <el-input v-model="basicForm.personal_contact" placeholder="请输入联系方式" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="紧急联系人姓名" prop="emergency_contact_name">
                <el-input v-model="basicForm.emergency_contact_name" placeholder="请输入紧急联系人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="紧急联系人电话" prop="emergency_contact_phone">
                <el-input v-model="basicForm.emergency_contact_phone" placeholder="请输入紧急联系人电话" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 银行信息 -->
          <el-divider content-position="left">银行信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="银行卡号" prop="bank_card_number">
                <el-input v-model="basicForm.bank_card_number" placeholder="请输入银行卡号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="详细支行信息" prop="bank_branch_info">
                <el-input v-model="basicForm.bank_branch_info" placeholder="请输入详细支行信息" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 隶属信息 -->
          <el-divider content-position="left">隶属信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="劳动关系隶属(*)" prop="labor_relation_affiliation">
                <el-input v-model="basicForm.labor_relation_affiliation" placeholder="请输入劳动关系隶属" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="社保隶属(*)" prop="social_insurance_affiliation">
                <el-input v-model="basicForm.social_insurance_affiliation" placeholder="请输入社保隶属" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 协议信息 -->
          <el-divider content-position="left">协议信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="竞业协议" prop="non_compete_agreement">
                <el-select v-model="basicForm.non_compete_agreement" placeholder="请选择" style="width: 100%">
                  <el-option label="是" value="是" />
                  <el-option label="否" value="否" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保密协议" prop="confidentiality_agreement">
                <el-select v-model="basicForm.confidentiality_agreement" placeholder="请选择" style="width: 100%">
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
                <el-input v-model="basicForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="备注1" prop="remarks1">
                <el-input v-model="basicForm.remarks1" type="textarea" :rows="2" placeholder="请输入备注1" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注2" prop="remarks2">
                <el-input v-model="basicForm.remarks2" type="textarea" :rows="2" placeholder="请输入备注2" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <!-- 离职操作 -->
      <el-tab-pane label="离职操作" name="resignation">
        <el-form ref="resignationFormRef" :model="resignationForm" :rules="resignationRules" label-width="120px"
          class="edit-form">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="离职时间" prop="resignation_date">
                <el-date-picker v-model="resignationForm.resignation_date" type="date" placeholder="选择离职时间"
                  style="width: 100%" />
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
                <el-input v-model="resignationForm.resignation_reason" type="textarea" :rows="3"
                  placeholder="请输入离职原因" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注" prop="resignation_remarks">
                <el-input v-model="resignationForm.resignation_remarks" type="textarea" :rows="3"
                  placeholder="请输入备注信息" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <!-- 调动操作 -->
      <el-tab-pane label="调动操作" name="transfer">
        <el-form ref="transferFormRef" :model="transferForm" :rules="transferRules" label-width="120px"
          class="edit-form">
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
              <el-form-item label="原部门" prop="original_department">
                <el-input v-model="transferForm.original_department" placeholder="原部门（自动填入）" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="新部门" prop="new_department">
                <el-select v-model="transferForm.new_department" placeholder="请选择新部门" style="width: 100%">
                  <el-option label="总经办" value="总经办" />
                  <el-option label="销售部" value="销售部" />
                  <el-option label="技术部" value="技术部" />
                  <el-option label="人事部" value="人事部" />
                  <el-option label="财务部" value="财务部" />
                  <el-option label="市场部" value="市场部" />
                  <el-option label="运营部" value="运营部" />
                  <el-option label="客服部" value="客服部" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="异动时间" prop="change_date">
                <el-date-picker v-model="transferForm.change_date" type="date" placeholder="选择异动时间"
                  style="width: 100%" />
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
                <el-input v-model="transferForm.change_remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { employeeApi } from '@/api'
import { commonApi } from '../api'

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
const regions = ref([])
const departments = ref([])
const positions = ref([])

// 表单引用
const basicFormRef = ref()
const resignationFormRef = ref()
const transferFormRef = ref()

// 基本信息表单（完整40个字段）
const basicForm = reactive({
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
  remarks2: '',
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
  original_department: '',
  original_position: '',
  new_department: '',
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
  new_department: [{ required: true, message: '请选择新部门', trigger: 'change' }],
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

  // 基本信息表单（完整40个字段）
  basicForm.sequence_number = data.sequence_number || ''
  basicForm.region = data.region || ''
  basicForm.department = data.department || ''
  basicForm.position = data.position || ''
  basicForm.name = data.name || ''
  basicForm.gender = data.gender || ''
  basicForm.ethnicity = data.ethnicity || ''
  basicForm.political_status = data.political_status || ''
  basicForm.employee_type = data.employee_type || ''
  basicForm.insurance_type = data.insurance_type || ''
  basicForm.birth_date = data.birth_date || ''
  basicForm.birthday = data.birthday || ''
  basicForm.entry_date = data.entry_date || ''
  basicForm.actual_regularization_date = data.actual_regularization_date || ''
  basicForm.remarks = data.remarks || ''
  basicForm.contract_end_date = data.contract_end_date || ''
  basicForm.work_age_months = data.work_age_months || null
  basicForm.id_card_number = data.id_card_number || ''
  basicForm.id_card_address = data.id_card_address || ''
  basicForm.age = data.age || null
  basicForm.hometown = data.hometown || ''
  basicForm.graduation_school = data.graduation_school || ''
  basicForm.major = data.major || ''
  basicForm.education = data.education || ''
  basicForm.education_method = data.education_method || ''
  basicForm.graduation_date = data.graduation_date || ''
  basicForm.interviewer_name = data.interviewer_name || ''
  basicForm.marital_status = data.marital_status || ''
  basicForm.current_address = data.current_address || ''
  basicForm.personal_contact = data.personal_contact || ''
  basicForm.emergency_contact_name = data.emergency_contact_name || ''
  basicForm.emergency_contact_phone = data.emergency_contact_phone || ''
  basicForm.bank_card_number = data.bank_card_number || ''
  basicForm.bank_branch_info = data.bank_branch_info || ''
  basicForm.labor_relation_affiliation = data.labor_relation_affiliation || ''
  basicForm.social_insurance_affiliation = data.social_insurance_affiliation || ''
  basicForm.non_compete_agreement = data.non_compete_agreement || ''
  basicForm.confidentiality_agreement = data.confidentiality_agreement || ''
  basicForm.remarks1 = data.remarks1 || ''
  basicForm.remarks2 = data.remarks2 || ''
  basicForm.originalName = data.name || ''

  // 调动表单自动填入信息
  transferForm.department = data.department || ''
  transferForm.name = data.name || ''
  transferForm.original_department = data.department || ''
  transferForm.original_position = data.position || ''
  transferForm.new_department = ''
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

// 计算年龄
const calculateAge = () => {
  if (basicForm.birth_date) {
    const birthDate = new Date(basicForm.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    basicForm.age = age

    // 自动填入生日（MM-DD格式）
    const month = String(birthDate.getMonth() + 1).padStart(2, '0')
    const day = String(birthDate.getDate()).padStart(2, '0')
    basicForm.birthday = `${month}-${day}`
  }
}

// 计算工龄
const calculateWorkAge = () => {
  if (basicForm.entry_date) {
    const entryDate = new Date(basicForm.entry_date)
    const today = new Date()

    const yearDiff = today.getFullYear() - entryDate.getFullYear()
    const monthDiff = today.getMonth() - entryDate.getMonth()

    let totalMonths = yearDiff * 12 + monthDiff

    if (today.getDate() < entryDate.getDate()) {
      totalMonths--
    }

    basicForm.work_age_months = Math.max(0, totalMonths)
  }
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
    // 处理日期格式 - 避免时区转换问题
    const formatDateSafely = (date) => {
      if (!date) return null
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // 如果已经是YYYY-MM-DD格式，直接返回
        return date
      }
      if (date instanceof Date) {
        // 使用本地时间格式化，避免时区转换
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      return null
    }

    const submitData = { ...basicForm }
    if (submitData.birth_date) {
      submitData.birth_date = formatDateSafely(submitData.birth_date)
    }
    if (submitData.entry_date) {
      submitData.entry_date = formatDateSafely(submitData.entry_date)
    }
    if (submitData.actual_regularization_date) {
      submitData.actual_regularization_date = formatDateSafely(submitData.actual_regularization_date)
    }
    if (submitData.contract_end_date) {
      submitData.contract_end_date = formatDateSafely(submitData.contract_end_date)
    }
    if (submitData.graduation_date) {
      submitData.graduation_date = formatDateSafely(submitData.graduation_date)
    }

    const employeeId = props.employeeData.sequence_number || props.employeeData.name
    await employeeApi.updateRoster(employeeId, submitData)

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
onMounted(async () => {
  commonApi.getCommonData().then(data => {
    departments.value = data.departments
    positions.value = data.positions
    regions.value = data.regions
  })
})
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
