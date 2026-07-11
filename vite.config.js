import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

function parseListEnv(value = '') {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_DEVELOP || 'http://localhost:10002'
  const strapiProxyTarget = env.VITE_STRAPI_URL || 'http://localhost:10003'
  const strapiProxyPaths = parseListEnv(env.VITE_STRAPI_PROXY_PATHS || '')
  const strapiProxy = Object.fromEntries(
    strapiProxyPaths.map((path) => [
      path,
      {
        target: strapiProxyTarget,
        changeOrigin: true,
        secure: false
      }
    ])
  )

  return {
    plugins: [vue()],
    server: {
      port: 10001,
      proxy: {
        ...strapiProxy,
        '/uploads': {
          target: strapiProxyTarget,
          changeOrigin: true,
          secure: false
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
