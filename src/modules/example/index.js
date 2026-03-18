import ExampleView from './view.vue'
import { createExampleController } from './controller'

const controller = createExampleController()

export default {
  routes: [
    {
      path: '/example',
      name: 'Example',
      component: ExampleView,
      props: { controller }
    }
  ]
}
