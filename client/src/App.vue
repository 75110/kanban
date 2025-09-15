<template>
  <div id="app">
    <CommonSidebar 
      :menu-items="menuItems"
      header-title="人事数据看板"
      @menu-click="handleMenuClick"
      @refresh="handleRefresh"
    >
      <router-view />
    </CommonSidebar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CommonSidebar from './components/common/sidebar/CommonSidebar.vue'
import { 
  DataBoard, 
  User, 
  UserFilled, 
  Switch, 
  Trophy 
} from '@element-plus/icons-vue'

const router = useRouter()

// 菜单配置
const menuItems = ref([
  {
    index: '/dashboard',
    title: '数据看板',
    icon: DataBoard
  },
  {
    index: '/employee-roster',
    title: '员工花名册',
    icon: User
  },
  {
    index: '/employee-status-info',
    title: '在职离职信息',
    icon: UserFilled
  },
  {
    index: '/personnel-changes',
    title: '人员异动',
    icon: Switch
  },
  {
    index: '/employee-awards',
    title: '员工获奖记录',
    icon: Trophy
  }
])

// 事件处理
const handleMenuClick = (path) => {
  console.log('菜单点击:', path)
}

const handleRefresh = () => {
  console.log('刷新数据')
  // 这里可以添加全局数据刷新逻辑
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga";
  color: #2c3e50;
  min-height: 100vh;
  background-color: #ffffff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
