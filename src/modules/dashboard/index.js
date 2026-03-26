import DashboardView from './view.vue'
import { createDashboardController } from './controller'

const controller = createDashboardController()

export default {
  routes: [
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      props: { controller }
    }
  ]
}