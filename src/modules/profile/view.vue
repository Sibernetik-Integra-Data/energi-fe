<template>
  <div class="flex h-screen bg-(--bg) text-(--text)">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader eyebrow="Profile" title="Profile" :user="user" :on-logout="logoutFromKeycloak" />

      <main class="flex-1 overflow-y-auto p-7 pb-10 max-[720px]:p-4">
        <div class="mx-auto flex max-w-400 items-start gap-6 max-[860px]:flex-col">
          <aside class="w-55 shrink-0 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) max-[860px]:w-full">
            <div class="flex flex-col items-center gap-1 border-b border-(--border) px-4 pb-5 pt-7">
              <div class="mb-2.5 h-22 w-22 overflow-hidden rounded-full">
                <img v-if="avatarUrl" :src="avatarUrl" :alt="fullName" class="block h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center bg-green-700 text-3xl font-bold text-white">{{ initials }}</div>
              </div>
              <p class="m-0 text-center text-[15px] font-bold">{{ fullName }}</p>
              <p class="m-0 text-center text-xs text-(--text-muted)">{{ profile?.access || profile?.jobTitle || '-' }}</p>
              <p v-if="profile?.id" class="m-0 break-all text-center text-[11px] text-(--text-soft)">ID{{ profile.id }}</p>
            </div>
            <nav class="flex flex-col p-2" aria-label="Profile navigation">
              <button class="side-button" :class="{ active: activeSection === 'profile' }" type="button" @click="activeSection = 'profile'"><BaseIcon name="profile" :size="16" /> Profile</button>
              <button class="side-button" :class="{ active: activeSection === 'password' }" type="button" @click="activeSection = 'password'"><BaseIcon name="key" :size="16" /> Ubah Kata Sandi</button>
              <div class="my-1.5 h-px bg-(--border)"></div>
              <button class="side-button muted" type="button" @click="handleLogout"><BaseIcon name="logout" :size="16" /> Logout</button>
            </nav>
          </aside>

          <section class="flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border border-(--border) bg-(--surface) p-7 max-[640px]:p-4" aria-label="Profile details">
            <template v-if="activeSection === 'profile'">
              <div class="flex items-start gap-5 border-b border-(--border) pb-6">
                <div class="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-(--border) bg-(--brand-soft) text-(--brand)">
                  <img v-if="avatarUrl" :src="avatarUrl" :alt="fullName" class="h-full w-full object-cover" /><BaseIcon v-else name="profile" :size="32" />
                </div>
                <div><p class="m-0 text-sm font-bold">Foto Profil</p><p class="m-0 mt-1 text-xs leading-relaxed text-(--text-soft)">Foto profil dikelola terpisah dan tidak diubah dari halaman ini.</p></div>
              </div>

              <form class="flex flex-col gap-6" @submit.prevent="saveProfile">
                <div v-if="profileError" class="rounded-xl bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)" role="alert">{{ profileError }}</div>
                <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-[640px]:grid-cols-1">
                  <label class="field"><span>Nama Depan *</span><input v-model.trim="profileForm.firstName" required :readonly="!editing" /></label>
                  <label class="field"><span>Nama Belakang</span><input v-model.trim="profileForm.lastName" :readonly="!editing" /></label>
                  <label class="field"><span>Tanggal Lahir</span><input v-model="profileForm.birthDate" type="date" :readonly="!editing" /></label>
                  <label class="field"><span>Marital Status</span><select v-model="profileForm.maritalStatus" :disabled="!editing"><option value="">-</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></label>
                  <label class="field"><span>Email *</span><input v-model.trim="profileForm.email" required type="email" :readonly="!editing" /></label>
                  <label class="field"><span>User Access</span><input :value="profile?.access || profile?.jobTitle || '-'" readonly /></label>
                  <label class="field"><span>Gender</span><select v-model="profileForm.gender" :disabled="!editing"><option value="">-</option><option value="Laki-Laki">Laki-Laki</option><option value="Perempuan">Perempuan</option></select></label>
                  <label class="field col-span-2 max-[640px]:col-span-1"><span>Address 1</span><textarea v-model.trim="profileForm.address1" rows="2" :readonly="!editing"></textarea></label>
                  <label class="field col-span-2 max-[640px]:col-span-1"><span>Address 2</span><textarea v-model.trim="profileForm.address2" rows="2" :readonly="!editing"></textarea></label>
                </div>
                <div class="flex justify-end gap-3">
                  <template v-if="editing"><button class="secondary-button" type="button" :disabled="savingProfile" @click="cancelEdit">Batal</button><button class="primary-button" type="submit" :disabled="savingProfile">{{ savingProfile ? 'Menyimpan…' : 'Simpan' }}</button></template>
                  <button v-else class="primary-button" type="button" @click="editing = true">Edit Profile</button>
                </div>
              </form>
            </template>

            <template v-else>
              <div class="border-b border-(--border) pb-4 text-base font-bold">Ubah Kata Sandi</div>
              <form class="flex flex-col gap-6" @submit.prevent="changePassword">
                <div v-if="passwordError" class="rounded-xl bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)" role="alert">{{ passwordError }}</div>
                <div class="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
                  <label class="field"><span>Kata Sandi Baru *</span><input v-model="passwordForm.newPassword" required minlength="8" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter" /></label>
                  <label class="field"><span>Konfirmasi Kata Sandi Baru *</span><input v-model="passwordForm.confirm" required type="password" autocomplete="new-password" placeholder="Ulangi kata sandi baru" /></label>
                </div>
                <div class="flex justify-end"><button class="primary-button" type="submit" :disabled="savingPassword">{{ savingPassword ? 'Menyimpan…' : 'Simpan Password' }}</button></div>
              </form>
            </template>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import BaseIcon from '../shared/icon'
