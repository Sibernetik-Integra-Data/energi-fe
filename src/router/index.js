import { createRouter, createWebHistory } from 'vue-router'
import ExampleModule from '../modules/example'

const routes = [
  { path: '/', redirect: '/example' },
  ...ExampleModule.routes
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
