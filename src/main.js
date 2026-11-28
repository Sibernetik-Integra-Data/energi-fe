import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'
import router from './router'
import App from './App.vue'
import './index.css'
import { initTheme } from './utils/theme'
import { initCmsTheme } from './utils/cmsTheme'
import { preloadStrapiSidebarNavigation } from './modules/shared/sidebar/strapiNavigation'
import i18n, { initLocale } from './i18n'

initTheme()
initLocale()
initCmsTheme()
preloadStrapiSidebarNavigation()

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(VueApexCharts)
app.use(router)
app.mount('#app')
