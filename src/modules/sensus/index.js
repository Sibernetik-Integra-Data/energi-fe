import SensusView from './view.vue'
import SensusDetailView from './view.detail.vue'
import SensusRecordView from './view.record.vue'
import SensusTaskDetailView from './view.task.vue'
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
      path: '/sensus/:id/record/:detailId',
      name: 'SensusTaskDetail',
      component: SensusTaskDetailView,
      props: route => ({ controller, id: route.params.id, detailId: route.params.detailId })
    },
    {
      path: '/sensus/:id/record',
      name: 'SensusRecord',
      component: SensusRecordView,
      props: route => ({ controller, id: route.params.id })
    },
    {
      path: '/sensus/:id',
      name: 'SensusDetail',
      component: SensusDetailView,
      props: route => ({ controller, id: route.params.id })
    }
  ]
}
