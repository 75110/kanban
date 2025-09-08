<template>
  <div class="column-selector">
    <el-button type="default" size="default" @click="openDialog">
      <el-icon><Setting /></el-icon>
      列显示设置
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      title="列显示设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="column-selector-content">
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button size="small" @click="selectAll">
            <el-icon><Check /></el-icon>
            全选
          </el-button>
          <el-button size="small" @click="selectNone">
            <el-icon><Close /></el-icon>
            全不选
          </el-button>
          <el-button size="small" @click="resetToDefault">
            <el-icon><Refresh /></el-icon>
            重置默认
          </el-button>
        </div>

        <!-- 列选择区域 -->
        <div class="column-grid">
          <div class="column-item" v-for="column in availableColumns" :key="column.prop">
            <el-checkbox
              v-model="column.visible"
              @change="handleColumnChange"
            >
              {{ column.label }}
            </el-checkbox>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Setting, ArrowDown, Check, Close, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  // 所有可用的列配置
  columns: {
    type: Array,
    required: true,
    default: () => []
  },
  // 页面标识，用于存储不同的列显示偏好
  pageKey: {
    type: String,
    required: true
  },
  // 默认显示的列
  defaultVisibleColumns: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible-columns'])

// 对话框显示状态
const dialogVisible = ref(false)

// 可用的列配置
const availableColumns = ref([])

// 初始化列配置
const initColumns = () => {
  // 从localStorage获取保存的列显示偏好
  const savedColumns = getSavedColumns()
  
  availableColumns.value = props.columns.map(column => {
    const savedColumn = savedColumns.find(c => c.prop === column.prop)
    return {
      ...column,
      visible: savedColumn ? savedColumn.visible : (props.defaultVisibleColumns.includes(column.prop) || column.visible !== false)
    }
  })
  
  // 触发初始更新
  updateVisibleColumns()
}

// 获取保存的列显示偏好
const getSavedColumns = () => {
  try {
    const saved = localStorage.getItem(`column-settings-${props.pageKey}`)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('获取列设置失败:', error)
    return []
  }
}

// 保存列显示偏好
const saveColumns = () => {
  try {
    const columnsToSave = availableColumns.value.map(col => ({
      prop: col.prop,
      visible: col.visible
    }))
    localStorage.setItem(`column-settings-${props.pageKey}`, JSON.stringify(columnsToSave))
  } catch (error) {
    console.error('保存列设置失败:', error)
  }
}

// 更新可见列
const updateVisibleColumns = () => {
  const visibleColumns = availableColumns.value
    .filter(col => col.visible)
    .map(col => col.prop)
  emit('update:visible-columns', visibleColumns)
}

// 处理列显示变化
const handleColumnChange = () => {
  // 实时更新，不需要等待确认
  updateVisibleColumns()
}

// 全选
const selectAll = () => {
  availableColumns.value.forEach(col => {
    col.visible = true
  })
  updateVisibleColumns()
}

// 全不选
const selectNone = () => {
  availableColumns.value.forEach(col => {
    col.visible = false
  })
  updateVisibleColumns()
}

// 重置为默认设置
const resetToDefault = () => {
  availableColumns.value.forEach(col => {
    col.visible = props.defaultVisibleColumns.includes(col.prop) || col.visible !== false
  })
  updateVisibleColumns()
  saveColumns()
}

// 打开对话框
const openDialog = () => {
  dialogVisible.value = true
}

// 确认设置
const handleConfirm = () => {
  saveColumns()
  dialogVisible.value = false
}

// 取消设置
const handleCancel = () => {
  // 恢复之前保存的设置
  initColumns()
  dialogVisible.value = false
}

// 监听columns变化
watch(() => props.columns, () => {
  initColumns()
}, { immediate: true, deep: true })

// 暴露方法给父组件
defineExpose({
  openDialog
})
</script>

<style scoped>
.column-selector {
  display: inline-block;
}

.column-selector-content {
  padding: 10px 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.column-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
}

.column-item {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.column-item:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.column-item .el-checkbox {
  width: 100%;
}

.column-item .el-checkbox__label {
  font-size: 14px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .column-grid {
    grid-template-columns: 1fr;
    max-height: 300px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>
