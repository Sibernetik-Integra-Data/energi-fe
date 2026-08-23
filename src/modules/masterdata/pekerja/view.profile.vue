<template>
  <div class="flex h-screen bg-(--bg) text-(--text)">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader eyebrow="Profile" title="Profile" :notifications="0" :user="user" :on-logout="logoutFromKeycloak" />
      <main class="flex-1 overflow-y-auto p-8 max-[920px]:p-4">
        <div class="mb-5">
          <button type="button" class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--text) transition-colors hover:bg-(--surface-muted) hover:border-(--border-strong)" @click="goBack">
            <span aria-hidden="true">←</span>
            Kembali
          </button>
        </div>
        <div class="flex items-start">
          <aside class="w-97.25 shrink-0 p-8 max-[1100px]:w-75 max-[920px]:hidden">
            <div class="overflow-hidden rounded-2xl bg-(--surface)">
              <div class="flex flex-col items-center gap-6 px-6 pb-6 pt-6">
                <div class="flex h-30 w-30 items-center justify-center overflow-hidden rounded-full bg-[#fbc66b] text-3xl font-bold text-white">
                  <img v-if="avatarUrl" :src="avatarUrl" :alt="fullName" class="h-full w-full object-cover" />
                  <span v-else>{{ initials }}</span>
                </div>
                <div class="text-center"><p class="m-0 text-lg font-bold">{{ fullName }}</p><p class="m-0 mt-3 text-sm text-(--text-muted)">{{ worker?.jabatan || '-' }}</p><p class="m-0 text-sm text-(--text-muted)">ID{{ worker?.user_id || '-' }}</p></div>
              </div>
              <div class="mx-6 h-px bg-(--border)"></div>
              <nav class="flex flex-col gap-1 p-6">
                <button type="button" class="worker-tab flex h-10 cursor-pointer items-center gap-1 rounded-lg p-2.5 text-left text-sm font-medium text-(--text) transition-colors hover:bg-(--surface-muted) hover:text-(--text)" :class="tab === 'profile' ? 'is-active bg-[#fff4e6]' : ''" @click="tab = 'profile'"><BaseIcon name="profile" :size="16" /> Profile</button>
                <button type="button" class="worker-tab flex h-10 cursor-pointer items-center gap-1 rounded-lg p-2.5 text-left text-sm font-medium text-(--text) transition-colors hover:bg-(--surface-muted) hover:text-(--text)" :class="tab === 'performance' ? 'is-active bg-[#fff4e6]' : ''" @click="tab = 'performance'"><BaseIcon name="dashboard" :size="16" /> Performance Overview</button>
                <button type="button" class="worker-tab flex h-10 cursor-pointer items-center gap-1 rounded-lg p-2.5 text-left text-sm font-medium text-(--text) transition-colors hover:bg-(--surface-muted) hover:text-(--text)" :class="tab === 'account' ? 'is-active bg-[#fff4e6]' : ''" @click="tab = 'account'"><BaseIcon name="settings" :size="16" /> Account Config</button>
              </nav>
            </div>
          </aside>

          <section class="min-w-0 flex-1 p-8 max-[920px]:p-0">
            <div v-if="loading" class="rounded-2xl bg-(--surface) p-10 text-center text-sm text-(--text-muted)">Memuat profil&hellip;</div>
            <div v-else-if="error" class="rounded-2xl bg-(--surface) p-10 text-center text-sm text-red-600">{{ error }}</div>
            <template v-else-if="tab === 'profile'">
              <div class="overflow-hidden rounded-2xl bg-(--surface)">
                <div class="flex items-start gap-4 p-6"><div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fbc66b] text-xl font-bold text-white"><img v-if="avatarUrl" :src="avatarUrl" :alt="fullName" class="h-full w-full object-cover" /><span v-else>{{ initials }}</span></div><div><p class="m-0 text-base font-bold">Foto Profil</p><p class="m-0 text-sm leading-5 text-(--text-muted)">Optimal size 300 x 300 pixels with file size: Maximum 10 MB.</p><p class="m-0 text-sm leading-5 text-(--text-muted)">Allowed file extensions: JPG, JPEG, PNG.</p></div></div>
                <div class="grid grid-cols-2 gap-6 px-6 pb-6 max-[640px]:grid-cols-1"><ProfileField label="Nama Depan" :value="worker?.first_name" /><ProfileField label="Nama Belakang" :value="worker?.last_name" /><ProfileField label="Tanggal Lahir" value="-" /><ProfileField label="Marital Status" value="-" /><ProfileField label="Email" :value="worker?.email" /><ProfileField label="Gender" value="-" /><ProfileField label="Address 1" value="-" full /><ProfileField label="Address 2" value="-" full /></div>
                <div class="flex justify-end border-t border-(--border) p-6"><button type="button" class="cursor-pointer rounded-full bg-(--text) px-4 py-3 text-base font-medium text-(--surface) transition-opacity hover:opacity-80">Edit Profile</button></div>
              </div>
            </template>
            <template v-else-if="tab === 'performance'">
              <div class="flex flex-col gap-6"><div class="rounded-2xl bg-(--surface) p-4"><div class="flex gap-6"><select class="w-50 rounded-lg bg-(--surface-muted) p-2.5 text-sm text-(--text)"><option>April</option></select><select class="w-50 rounded-lg bg-(--surface-muted) p-2.5 text-sm text-(--text)"><option>2026</option></select></div><div class="mt-4 grid grid-cols-2 gap-4 max-[640px]:grid-cols-1"><MetricCard label="Total Tugas Pekerjaan" value="-" icon="users" /><MetricCard label="Total hari kerja" value="-" icon="calendar" /></div></div><div class="overflow-x-auto rounded-2xl border border-(--border) bg-(--surface)"><table class="w-full min-w-170 border-collapse"><thead><tr class="bg-(--surface-muted) text-left text-xs uppercase tracking-[.6px] text-(--text-muted)"><th class="p-3">Tanggal</th><th class="p-3">Pekerjaan</th><th class="p-3">Tipe Pekerjaan</th><th class="p-3">Gender</th><th class="p-3 text-center">Action</th></tr></thead><tbody><tr><td colspan="5" class="border-t border-(--border) p-10 text-center text-sm text-(--text-muted)">-</td></tr></tbody></table></div></div>
            </template>
            <div v-else class="rounded-2xl bg-(--surface) p-8"><h2 class="m-0 text-lg font-bold">Account Config</h2><p class="mt-2 text-sm text-(--text-muted)">-</p></div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseHeader from '../../shared/header'
