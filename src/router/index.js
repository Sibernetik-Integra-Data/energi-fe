import { createRouter, createWebHistory } from 'vue-router'
import DashboardModule from '../modules/dashboard'
import PekerjaModule from '../modules/pekerja'
import SensusModule from '../modules/sensus'
import PlanningModule from '../modules/planning'
import PembersihanModule from '../modules/pembersihan'
import PemupukanModule from '../modules/pemupukan'
import PengirimanPenerimaanModule from '../modules/pengiriman-penerimaan'
import BlocksModule from '../modules/masterdata/blocks'
import DriverModule from '../modules/masterdata/driver'
import VehicleModule from '../modules/masterdata/vehicle'
import AktifitasKebunModule from '../modules/masterdata/aktifitas-kebun'
import GroupOfWorkModule from '../modules/masterdata/group-of-work'
import SensusProgressStatusModule from '../modules/masterdata/sensus-progress-status'
import LocationsModule from '../modules/masterdata/locations'
import ProfileModule from '../modules/profile'
import navigation from '../modules/shared/navigation'
import ComingSoon from '../components/ComingSoon.vue'
import { isAuthenticated, redirectToKeycloakLogin, tryRestoreSession } from '../auth/keycloak'

const routes = [
  { path: '/', redirect: '/dashboard', meta: { requiresAuth: true } },
  ...DashboardModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...PekerjaModule.routes.map(route => ({
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
  })),
  ...PlanningModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...PembersihanModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...PemupukanModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...PengirimanPenerimaanModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...BlocksModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...DriverModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...VehicleModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...AktifitasKebunModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...GroupOfWorkModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...SensusProgressStatusModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...LocationsModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  })),
  ...ProfileModule.routes.map(route => ({
    ...route,
    meta: route.meta
      ? { ...route.meta, requiresAuth: true }
      : { requiresAuth: true }
  }))
]

function collectNavigationRoutes(items) {
  const collected = []

  items.forEach((item) => {
    if (item?.to) {
      collected.push({ path: item.to, name: item.label })
    }

    if (Array.isArray(item?.children) && item.children.length > 0) {
      collected.push(...collectNavigationRoutes(item.children))
    }
  })

  return collected
}

// Add placeholder routes for navigation items without modules
const existingPaths = new Set(routes.map(r => r.path))
collectNavigationRoutes(navigation).forEach((item) => {
  if (!existingPaths.has(item.path)) {
    routes.push({
      path: item.path,
      name: item.name,
      component: ComingSoon,
      props: { title: item.name },
      meta: { requiresAuth: true }
    })
    existingPaths.add(item.path)
  }
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
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

  // Try to silently restore session via httpOnly refresh-token cookie.
  // On page reload the in-memory access token is gone, but the cookie may still be valid.
  const restored = await tryRestoreSession()
  if (restored) {
    return true
  }

  redirectToKeycloakLogin()
  return false
})

export default router
