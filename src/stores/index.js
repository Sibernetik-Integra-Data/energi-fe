import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    ready: false
  }),
  actions: {
    setReady(v = true) { this.ready = v }
  }
})
