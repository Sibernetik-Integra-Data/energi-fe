<template>
  <div class="flex h-screen bg-transparent">
    <BaseSidebar :items="navigation" :user="user" />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <BaseHeader
        eyebrow="Profile"
        title="Profile"
        :notifications="0"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />

      <main class="flex-1 overflow-y-auto p-7 pb-10">
        <div class="flex gap-6 items-start">

          <!-- ── Left sidebar card ─────────────────────────── -->
          <aside class="w-55 shrink-0 border border-(--border) rounded-lg bg-(--surface) overflow-hidden">
            <!-- Identity card -->
            <div class="flex flex-col items-center gap-1 px-4 pt-7 pb-5 border-b border-(--border)">
              <div class="w-22 h-22 rounded-full overflow-hidden mb-2.5">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  :alt="fullName"
                  class="w-full h-full object-cover block"
                />
                <div
                  v-else
                  class="w-22 h-22 rounded-full bg-green-700 text-white flex items-center justify-center text-3xl font-bold"
                >
                  {{ initials }}
                </div>
              </div>
              <p class="m-0 text-[15px] font-bold text-(--text) text-center">{{ fullName }}</p>
              <p v-if="profile?.jobTitle" class="m-0 text-xs text-(--text-muted) text-center">{{ profile.jobTitle }}</p>
              <p v-if="profile?.id" class="m-0 text-[11px] text-(--text-soft) text-center break-all">ID{{ profile.id }}</p>
            </div>

            <!-- Nav menu -->
            <nav class="p-2 flex flex-col" aria-label="Profile navigation">
              <button
                class="flex items-center gap-2.5 w-full h-10 px-3 text-[13px] font-semibold rounded-xl text-left border-0 cursor-pointer transition-colors duration-150"
                :class="activeSection === 'profile'
                  ? 'bg-(--brand-soft) text-(--brand)'
                  : 'bg-transparent text-(--text) hover:bg-(--surface-muted)'"
                type="button"
                @click="activeSection = 'profile'"
              >
                <span class="inline-flex items-center justify-center shrink-0">
                  <BaseIcon name="profile" :size="16" />
                </span>
                Profile
              </button>

              <button
                class="flex items-center gap-2.5 w-full h-10 px-3 text-[13px] font-semibold rounded-xl text-left border-0 cursor-pointer transition-colors duration-150"
                :class="activeSection === 'password'
                  ? 'bg-(--brand-soft) text-(--brand)'
                  : 'bg-transparent text-(--text) hover:bg-(--surface-muted)'"
                type="button"
                @click="activeSection = 'password'"
              >
                <span class="inline-flex items-center justify-center shrink-0">
                  <BaseIcon name="key" :size="16" />
                </span>
                Ubah Kata Sandi
              </button>

              <div class="h-px bg-(--border) my-1.5" aria-hidden="true"></div>

              <button
                class="flex items-center gap-2.5 w-full h-10 px-3 text-[13px] font-semibold rounded-xl text-left border-0 bg-transparent text-(--text-muted) cursor-pointer hover:bg-(--surface-muted) transition-colors duration-150"
                type="button"
                @click="handleLogout"
              >
                <span class="inline-flex items-center justify-center shrink-0">
                  <BaseIcon name="logout" :size="16" />
                </span>
                Logout
              </button>
            </nav>
          </aside>

          <!-- ── Right detail card ─────────────────────────── -->
          <section
            class="flex-1 min-w-0 border border-(--border) rounded-lg bg-(--surface) p-7 flex flex-col gap-6"
            aria-label="Profile details"
          >
            <!-- Profile section -->
            <template v-if="activeSection === 'profile'">
              <!-- Photo upload row -->
              <div class="flex items-start gap-5 pb-6 border-b border-(--border)">
                <div class="w-18 h-18 rounded-full border-2 border-(--border) bg-(--brand-soft) flex items-center justify-center overflow-hidden shrink-0 text-(--brand)">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    :alt="fullName"
                    class="w-full h-full object-cover"
                  />
                  <BaseIcon v-else name="profile" :size="32" />
                </div>
                <div class="flex flex-col gap-0.75">
                  <p class="m-0 text-sm font-bold text-(--text)">Foto Profil</p>
                  <p class="m-0 text-xs text-(--text-soft) leading-relaxed">Optimal size 300 x 300 pixels with file size: Maximum 10 MB.</p>
                  <p class="m-0 text-xs text-(--text-soft) leading-relaxed">Allowed file extensions: JPG, JPEG, PNG.</p>
                  <label class="inline-flex items-center mt-2.5 px-4 py-1.75 border border-(--border-strong) rounded-[10px] bg-(--surface) text-[13px] font-semibold text-(--text) cursor-pointer select-none hover:bg-(--surface-muted) transition-colors duration-150" role="button" tabindex="0">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      class="hidden"
                      @change="handlePhotoChange"
                    />
                    Choose Photo
                  </label>
                </div>
              </div>

              <!-- Fields grid -->
              <div class="grid grid-cols-2 gap-4 gap-x-6">
                <div class="flex flex-col">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Nama Depan</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.firstName || '-' }}</div>
                </div>

                <div class="flex flex-col">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Nama Belakang</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.lastName || '-' }}</div>
                </div>

                <div class="flex flex-col">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Tanggal Lahir</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.birthDate || '-' }}</div>
                </div>

                <div class="flex flex-col">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Marital Status</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.maritalStatus || '-' }}</div>
                </div>

                <div class="flex flex-col">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Email</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.email || '-' }}</div>
                </div>

                <div class="flex flex-col">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Role</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ userRole || '-' }}</div>
                </div>

                <div class="flex flex-col">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Gender</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.gender || '-' }}</div>
                </div>

                <div class="flex flex-col col-span-2">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Address 1</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.address1 || '-' }}</div>
                </div>

                <div class="flex flex-col col-span-2">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide">Address 2</label>
                  <div class="px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) min-h-10">{{ profile?.address2 || '-' }}</div>
                </div>
              </div>

              <div class="flex justify-end gap-3">
                <button
                  class="px-7 py-2.5 rounded-full bg-(--text) text-(--surface) text-sm font-bold border-0 cursor-pointer hover:opacity-90 transition-opacity duration-150"
                  type="button"
                  @click="handleEditProfile"
                >
                  Edit Profile
                </button>
                <button
                  class="px-7 py-2.5 rounded-full bg-gray-500 text-white text-sm font-bold border-0 cursor-pointer hover:opacity-90 transition-opacity duration-150"
                  type="button"
                  @click="debugToken"
                >
                  Debug Token
                </button>
              </div>
            </template>

            <!-- Change password section -->
            <template v-else-if="activeSection === 'password'">
              <div class="text-base font-bold text-(--text) pb-4 border-b border-(--border)">Ubah Kata Sandi</div>
              <div class="grid grid-cols-2 gap-4 gap-x-6">
                <div class="flex flex-col col-span-2">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide" for="cp-current">Kata Sandi Saat Ini</label>
                  <input
                    id="cp-current"
                    v-model="passwordForm.current"
                    type="password"
                    class="w-full px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) outline-none focus:border-(--brand) focus:bg-(--surface) transition-colors duration-150"
                    placeholder="Masukkan kata sandi saat ini"
                    autocomplete="current-password"
                  />
                </div>
                <div class="flex flex-col col-span-2">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide" for="cp-new">Kata Sandi Baru</label>
                  <input
                    id="cp-new"
                    v-model="passwordForm.newPassword"
                    type="password"
                    class="w-full px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) outline-none focus:border-(--brand) focus:bg-(--surface) transition-colors duration-150"
                    placeholder="Masukkan kata sandi baru"
                    autocomplete="new-password"
                  />
                </div>
                <div class="flex flex-col col-span-2">
                  <label class="block mb-1.5 text-xs font-semibold text-(--text-muted) tracking-wide" for="cp-confirm">Konfirmasi Kata Sandi Baru</label>
                  <input
                    id="cp-confirm"
                    v-model="passwordForm.confirm"
                    type="password"
                    class="w-full px-3.5 py-2.5 bg-(--surface-muted) border border-(--border) rounded-[10px] text-sm text-(--text) outline-none focus:border-(--brand) focus:bg-(--surface) transition-colors duration-150"
                    placeholder="Ulangi kata sandi baru"
                    autocomplete="new-password"
                  />
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  class="px-7 py-2.5 rounded-full bg-(--text) text-(--surface) text-sm font-bold border-0 cursor-pointer hover:opacity-90 transition-opacity duration-150"
                  type="button"
                  @click="handleChangePassword"
                >
                  Simpan
                </button>
              </div>
            </template>
          </section>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import BaseIcon from '../shared/icon'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser, getTokenClaims } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import navigation from '../shared/navigation'

