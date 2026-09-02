<template>
  <div class="flex h-screen bg-(--bg) text-(--text)">
    <BaseSidebar :items="navigation" :user="currentUser" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader eyebrow="Administration" title="User Management" :user="currentUser" :on-logout="logoutFromKeycloak" />
      <main class="flex-1 overflow-y-auto p-7 max-[720px]:p-4">
        <section class="mx-auto flex max-w-400 flex-col gap-5">
          <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="m-0 text-2xl font-extrabold">User Management</h1>
              <p class="m-0 mt-1 text-sm text-(--text-muted)">Kelola user Keycloak, akses akun, dan role client mobile.</p>
            </div>
            <div class="flex flex-wrap gap-3">
              <label class="flex h-10 min-w-70 items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-3 text-(--text-muted) max-[640px]:min-w-full">
                <BaseIcon name="search" :size="17" />
                <input v-model="search" type="search" class="min-w-0 flex-1 border-0 bg-transparent text-sm text-(--text) outline-none" placeholder="Cari nama, username, email, akses…" />
              </label>
              <button type="button" class="primary-button" @click="openAdd"><BaseIcon name="plus" :size="17" /> Tambah User</button>
            </div>
          </header>

          <div class="flex gap-1 rounded-xl border border-(--border) bg-(--surface) p-1 self-start">
            <button v-for="tab in tabs" :key="tab.id" type="button" class="tab-button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }} ({{ tab.count }})</button>
          </div>

          <div v-if="pageError" class="flex items-center justify-between gap-4 rounded-xl bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)" role="alert">
            <span>{{ pageError }}</span><button type="button" class="underline" @click="load">Coba lagi</button>
          </div>

          <section class="overflow-hidden rounded-2xl border border-(--border) bg-(--surface) shadow-sm">
            <div class="overflow-x-auto max-[980px]:hidden">
              <table class="w-full min-w-260 border-collapse text-left">
                <thead><tr class="border-b border-(--border) bg-(--surface-muted) text-[11px] uppercase tracking-wider text-(--text-muted)"><th v-for="column in columns" :key="column" class="px-4 py-3">{{ column }}</th></tr></thead>
                <tbody>
                  <tr v-if="loading"><td colspan="8" class="p-12 text-center text-sm text-(--text-muted)">Memuat user…</td></tr>
                  <tr v-else-if="!paginatedUsers.length"><td colspan="8" class="p-12 text-center text-sm text-(--text-muted)">User tidak ditemukan.</td></tr>
                  <tr v-for="user in paginatedUsers" v-else :key="user.id" class="border-b border-(--border) last:border-0 hover:bg-(--surface-muted)">
                    <td class="px-4 py-3"><strong class="block text-sm">{{ displayName(user) }}</strong><span v-if="user.permissions?.isSelf" class="text-[11px] text-(--brand)">Akun Anda</span></td>
                    <td class="px-4 py-3 text-sm">{{ user.username }}</td>
                    <td class="px-4 py-3 text-sm">{{ user.email }}</td>
                    <td class="px-4 py-3"><span class="badge">{{ user.access || '—' }}</span></td>
                    <td class="px-4 py-3"><div class="flex max-w-65 flex-wrap gap-1"><span v-for="role in user.effectiveClientRoles" :key="role" class="badge" :class="{ inherited: user.inheritedClientRoles.includes(role) }">{{ role }}</span><span v-if="!user.effectiveClientRoles.length">—</span></div></td>
                    <td class="px-4 py-3 text-xs text-(--text-muted)">{{ formatDate(user.createdTimestamp) }}</td>
                    <td class="px-4 py-3"><button type="button" class="status-button" :class="{ enabled: user.enabled }" role="switch" :aria-checked="user.enabled" :aria-label="`Ubah status ${displayName(user)}`" :disabled="!user.permissions?.changeStatus || busyId === user.id" :title="user.permissions?.changeStatus ? '' : 'Akun sendiri tidak dapat dinonaktifkan'" @click="toggleStatus(user)"><span></span>{{ user.enabled ? 'Aktif' : 'Nonaktif' }}</button></td>
                    <td class="px-4 py-3"><div class="flex gap-2"><button type="button" class="icon-action" :disabled="busyId === user.id" :aria-label="`Edit ${displayName(user)}`" @click="openEdit(user)"><BaseIcon name="edit" :size="16" /></button><button type="button" class="icon-action danger" :disabled="!user.permissions?.delete || busyId === user.id" :title="user.permissions?.delete ? '' : 'Akun sendiri tidak dapat dihapus'" :aria-label="`Hapus ${displayName(user)}`" @click="deleteTarget = user">×</button></div></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="hidden flex-col gap-3 p-3 max-[980px]:flex">
              <p v-if="loading" class="p-8 text-center text-sm text-(--text-muted)">Memuat user…</p>
              <p v-else-if="!paginatedUsers.length" class="p-8 text-center text-sm text-(--text-muted)">User tidak ditemukan.</p>
              <article v-for="user in paginatedUsers" v-else :key="user.id" class="rounded-xl border border-(--border) bg-(--surface-muted) p-4">
                <div class="flex justify-between gap-3"><div><strong>{{ displayName(user) }}</strong><p class="m-0 mt-1 text-xs text-(--text-muted)">{{ user.username }} · {{ user.email }}</p></div><span class="badge self-start">{{ user.access || '—' }}</span></div>
                <div class="mt-3 flex flex-wrap gap-1"><span v-for="role in user.effectiveClientRoles" :key="role" class="badge">{{ role }}</span></div>
                <div class="mt-4 flex items-center justify-between"><button type="button" class="status-button" :class="{ enabled: user.enabled }" role="switch" :aria-checked="user.enabled" :aria-label="`Ubah status ${displayName(user)}`" :disabled="!user.permissions?.changeStatus" @click="toggleStatus(user)"><span></span>{{ user.enabled ? 'Aktif' : 'Nonaktif' }}</button><div class="flex gap-2"><button class="icon-action" type="button" :aria-label="`Edit ${displayName(user)}`" @click="openEdit(user)"><BaseIcon name="edit" :size="16" /></button><button class="icon-action danger" type="button" :aria-label="`Hapus ${displayName(user)}`" :disabled="!user.permissions?.delete" @click="deleteTarget = user">×</button></div></div>
              </article>
            </div>

            <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-(--border) px-4 py-3 text-xs text-(--text-muted)">
              <span>{{ filteredUsers.length }} hasil</span>
              <div class="flex items-center gap-2"><button class="page-button" :disabled="page === 1" @click="page--">Sebelumnya</button><span>Halaman {{ page }} / {{ totalPages }}</span><button class="page-button" :disabled="page === totalPages" @click="page++">Berikutnya</button></div>
              <label>Per halaman <select v-model="pageSize" class="ml-1 rounded-lg border border-(--border) bg-(--surface-muted) p-1 text-(--text)"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></label>
            </footer>
          </section>
        </section>
      </main>
    </div>

    <UserManagementModal v-if="modalOpen" :user="selectedUser" :mode="modalMode" :configuration="configuration" :saving="saving" :error="formError" @close="modalOpen = false" @save="saveUser" />
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-70 grid place-items-center bg-black/55 p-4" @click.self="deleteTarget = null">
        <div class="w-full max-w-sm rounded-2xl border border-(--border) bg-(--surface) p-6 text-(--text) shadow-2xl" role="dialog" aria-modal="true">
          <h2 class="m-0 text-lg font-bold">Hapus user?</h2><p class="my-4 text-sm text-(--text-muted)">Akun <strong>{{ displayName(deleteTarget) }}</strong> akan dihapus permanen dari Keycloak. Data bisnis tidak ikut dihapus.</p>
          <div class="flex justify-end gap-3"><button class="secondary-button" type="button" :disabled="deleting" @click="deleteTarget = null">Batal</button><button class="danger-button" type="button" :disabled="deleting" @click="deleteUser">{{ deleting ? 'Menghapus…' : 'Hapus' }}</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import BaseIcon from '../shared/icon'
