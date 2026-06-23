import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'
import router from './router'
import App from './App.vue'
import './index.css'
import { initTheme } from './utils/theme'
import { preloadStrapiSidebarNavigation } from './modules/shared/sidebar/strapiNavigation'

initTheme()
preloadStrapiSidebarNavigation()

const app = createApp(App)
app.use(createPinia())
app.use(VueApexCharts)
app.use(router)
app.mount('#app')
