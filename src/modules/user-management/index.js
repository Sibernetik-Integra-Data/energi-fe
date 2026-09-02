import UserManagementView from './view.vue'

export default {
  routes: [{
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagementView,
    meta: { requiresOwner: true }
  }]
}
