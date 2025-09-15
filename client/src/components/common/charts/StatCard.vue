<template>
  <div :class="['stat-card', type]">
    <div class="stat-content">
      <div class="stat-label">{{ title }}</div>
      <div class="stat-number" :class="{ 'animating': isAnimating }">
        {{ formatNumber(animatedValue) }}{{ suffix }}
      </div>
      <div v-if="growth !== null" class="stat-growth">
        <el-icon :class="growthClass">
          <component :is="growthIcon" />
        </el-icon>
        <span :class="growthClass">
          {{ growthType === 'month' ? '环比' : '同比' }}
          {{ Math.abs(growth) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  growth: {
    type: Number,
    default: null
  },
  growthType: {
    type: String,
    default: 'month',
    validator: (value) => ['month', 'year'].includes(value)
  },
  suffix: {
    type: String,
    default: ''
  },
  // 新增动画相关props
  animated: {
    type: Boolean,
    default: true
  },
  animationDuration: {
    type: Number,
    default: 2000 // 动画持续时间（毫秒）
  }
})

// 动画相关状态
const animatedValue = ref(0)
const isAnimating = ref(false)

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 数字递增动画函数
const animateValue = (start, end, duration) => {
  if (!props.animated) {
    animatedValue.value = end
    return
  }

  isAnimating.value = true
  const startTime = performance.now()
  const difference = end - start

  const step = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数（easeOutCubic）
    const easeOutCubic = 1 - Math.pow(1 - progress, 3)
    animatedValue.value = Math.round(start + difference * easeOutCubic)
    
    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      animatedValue.value = end
      isAnimating.value = false
    }
  }
  
  requestAnimationFrame(step)
}

// 监听value变化，触发动画
watch(() => props.value, (newValue) => {
  if (newValue !== undefined && newValue !== null) {
    animateValue(animatedValue.value, newValue, props.animationDuration)
  }
}, { immediate: true })

// 组件挂载时开始动画
onMounted(() => {
  if (props.value !== undefined && props.value !== null) {
    animateValue(0, props.value, props.animationDuration)
  }
})

// 增长率样式类
const growthClass = computed(() => {
  if (props.growth === null || props.growth === 0) return ''
  return props.growth > 0 ? 'growth-positive' : 'growth-negative'
})

// 增长率图标
const growthIcon = computed(() => {
  if (props.growth === null || props.growth === 0) return Minus
  return props.growth > 0 ? ArrowUp : ArrowDown
})
</script>

<style scoped>
.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 120px;
  display: flex;
  align-items: center;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(30px, -30px);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.warning {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card.danger {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-card.info {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.stat-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stat-label {
  font-size: 18px;
  opacity: 0.95;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin: 0;
  margin-bottom: 8px;
  text-align: center;
  transition: all 0.3s ease;
}

/* 动画中的数字样式 */
.stat-number.animating {
  transform: scale(1.05);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.stat-growth {
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 500;
  opacity: 0.95;
  text-align: center;
}

/* 默认增长率颜色（白色背景卡片） */
.growth-positive {
  color: rgba(255, 255, 255, 0.9);
}

.growth-negative {
  color: rgba(255, 255, 255, 0.9);
}

/* info类型卡片的增长率颜色（浅色背景） */
.stat-card.info .growth-positive {
  color: #529b2e;
}

.stat-card.info .growth-negative {
  color: #c45656;
}

/* 为所有深色背景卡片设置白色增长率文字 */
.stat-card.primary .stat-growth,
.stat-card.success .stat-growth,
.stat-card.warning .stat-growth,
.stat-card.danger .stat-growth {
  color: rgba(255, 255, 255, 0.9);
}

/* 增长率图标颜色 */
.stat-card.primary .growth-positive,
.stat-card.success .growth-positive,
.stat-card.warning .growth-positive,
.stat-card.danger .growth-positive {
  color: rgba(255, 255, 255, 0.9);
}

.stat-card.primary .growth-negative,
.stat-card.success .growth-negative,
.stat-card.warning .growth-negative,
.stat-card.danger .growth-negative {
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .stat-card {
    height: 120px;
    padding: 20px;
  }
  
  .stat-number {
    font-size: 28px;
  }
  
  .stat-label {
    font-size: 16px;
  }
  
  .stat-growth {
    font-size: 11px;
  }
}
</style>
