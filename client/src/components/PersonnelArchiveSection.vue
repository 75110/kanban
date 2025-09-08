<template>
  <div class="personnel-archive-section">
    <!-- 档案内容 -->
    <div class="archive-container" v-loading="props.loading">
      <!-- 个人信息 -->
      <div class="info-block personal-info">
        <h3 class="section-title">个人信息</h3>
        <div class="info-items">
          <div class="info-item">
            <div class="info-icon">
              <el-icon><User /></el-icon>
            </div>
            <span class="info-label">姓名</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.name || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <span class="info-label">年龄</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.age || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Flag /></el-icon>
            </div>
            <span class="info-label">民族</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.ethnicity || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Location /></el-icon>
            </div>
            <span class="info-label">户籍地</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.household_registration || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Male /></el-icon>
            </div>
            <span class="info-label">性别</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.gender || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <span class="info-label">出生年月</span>
            <span class="info-value">{{ formatDate(props.employeeData?.basicInfo?.birth_date) || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Phone /></el-icon>
            </div>
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.phone || '-' }}</span>
          </div>

          <div class="info-item">
            <div class="info-icon">
              <el-icon><User /></el-icon>
            </div>
            <span class="info-label">紧急联系人</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.emergency_contact_name || '-' }}</span>
          </div>

          <div class="info-item">
            <div class="info-icon">
              <el-icon><Phone /></el-icon>
            </div>
            <span class="info-label">紧急联系电话</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.emergency_contact_phone || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 工作信息 -->
      <div class="info-block work-info">
        <h3 class="section-title">工作信息</h3>
        <div class="info-items">
          <div class="info-item">
            <div class="info-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <span class="info-label">所在部门</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.department || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Briefcase /></el-icon>
            </div>
            <span class="info-label">所在岗位</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.position || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <span class="info-label">司龄 （年）</span>
            <span class="info-value">{{ calculateTenure(props.employeeData?.basicInfo?.entry_date) || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Medal /></el-icon>
            </div>
            <span class="info-label">职称</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.job_title || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <span class="info-label">所在小组</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.team || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Star /></el-icon>
            </div>
            <span class="info-label">员工性质</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.rank || '-' }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <span class="info-label">工龄 （月）</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.work_years || 0 }}</span>
          </div>
          <div class="info-item">
            <div class="info-icon">
              <el-icon><Document /></el-icon>
            </div>
            <span class="info-label">险种</span>
            <span class="info-value">{{ props.employeeData?.basicInfo?.contract_type || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 奖状荣誉 -->
      <div class="info-block certificates-section">
        <h3 class="section-title">奖状荣誉</h3>
        <div class="subsection">
          <div class="vertical-label">奖状荣誉</div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>获奖时间</th>
                  <th>获奖名称</th>
                  <th>金额</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(award, index) in (props.employeeData?.awards || [])" :key="`award_${index}`">
                  <td>{{ formatAwardDate(award) }}</td>
                  <td>{{ award.award_name || '-' }}</td>
                  <td>{{ award.award_amount ? `¥${award.award_amount}` : '-' }}</td>
                </tr>
                <tr v-if="!props.employeeData?.awards || props.employeeData.awards.length === 0">
                  <td colspan="3" class="no-data">暂无证书记录</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 调动 -->
      <div class="info-block transfers-section">
        <h3 class="section-title">调动</h3>
        <div class="subsection">
          <div class="vertical-label">调动记录</div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>调动时间</th>
                  <th>原岗位</th>
                  <th>新岗位</th>
                  <th>调动原因</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(change, index) in (props.employeeData?.changes || [])" :key="`change_${index}`">
                  <td>{{ formatDate(change.change_date) || '-' }}</td>
                  <td>{{ change.original_position || '-' }}</td>
                  <td>{{ change.new_position || '-' }}</td>
                  <td>{{ change.change_reason || '-' }}</td>
                </tr>
                <tr v-if="!props.employeeData?.changes || props.employeeData.changes.length === 0">
                  <td colspan="4" class="no-data">暂无调动记录</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 教育与工作履历 -->
      <div class="info-block education-section">
        <h3 class="section-title">教育与工作履历</h3>
        <div class="subsection">
          <div class="vertical-label">教育经历</div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>教育起始时间</th>
                  <th>教育截止时间</th>
                  <th>院校</th>
                  <th>专业</th>
                  <th>学历</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ formatDate(props.employeeData?.basicInfo?.education_start_date) || '-' }}</td>
                  <td>{{ formatDate(props.employeeData?.basicInfo?.education_end_date) || '-' }}</td>
                  <td>{{ props.employeeData?.basicInfo?.education_school || '-' }}</td>
                  <td>{{ props.employeeData?.basicInfo?.education_major || '-' }}</td>
                  <td>{{ props.employeeData?.basicInfo?.education_degree || '-' }}</td>
                </tr>
                <tr v-if="!props.employeeData?.basicInfo?.education_school">
                  <td colspan="5" class="no-data">暂无教育经历</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="subsection">
          <div class="vertical-label">工作履历</div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>工作起始时间</th>
                  <th>工作截止时间</th>
                  <th>工作公司</th>
                  <th>部门</th>
                  <th>职位</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ formatDate(props.employeeData?.basicInfo?.work_start_date) || '-' }}</td>
                  <td>{{ formatDate(props.employeeData?.basicInfo?.work_end_date) || '至今' }}</td>
                  <td>{{ props.employeeData?.basicInfo?.work_company || '-' }}</td>
                  <td>{{ props.employeeData?.basicInfo?.work_department || '-' }}</td>
                  <td>{{ props.employeeData?.basicInfo?.work_position || '-' }}</td>
                </tr>
                <tr v-if="!props.employeeData?.basicInfo?.work_start_date">
                  <td colspan="5" class="no-data">暂无工作履历</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { User, Calendar, Flag, Location, Male, Phone, OfficeBuilding, Briefcase, Clock, Medal, UserFilled, Star, Timer, Document } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  employeeData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

  // 格式化获奖时间（组合年份和月份）
  const formatAwardDate = (award) => {
    if (!award) return '-'
    
    const { award_year, award_date } = award
    
    // 如果年份和月份都存在
    if (award_year && award_date) {
      return `${award_year}-${award_date}`
    }
    
    // 如果只有年份
    if (award_year) {
      return `${award_year}`
    }
    
    // 如果只有月份
    if (award_date) {
      return `${award_date}`
    }
    
    return '-'
  }

