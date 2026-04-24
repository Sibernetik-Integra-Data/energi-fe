import SensusView from './view.vue'
import SensusDetailView from './view.detail.vue'
import { createSensusController } from './controller'

const controller = createSensusController()

export default {
  routes: [
    {
      path: '/sensus',
      name: 'Sensus',
      component: SensusView,
      props: { controller }
    },
    {
      path: '/sensus/:id',
      name: 'SensusDetail',
      component: SensusDetailView,
      props: route => ({ controller, id: route.params.id })
    }
  ]
}
