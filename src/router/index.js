import { createRouter, createWebHistory } from 'vue-router'
import DashboardModule from '../modules/dashboard'
import SensusModule from '../modules/sensus'
import navigation from '../modules/shared/navigation'
import ComingSoon from '../components/ComingSoon.vue'
import { isAuthenticated, redirectToKeycloakLogin } from '../auth/keycloak'

const routes = [
  { path: '/', redirect: '/dashboard', meta: { requiresAuth: true } },
  ...DashboardModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...SensusModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  }))
]

// Add placeholder routes for navigation items without modules
const existingPaths = new Set(routes.map(r => r.path))
navigation.forEach(item => {
  if (!item.to) return
  if (!existingPaths.has(item.to)) {
    routes.push({
      path: item.to,
      name: item.label,
      component: ComingSoon,
      props: { title: item.label },
      meta: { requiresAuth: true }
    })
    existingPaths.add(item.to)
  }
})

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.query?.code) {
    return true
  }

  const requiresAuth = to.matched.some(record => record.meta?.requiresAuth)
  if (!requiresAuth) {
    return true
  }

  if (isAuthenticated()) {
    return true
  }

  redirectToKeycloakLogin()
  return false
})

export default router