import navigation from '../shared/navigation'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { getPasswordEncryptionKey } from '../../auth/accountApi'
import { useAppStore } from '../../stores'
import { useToast } from '../../utils/toast'
import UserManagementModal from './components/UserManagementModal.vue'
import userManagementService, { userManagementErrorMessage } from './services/userManagementService'
import { encryptPassword } from './services/passwordEncryption'

const columns = ['Nama', 'Username', 'Email', 'User Access', 'Mobile Roles', 'Dibuat', 'Status', 'Aksi']
const appStore = useAppStore()
const router = useRouter()
const { show: showToast } = useToast()
const currentUser = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const users = ref([])
const configuration = ref({ accessOptions: [], client: { clientId: 'mobile', roles: [] } })
const loading = ref(false)
const pageError = ref('')
const search = ref('')
const activeTab = ref('all')
const page = ref(1)
const pageSize = ref(10)
const busyId = ref('')
const modalOpen = ref(false)
const modalMode = ref('edit')
const selectedUser = ref(null)
const saving = ref(false)
const formError = ref('')
const deleteTarget = ref(null)
const deleting = ref(false)

const displayName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || '—'
const tabs = computed(() => [
  { id: 'all', label: 'Semua', count: users.value.length },
  { id: 'active', label: 'Aktif', count: users.value.filter((user) => user.enabled).length },
  { id: 'inactive', label: 'Nonaktif', count: users.value.filter((user) => !user.enabled).length }
])
const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase()
  return users.value.filter((user) => {
    const statusMatches = activeTab.value === 'all' || (activeTab.value === 'active' ? user.enabled : !user.enabled)
    const haystack = [displayName(user), user.username, user.email, user.access, ...(user.effectiveClientRoles || [])].join(' ').toLowerCase()
    return statusMatches && (!query || haystack.includes(query))
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)))
const paginatedUsers = computed(() => filteredUsers.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
watch([search, activeTab, pageSize], () => { page.value = 1 })
watch(totalPages, (value) => { if (page.value > value) page.value = value })

function formatDate(value) { return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : '—' }
async function load() {
  loading.value = true; pageError.value = ''
  try {
    const [result, config] = await Promise.all([userManagementService.listUsers(), userManagementService.getConfiguration()])
    users.value = result.users || []; configuration.value = config
  } catch (error) {
    if (error?.code === 403) { await router.replace('/dashboard'); return }
    pageError.value = userManagementErrorMessage(error, 'Gagal memuat user Keycloak.')
  } finally { loading.value = false }
}
function openAdd() { selectedUser.value = null; modalMode.value = 'add'; formError.value = ''; modalOpen.value = true }
function openEdit(user) { selectedUser.value = user; modalMode.value = 'edit'; formError.value = ''; modalOpen.value = true }
async function saveUser(form) {
  saving.value = true; formError.value = ''
  try {
    let encryptedPassword = ''
    if (form.password) {
      const { publicKey } = await getPasswordEncryptionKey()
      encryptedPassword = await encryptPassword(form.password, publicKey)
    }
    const payload = {
      username: form.username, email: form.email, firstName: form.firstName, lastName: form.lastName,
      birthDate: form.birthDate, maritalStatus: form.maritalStatus, gender: form.gender,
      access: form.access, address1: form.address1, address2: form.address2
    }
    if (modalMode.value === 'add') {
      await userManagementService.createUser({ ...payload, directClientRoles: form.directClientRoles, encryptedPassword })
      showToast('User berhasil dibuat.')
    } else {
      const id = selectedUser.value.id
      await userManagementService.updateUser(id, payload)
      await userManagementService.updateRoleMappings(id, form.directClientRoles)
      if (encryptedPassword) await userManagementService.resetPassword(id, encryptedPassword)
      showToast('User berhasil diperbarui.')
    }
    modalOpen.value = false; await load()
  } catch (error) { formError.value = userManagementErrorMessage(error, 'Gagal menyimpan user.') }
  finally { saving.value = false }
}
async function toggleStatus(user) {
  if (!user.permissions?.changeStatus) return
  busyId.value = user.id
  try { await userManagementService.updateStatus(user.id, !user.enabled); user.enabled = !user.enabled; showToast('Status user berhasil diperbarui.') }
  catch (error) { showToast(userManagementErrorMessage(error, 'Gagal mengubah status user.'), 'error') }
  finally { busyId.value = '' }
}
async function deleteUser() {
  if (!deleteTarget.value) return
  deleting.value = true
  try { await userManagementService.deleteUser(deleteTarget.value.id); showToast('User berhasil dihapus.'); deleteTarget.value = null; await load() }
  catch (error) { showToast(userManagementErrorMessage(error, 'Gagal menghapus user.'), 'error') }
  finally { deleting.value = false }
}
onMounted(load)
</script>

<style scoped>
.primary-button { display: inline-flex; height: 40px; align-items: center; gap: 7px; border: 0; border-radius: 999px; background: var(--text); color: var(--surface); padding: 0 20px; font-size: 13px; font-weight: 800; cursor: pointer; }
.secondary-button, .danger-button { border-radius: 999px; padding: 9px 20px; font-size: 13px; font-weight: 800; cursor: pointer; }
.secondary-button { border: 1px solid var(--border); background: var(--surface); color: var(--text); }
.danger-button { border: 0; background: var(--danger); color: white; }
.tab-button { border: 0; border-radius: 9px; background: transparent; color: var(--text-muted); padding: 8px 13px; font-size: 12px; font-weight: 700; cursor: pointer; }
.tab-button.active { background: var(--brand-soft); color: var(--brand); }
.badge { display: inline-flex; border-radius: 999px; background: var(--brand-soft); color: var(--brand); padding: 3px 8px; font-size: 11px; font-weight: 700; }
.badge.inherited { background: var(--surface-muted); color: var(--text-muted); border: 1px dashed var(--border-strong); }
.status-button { display: inline-flex; align-items: center; gap: 7px; border: 0; background: transparent; color: var(--text-muted); font-size: 12px; cursor: pointer; }
.status-button span { width: 32px; height: 18px; border-radius: 999px; background: var(--border-strong); position: relative; }
.status-button span::after { content: ''; position: absolute; width: 14px; height: 14px; top: 2px; left: 2px; border-radius: 50%; background: white; transition: transform .15s ease; }
.status-button.enabled span { background: var(--success); }
.status-button.enabled span::after { transform: translateX(14px); }
.status-button:disabled, button:disabled { opacity: .45; cursor: not-allowed; }
.icon-action { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface); color: var(--text-muted); cursor: pointer; font-size: 20px; }
.icon-action.danger { color: var(--danger); }
.page-button { border: 1px solid var(--border); border-radius: 8px; background: var(--surface-muted); color: var(--text); padding: 6px 10px; cursor: pointer; }
</style>
