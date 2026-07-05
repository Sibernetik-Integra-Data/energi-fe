import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    ready: false,
    profile: null
  }),
  actions: {
    setReady(v = true) { this.ready = v },
    setProfile(profile) { this.profile = profile || null },
    clearProfile() { this.profile = null }
  }
})
