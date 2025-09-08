import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import EmployeeRoster from '../views/EmployeeRoster.vue'
import EmployeeStatusInfo from '../views/EmployeeStatusInfo.vue'
import PersonnelChanges from '../views/PersonnelChanges.vue'
import EmployeeAwards from '../views/EmployeeAwards.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '数据看板' }
  },
  {
    path: '/employee-roster',
    name: 'EmployeeRoster',
    component: EmployeeRoster,
    meta: { title: '员工花名册' }
  },
  {
    path: '/employee-status-info',
    name: 'EmployeeStatusInfo',
    component: EmployeeStatusInfo,
    meta: { title: '在职离职信息' }
  },
  {
    path: '/personnel-changes',
    name: 'PersonnelChanges',
    component: PersonnelChanges,
    meta: { title: '人员异动' }
  },

  {
    path: '/employee-awards',
    name: 'EmployeeAwards',
    component: EmployeeAwards,
    meta: { title: '员工获奖记录' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