import navigation from '../shared/navigation'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { getPasswordEncryptionKey, resetOwnPassword, updateOwnProfile } from '../../auth/accountApi'
import { useAppStore } from '../../stores'
import { useToast } from '../../utils/toast'
import { encryptPassword } from '../user-management/services/passwordEncryption'

const appStore = useAppStore()
const { show: showToast } = useToast()
const activeSection = ref('profile')
const editing = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const profileError = ref('')
const passwordError = ref('')
const profile = computed(() => appStore.profile)
const user = computed(() => profileToUser(profile.value) || getAuthenticatedUser())
const avatarUrl = computed(() => profile.value?.avatarUrl || '')
const fullName = computed(() => [profile.value?.firstName, profile.value?.lastName].filter(Boolean).join(' ') || user.value?.name || '')
const initials = computed(() => fullName.value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U')
const profileForm = reactive({ firstName: '', lastName: '', email: '', birthDate: '', maritalStatus: '', gender: '', address1: '', address2: '' })
const passwordForm = reactive({ newPassword: '', confirm: '' })

function syncForm(value = profile.value) {
  Object.assign(profileForm, {
    firstName: value?.firstName || '', lastName: value?.lastName || '', email: value?.email || '',
    birthDate: value?.birthDate || '', maritalStatus: value?.maritalStatus || '', gender: value?.gender || '',
    address1: value?.address1 || '', address2: value?.address2 || ''
  })
}
watch(profile, (value) => syncForm(value), { immediate: true })
function cancelEdit() { syncForm(); profileError.value = ''; editing.value = false }
async function saveProfile() {
  savingProfile.value = true; profileError.value = ''
  try {
    const updated = await updateOwnProfile({ ...profileForm })
    appStore.setProfile({ ...profile.value, ...updated })
    editing.value = false; showToast('Profile berhasil diperbarui.')
  } catch (error) { profileError.value = error?.message || 'Gagal memperbarui profile.' }
  finally { savingProfile.value = false }
}
async function changePassword() {
  passwordError.value = ''
  if (passwordForm.newPassword.length < 8) { passwordError.value = 'Password minimal 8 karakter.'; return }
  if (passwordForm.newPassword !== passwordForm.confirm) { passwordError.value = 'Konfirmasi password tidak sama.'; return }
  savingPassword.value = true
  try {
    const { publicKey } = await getPasswordEncryptionKey()
    await resetOwnPassword(await encryptPassword(passwordForm.newPassword, publicKey))
    passwordForm.newPassword = ''; passwordForm.confirm = ''; showToast('Password berhasil diperbarui.')
  } catch (error) { passwordError.value = error?.message || 'Gagal memperbarui password.' }
  finally { savingPassword.value = false }
}
function handleLogout() { void logoutFromKeycloak() }
</script>

<style scoped>
.side-button { display: flex; align-items: center; gap: 10px; width: 100%; height: 40px; padding: 0 12px; border: 0; border-radius: 12px; background: transparent; color: var(--text); font-size: 13px; font-weight: 700; text-align: left; cursor: pointer; }
.side-button:hover { background: var(--surface-muted); }
.side-button.active { background: var(--brand-soft); color: var(--brand); }
.side-button.muted { color: var(--text-muted); }
.field { display: flex; flex-direction: column; gap: 6px; color: var(--text-muted); font-size: 12px; font-weight: 700; }
.field input, .field select, .field textarea { width: 100%; min-height: 42px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-muted); color: var(--text); padding: 10px 14px; font-size: 14px; font-weight: 400; outline: none; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--brand); background: var(--surface); }
.field input[readonly], .field textarea[readonly], .field select:disabled { opacity: 1; cursor: default; }
.primary-button, .secondary-button { border-radius: 999px; padding: 10px 25px; font-size: 13px; font-weight: 800; cursor: pointer; }
.primary-button { border: 0; background: var(--text); color: var(--surface); }
.secondary-button { border: 1px solid var(--border); background: var(--surface); color: var(--text); }
button:disabled { opacity: .5; cursor: not-allowed; }
</style>
