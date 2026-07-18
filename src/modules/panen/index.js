import PanenView from './view.vue'
import { createPanenController } from './controller'

const controller = createPanenController()

export default {
  routes: [
    {
      path: '/panen',
      name: 'Panen',
      component: PanenView,
      props: { controller }
    }
  ]
}
