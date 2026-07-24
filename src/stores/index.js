import { defineStore } from 'pinia'

function revokeAvatarUrl(profile) {
  const avatarUrl = profile?.avatarUrl
  if (typeof avatarUrl === 'string' && avatarUrl.startsWith('blob:')) {
    URL.revokeObjectURL(avatarUrl)
  }
}

export const useAppStore = defineStore('app', {
  state: () => ({
    ready: false,
    profile: null
  }),
  actions: {
    setReady(v = true) { this.ready = v },
    setProfile(profile) {
      if (this.profile !== profile) revokeAvatarUrl(this.profile)
      this.profile = profile || null
    },
    clearProfile() {
      revokeAvatarUrl(this.profile)
      this.profile = null
    }
  }
})