// 计算司龄
const calculateTenure = (entryDate) => {
  if (!entryDate) return '-'
  const entry = new Date(entryDate)
  const now = new Date()
  const diffTime = Math.abs(now - entry)
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
  return diffYears
}
</script>

<style scoped>
.personnel-archive-section {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 120px);
}



/* 档案容器 - 使用CSS Grid布局 */
.archive-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 20px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* 信息区块 */
.info-block {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a365d;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #1a9eff;
}

/* 个人信息和工作信息 - 占据第一行 */
.personal-info {
  grid-column: 1;
  grid-row: 1;
}

.work-info {
  grid-column: 2;
  grid-row: 1;
}

/* 证书与技能和调动 - 占据第二行 */
.certificates-section {
  grid-column: 1;
  grid-row: 2;
}

.transfers-section {
  grid-column: 2;
  grid-row: 2;
}

/* 教育与工作履历 - 占据第三行，横跨两列 */
.education-section {
  grid-column: 1 / -1;
  grid-row: 3;
}

/* 信息项布局 */
.info-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: #f1f5f9;
}

.info-icon {
  width: 32px;
  height: 32px;
  background: #1a9eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 16px;
}

.info-label {
  flex: 0 0 80px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  flex: 1;
  color: #2d3748;
  font-size: 14px;
  font-weight: 600;
}

/* 子区块样式 */
.subsection {
  position: relative;
  margin-bottom: 20px;
}

.subsection:last-child {
  margin-bottom: 0;
}

.vertical-label {
  position: absolute;
  left: -20px;
  top: 0;
  background: #1a9eff;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  z-index: 1;
}

/* 数据表格 */
.table-container {
  overflow-x: auto;
  margin-left: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: #1a9eff;
  color: white;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  border: none;
}

.data-table td {
  padding: 10px 8px;
  border: none;
  color: #4a5568;
  border-bottom: 1px solid #f1f5f9;
}

.data-table tr:nth-child(even) {
  background: #f8fafc;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.no-data {
  text-align: center;
  color: #a0aec0;
  font-style: italic;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 20px;
}

.empty-state p {
  margin-top: 16px;
  font-size: 16px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .archive-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto auto;
  }
  
  .personal-info {
    grid-column: 1;
    grid-row: 1;
  }
  
  .work-info {
    grid-column: 1;
    grid-row: 2;
  }
  
  .certificates-section {
    grid-column: 1;
    grid-row: 3;
  }
  
  .transfers-section {
    grid-column: 1;
    grid-row: 4;
  }
  
  .education-section {
    grid-column: 1;
    grid-row: 5;
  }
}

@media (max-width: 768px) {
  .employee-form {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .employee-form .el-form-item {
    margin-bottom: 16px;
  }
  
  .info-items {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .info-item {
    padding: 8px 0;
  }
  
  .info-label {
    flex: 0 0 70px;
    font-size: 13px;
  }
  
  .info-value {
    font-size: 13px;
  }
  
  .vertical-label {
    position: static;
    writing-mode: horizontal-tb;
    text-orientation: initial;
    margin-bottom: 10px;
    width: auto;
    height: auto;
  }
  
  .table-container {
    margin-left: 0;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 6px;
  }
}

@media (max-width: 480px) {
  .info-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
    margin-right: 8px;
  }
  
  .info-label {
    flex: 0 0 60px;
    font-size: 12px;
  }
  
  .info-value {
    font-size: 12px;
  }
}
</style>