const appStore = useAppStore()

const activeSection = ref('profile')
const localAvatarUrl = ref('')

watch(
  () => appStore.profile?.avatarUrl,
  (val) => { localAvatarUrl.value = val || '' },
  { immediate: true }
)

const avatarUrl = computed(() => localAvatarUrl.value || user.value?.avatarUrl || '')

const passwordForm = ref({
  current: '',
  newPassword: '',
  confirm: ''
})

const profile = computed(() => appStore.profile)

const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())

/**
 * Extracts the user role from the Keycloak token.
 *
 * Token structure:
 *   resource_access -> [client_id (e.g. "mobile")] -> roles -> Array<string>
 *
 * Priority:
 *   1. resource_access.<VITE_KEYCLOAK_CLIENT_ID>.roles
 *   2. resource_access.<azp>.roles  (azp = authorized party, i.e. the client that issued the token)
 *   3. resource_access.<any client>.roles (first match)
 *   4. realm_access.roles
 *   5. Empty string (role not found)
 */
const userRole = computed(() => {
  try {
    const claims = getTokenClaims()
    if (!claims) return ''

    const resourceAccess = claims.resource_access
    if (resourceAccess && typeof resourceAccess === 'object') {
      // 1. Try the configured client ID first
      const configuredClient = import.meta.env.VITE_KEYCLOAK_CLIENT_ID
      if (configuredClient) {
        const roles = resourceAccess[configuredClient]?.roles
        if (Array.isArray(roles) && roles.length) return roles.join(', ')
      }

      // 2. Try azp (the client that issued the token — usually the same as VITE_KEYCLOAK_CLIENT_ID)
      const azp = claims.azp
      if (azp && resourceAccess[azp]) {
        const roles = resourceAccess[azp]?.roles
        if (Array.isArray(roles) && roles.length) return roles.join(', ')
      }

      // 3. Fallback: iterate all clients and take the first non-empty roles array
      for (const clientKey of Object.keys(resourceAccess)) {
        const roles = resourceAccess[clientKey]?.roles
        if (Array.isArray(roles) && roles.length) return roles.join(', ')
      }
    }

    // 4. Last resort: realm-level roles
    const realmRoles = claims.realm_access?.roles
    if (Array.isArray(realmRoles) && realmRoles.length) return realmRoles.join(', ')

    return ''
  } catch {
    return ''
  }
})

const fullName = computed(() => {
  const p = profile.value
  if (!p) return user.value?.name || ''
  const first = p.firstName || ''
  const last = p.lastName || ''
  return [first, last].filter(Boolean).join(' ') || user.value?.name || ''
})

const initials = computed(() => {
  const name = fullName.value
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
})

function handlePhotoChange(event) {
  const file = event.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => { localAvatarUrl.value = e.target?.result || '' }
  reader.readAsDataURL(file)
}

function handleEditProfile() {
  // Future: open edit mode or navigate to edit form
}

function handleChangePassword() {
  // Future: call API to change password
  passwordForm.value = { current: '', newPassword: '', confirm: '' }
}

function debugToken() {
  const claims = getTokenClaims()
  console.log('Keycloak token claims:', claims)
  if (!claims) {
    console.warn('No token claims available')
    return
  }
  console.log('resource_access:', claims.resource_access)
  console.log('realm_access roles:', claims.realm_access?.roles)
  console.log('Resolved userRole:', userRole.value)
}

function handleLogout() {
  void logoutFromKeycloak()
}
</script>
