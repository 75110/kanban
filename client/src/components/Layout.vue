<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
        
        <el-menu-item index="/employee-roster">
          <el-icon><User /></el-icon>
          <template #title>员工花名册</template>
        </el-menu-item>

        <el-menu-item index="/employee-status-info">
          <el-icon><UserFilled /></el-icon>
          <template #title>在职离职信息</template>
        </el-menu-item>
        
        <el-menu-item index="/personnel-changes">
          <el-icon><Switch /></el-icon>
          <template #title>人员异动</template>
        </el-menu-item>
        
        <el-menu-item index="/employee-awards">
          <el-icon><Trophy /></el-icon>
          <template #title>员工获奖记录</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleCollapse"
            class="collapse-btn"
          >
            <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </el-button>

          <!-- Logo和标题 (默认显示) -->
          <div class="logo-section" v-show="!showFilterInHeader">
            <!-- Logo图片：大小由CSS中的.logo-image样式控制 -->
            <img src="@/assets/images/logo.png" alt="Logo" class="logo-image" />
            <span class="logo-title">人事数据看板</span>
          </div>

          <!-- 筛选控件 (滚动时显示) -->
          <div class="header-filter-section" v-show="showFilterInHeader">
            <slot name="header-filter"></slot>
          </div>
        </div>
        
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-icon><Avatar /></el-icon>
              <span class="username">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis,
  User,
  UserFilled,
  Switch,
  Document,
  Trophy,
  Fold,
  Expand,
  Avatar,
  ArrowDown,
  Location
} from '@element-plus/icons-vue'

const route = useRoute()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 导航栏筛选显示状态
const showFilterInHeader = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前页面标题
const currentPageTitle = computed(() => {
  const titleMap = {
    '/dashboard': '数据看板',
    '/employee-roster': '员工花名册',
    '/employee-status-info': '在职离职信息',
    '/personnel-changes': '人员异动',
    '/employee-awards': '员工获奖记录'
  }
  return titleMap[route.path] || '数据看板'
})

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 提供给子组件控制导航栏筛选显示的方法
const setShowFilterInHeader = (show) => {
  showFilterInHeader.value = show
}

// 向子组件提供控制方法
provide('setShowFilterInHeader', setShowFilterInHeader)
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4b;
  color: white;
  font-weight: bold;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  white-space: nowrap;
}

.sidebar-menu {
  border: none;
  background-color: #304156;
}

.sidebar-menu .el-menu-item {
  color: #bfcbd9;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #263445;
  color: #409eff;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: white;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  font-size: 18px;
  color: #606266;
}

/* Logo区域容器样式 - 控制logo和标题的布局 */
.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;         /* Logo和标题之间的间距：可以修改这个值来调整间距 */
  margin-left: 20px; /* 整个logo区域距离左边的距离 */
}

/* Logo图片样式 - 控制logo的大小 */
.logo-image {
  width: 200px;        /* Logo宽度：可以修改这个值来调整logo的宽度 */
  height: 48px;       /* Logo高度：可以修改这个值来调整logo的高度 */
  object-fit: contain; /* 保持图片比例，防止变形 */
}

.logo-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.header-filter-section {
  display: flex;
  align-items: center;
  margin-left: 16px;
  flex: 1;
}

.header-filter-section :deep(.el-form) {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-filter-section :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.header-filter-section :deep(.el-form-item__label) {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}



.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}

.user-info:hover {
  color: #409eff;
}

.username {
  font-weight: 500;
}

.main-content {
  background-color: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
    height: 100vh;
  }
  
  .header-left {
    gap: 12px;
  }
  

  
  .username {
    display: none;
  }
}
</style>

<style>
/* 全局样式覆盖 */
.el-menu--collapse .el-menu-item [class^=el-icon] {
  margin: 0;
  vertical-align: middle;
  width: 24px;
  text-align: center;
}

.el-menu--collapse .el-menu-item .el-tooltip__trigger {
  padding: 0 20px;
}
</style>
