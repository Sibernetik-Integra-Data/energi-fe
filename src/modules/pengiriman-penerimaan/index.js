import PengirimanPenerimaanView from './view.vue'
import { createPengirimanPenerimaanController } from './controller'

const controller = createPengirimanPenerimaanController()

export default {
  routes: [
    {
      path: '/pengiriman-penerimaan',
      name: 'Pengiriman & Penerimaan',
      component: PengirimanPenerimaanView,
      props: { controller }
    }
  ]
}
