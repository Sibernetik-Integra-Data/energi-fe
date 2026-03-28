import SensusView from './view.vue'
import { createSensusController } from './controller'

const controller = createSensusController()

export default {
  routes: [
    {
      path: '/sensus',
      name: 'Sensus',
      component: SensusView,
      props: { controller }
    }
  ]
}
