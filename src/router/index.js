import { createRouter, createWebHistory } from 'vue-router'
import DashboardModule from '../modules/dashboard'
import SensusModule from '../modules/sensus'
import navigation from '../modules/shared/navigation'
import ComingSoon from '../components/ComingSoon.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  ...DashboardModule.routes,
  ...SensusModule.routes
]

// Add placeholder routes for navigation items without modules
const existingPaths = new Set(routes.map(r => r.path))
navigation.forEach(item => {
  if (!item.to) return
  if (!existingPaths.has(item.to)) {
    routes.push({ path: item.to, name: item.label, component: ComingSoon, props: { title: item.label } })
    existingPaths.add(item.to)
  }
})

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