import BaseSidebar from '../../shared/sidebar'
import BaseIcon from '../../shared/icon'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../../auth/keycloak'
import { useAppStore } from '../../../stores'
import { navigation as sharedNavigation } from '../../shared/navigation'
import { listPekerja } from './model'
import { signedApiFetchBlob } from '../../../api/fetch'

const ProfileField = defineComponent({ props: { label: String, value: [String, Number], full: Boolean }, setup: (props) => () => h('div', { class: props.full ? 'col-span-2 max-[640px]:col-span-1' : '' }, [h('label', { class: 'mb-2 block px-1 text-sm font-medium' }, props.label), h('div', { class: 'min-h-10 rounded-lg bg-(--surface-muted) px-2.5 py-2.5 text-sm text-(--text)' }, props.value || '-')]) })
const MetricCard = defineComponent({ props: { label: String, value: [String, Number], icon: String }, setup: (props) => () => h('div', { class: 'flex h-[142px] items-start justify-between rounded-[14px] border border-(--border) p-6' }, [h('div', { class: 'flex h-full flex-col justify-between' }, [h('p', { class: 'm-0 text-sm text-(--text-muted)' }, props.label), h('p', { class: 'm-0 text-3xl font-semibold text-(--text)' }, String(props.value))]), h('div', { class: 'flex h-14 w-14 items-center justify-center rounded-full bg-[#b8a44c] text-white' }, [h(BaseIcon, { name: props.icon, size: 30 })])]) })

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
const worker = ref(null)
const loading = ref(true)
const error = ref('')
const localAvatarUrl = ref('')
const tab = ref('profile')
const fullName = computed(() => [worker.value?.first_name, worker.value?.last_name].filter(Boolean).join(' ') || '-')
const initials = computed(() => fullName.value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U')
const avatarUrl = computed(() => localAvatarUrl.value || '')

function goBack() {
  router.push('/master-data/pekerja')
}

async function loadAvatar(uri) {
  const rawUri = String(uri || '').trim()
  if (!rawUri) return

  try {
    let avatarPath = rawUri
    if (avatarPath.startsWith('/storage?')) {
      const blob = await signedApiFetchBlob(avatarPath)
      localAvatarUrl.value = URL.createObjectURL(blob)
      return
    }

    try {
      avatarPath = decodeURIComponent(avatarPath)
    } catch {
      // Keep the original path when the API already returned a decoded URI.
    }

    const blob = await signedApiFetchBlob(`/storage?path=${encodeURIComponent(avatarPath)}`)
    localAvatarUrl.value = URL.createObjectURL(blob)
  } catch (avatarError) {
    console.warn('[Pekerja] Failed to load avatar_uri:', avatarError)
  }
}

onMounted(async () => {
  try {
    const result = await listPekerja()
    worker.value = result.data.find((item) => item.user_id === route.params.userId) || null
    if (!worker.value) error.value = 'User tidak ditemukan.'
    else await loadAvatar(worker.value.avatar_uri)
  } catch (err) {
    error.value = err?.message || 'Gagal memuat profil user.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (localAvatarUrl.value.startsWith('blob:')) URL.revokeObjectURL(localAvatarUrl.value)
})
</script>

<style scoped>
.worker-tab {
  color: var(--text) !important;
}

.worker-tab:hover {
  color: var(--text) !important;
}

.worker-tab.is-active,
.worker-tab.is-active:hover {
  color: #222e2f !important;
}
</style>
