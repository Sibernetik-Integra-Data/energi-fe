import PlanningView from './view.vue'
import { createPlanningController } from './controller'

const controller = createPlanningController()

export default {
  routes: [
    {
      path: '/planning',
      name: 'Planning',
      component: PlanningView,
      props: { controller }
    }
  ]
}
