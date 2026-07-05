import PemupukanView from './view.vue'
import { createPemupukanController } from './controller'

const controller = createPemupukanController()

export default {
  routes: [
    {
      path: '/pemupukan',
      name: 'Pemupukan',
      component: PemupukanView,
      props: { controller }
    }
  ]
}

