<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : sidebarWidth" class="sidebar">
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item 
          v-for="item in menuItems" 
          :key="item.index"
          :index="item.index" 
          @click="() => handleMenuClick(item.index)"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
      
      <div class="sidebar-footer" @click="toggleCollapse">
        <div class="collapse-btn">
          <el-icon>
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
        </div>
      </div>
    </el-aside>
    
    <!-- 主内容区域 -->
    <el-container class="main-container">
      <el-header class="main-header">
        <div class="header-left">
          <img :src="logoSrc" :alt="logoAlt" class="header-logo" />
          <span class="header-title">{{ headerTitle }}</span>
        </div>
        
        <div class="header-right">
          <slot name="header-actions">
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </slot>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Expand, 
  Fold, 
  Refresh 
} from '@element-plus/icons-vue'

// 定义接口
interface MenuItem {
  index: string
  title: string
  icon: any
}

// 定义props
interface Props {
  menuItems: MenuItem[]
  headerTitle?: string
  logoSrc?: string
  logoAlt?: string
  sidebarWidth?: string
  gradientColors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  headerTitle: '数据看板',
  logoSrc: '/LOGO.png',
  logoAlt: 'Logo',
  sidebarWidth: '160px',
  gradientColors: () => ['#4A90E2', '#2478f2', '#1a9eff']
})

// 定义事件
const emit = defineEmits<{
  'menu-click': [path: string]
  'refresh': []
}>()

const route = useRoute()
const router = useRouter()

// 响应式数据
const isCollapse = ref(false)

// 计算属性
const activeMenu = computed(() => route.path)

const gradientStyle = computed(() => {
  const colors = props.gradientColors
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`
})

// 方法
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleMenuClick = (path: string) => {
  console.log('点击菜单:', path)
  emit('menu-click', path)
  router.push(path).catch(err => {
    console.error('路由跳转失败:', err)
  })
}

const refreshData = () => {
  emit('refresh')
  ElMessage.success('数据已刷新')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: v-bind(gradientStyle);
  transition: width 0.3s;
  overflow: hidden;
  overflow-x: hidden;
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-top-right-radius: 100px;
  border-bottom-right-radius: 100px;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-menu {
  border: none;
  background: transparent;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏webkit内核浏览器的滚动条 */
.sidebar-menu::-webkit-scrollbar {
  display: none;
}

.sidebar-menu .el-menu-item {
  color: #ffffff;
  background: transparent;
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  transform: translateX(2px);
  margin-right: 0;
  border-radius: 8px 0 0 8px;
  width: calc(100% - 8px);
  box-sizing: border-box;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-left: 3px solid #ffffff;
  margin-right: 0;
  border-radius: 8px 0 0 8px;
}

.sidebar-footer {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-bottom-right-radius: 100px;
}

.sidebar-footer:hover {
  background: rgba(255, 255, 255, 0.1);
}

.collapse-btn {
  color: #ffffff;
  font-size: 16px;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  color: #ffffff;
  transform: scale(1.1);
}

.main-container {
  background: #f5f5f5;
}

.main-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  margin-left: v-bind('"-" + sidebarWidth');
  padding-left: calc(v-bind('sidebarWidth') + 20px);
  border-top-right-radius: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  margin-right: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  padding: 0;
  background: transparent;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>