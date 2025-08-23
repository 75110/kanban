<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <el-icon v-if="isCollapse" class="logo-icon"><OfficeBuilding /></el-icon>
        <span v-else class="logo-text">人事数据看板</span>
      </div>
      
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

        <el-menu-item index="/resignation-monitoring">
          <el-icon><UserFilled /></el-icon>
          <template #title>离职监控</template>
        </el-menu-item>
        
        <el-menu-item index="/personnel-changes">
          <el-icon><Switch /></el-icon>
          <template #title>人员异动</template>
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
          
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  OfficeBuilding,
  DataAnalysis,
  User,
  UserFilled,
  Switch,
  Fold,
  Expand,
  Avatar,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前页面标题
const currentPageTitle = computed(() => {
  const titleMap = {
    '/dashboard': '数据看板',
    '/employee-roster': '员工花名册',
    '/resignation-monitoring': '离职监控',
    '/personnel-changes': '人员异动'
  }
  return titleMap[route.path] || '数据看板'
})

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
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

.breadcrumb {
  font-size: 14px;
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
  
  .breadcrumb {
    display: none;
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
