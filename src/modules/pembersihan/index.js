import PembersihanView from './view.vue'
import { createPembersihanController } from './controller'

const controller = createPembersihanController()

export default {
  routes: [
    {
      path: '/pembersihan',
      name: 'Pembersihan',
      component: PembersihanView,
      props: { controller }
    }
  ]
}
