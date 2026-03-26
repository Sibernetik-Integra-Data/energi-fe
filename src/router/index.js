import { createRouter, createWebHistory } from 'vue-router'
import DashboardModule from '../modules/dashboard'

const routes = [
  { path: '/', redirect: '/dashboard' },
  ...DashboardModule.routes
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
