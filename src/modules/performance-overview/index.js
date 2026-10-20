import PerformanceOverviewView from './view.vue'
import { createPerformanceOverviewController } from './controller'

const controller = createPerformanceOverviewController()

export default {
  routes: [{
    path: '/performance-overview',
    name: 'PerformanceOverview',
    component: PerformanceOverviewView,
    props: { controller }
  }]
}
