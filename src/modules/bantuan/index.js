import BantuanView from './view.vue'
import BantuanDetailView from './detail.vue'

// Help / SOP pages; content comes from the CMS (Help Page).
export default {
  routes: [
    { path: '/bantuan', name: 'Bantuan', component: BantuanView },
    { path: '/bantuan/:slug', name: 'BantuanDetail', component: BantuanDetailView }
  ]
}
