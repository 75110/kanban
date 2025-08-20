import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import EmployeeRoster from '../views/EmployeeRoster.vue'
import ResignationMonitoring from '../views/ResignationMonitoring.vue'
import PersonnelChanges from '../views/PersonnelChanges.vue'

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
    path: '/resignation-monitoring',
    name: 'ResignationMonitoring',
    component: ResignationMonitoring,
    meta: { title: '离职监控' }
  },
  {
    path: '/personnel-changes',
    name: 'PersonnelChanges',
    component: PersonnelChanges,
    meta: { title: '人员异动' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
