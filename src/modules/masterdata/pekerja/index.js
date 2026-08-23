import PekerjaView from './view.vue'
import PekerjaProfileView from './view.profile.vue'

export default {
  routes: [
    {
      path: '/master-data/pekerja',
      name: 'MasterDataPekerja',
      component: PekerjaView
    },
    {
      path: '/master-data/pekerja/:userId',
      name: 'MasterDataPekerjaProfile',
      component: PekerjaProfileView
    }
  ]
}
