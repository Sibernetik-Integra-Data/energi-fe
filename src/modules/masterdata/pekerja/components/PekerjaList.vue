<template>
  <MdPage title="Pekerja" description="Daftar pengguna beserta jabatan (akses) masing-masing. Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="isOwner" type="button" class="md-btn md-btn--primary" :disabled="openingAdd" @click="openAddUser">
        <MdIcon name="plus" />{{ openingAdd ? 'Memuat…' : 'Tambah Pengguna' }}
      </button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="users" tone="info" label="Total pekerja" :value="total" :sub="`${jabatanList.length} jabatan`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi
        icon="star"
        tone="brand"
        label="Jabatan terbanyak"
        :value="topJabatan ? topJabatan.count : 0"
        :sub="topJabatan ? topJabatan.label : 'Belum ada jabatan'"
        :action="!!topJabatan"
        :pressed="!!topJabatan && onlyJabatan(topJabatan.value)"
        @select="topJabatan && quickJabatan(topJabatan.value)" />
      <MdKpi icon="check" tone="success" label="Berjabatan" :value="total - noJabatanCount" :sub="`${pct(total - noJabatanCount)}% dari data`" action :pressed="hasOnly" @select="toggleHas" />
      <MdKpi icon="alert" tone="warning" label="Tanpa jabatan" :value="noJabatanCount" :sub="`${pct(noJabatanCount)}% dari data`" action :pressed="onlyJabatan(NONE)" @select="quickJabatan(NONE)" />
    </div>

    <MdBarChart
      v-if="jabatanList.length > 1"
      title="Jumlah pekerja per jabatan"
      :subtitle="`${rows.length} pekerja di ${jabatanList.length} jabatan`"
      :legend="[{ label: 'Berjabatan', color: 'var(--success)' }, { label: 'Tanpa jabatan', color: 'var(--border-strong)' }]"
      :bars="bars"
      :selected="filterJabatan"
      @toggle="toggleJabatan" />

    <MdDataTable
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      entity-label="Pekerja"
      empty-icon="users"
      empty-text="Belum ada pekerja."
      initial-sort="name"
      aria-label="Daftar pekerja"
      @retry="loadData"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nama, email, atau ID…" aria-label="Cari pekerja" />
        </label>
        <MdDropdown v-model="filterJabatan" label="Jabatan" :options="jabatanOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="`Hapus filter ${c.label}`" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">Bersihkan semua</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ initial(fullName(row)) }}</span>
          <div><b>{{ fullName(row) || '-' }}</b><small>ID {{ shortId(row.user_id) }}</small></div>
        </div>
      </template>
      <template #cell-email="{ row }">
        <span v-if="row.email">{{ row.email }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-jabatan="{ row }">
        <MdBadge v-if="row.jabatan" tone="info">{{ row.jabatan }}</MdBadge><span v-else class="md-muted">Tanpa jabatan</span>
      </template>

      <template v-if="canViewProfiles" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Lihat profil ${fullName(row)}`" title="Lihat" @click="onView(row)"><MdIcon name="eye" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(fullName(row)) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ fullName(row) || '-' }}</b><div class="md-muted" style="font-size: 12px">ID {{ shortId(row.user_id) }}</div></div>
        </div>
        <div class="md-card__grid">
          <div>Email<b>{{ row.email || '—' }}</b></div>
          <div>Jabatan<b>{{ row.jabatan || 'Tanpa jabatan' }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <UserManagementModal
      v-if="addModalOpen"
      mode="add"
      :configuration="configuration"
      :saving="savingAdd"
      :error="modalError"
      @close="addModalOpen = false"
      @save="createUser" />
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listPekerja } from '../model'
import UserManagementModal from '../../../user-management/components/UserManagementModal.vue'
import userManagementService, { userManagementErrorMessage } from '../../../user-management/services/userManagementService'
import { getPasswordEncryptionKey } from '../../../../auth/accountApi'
import { encryptPassword } from '../../../user-management/services/passwordEncryption'
import { useToast } from '../../../../utils/toast'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdIcon } from '../../../shared/masterdata-ui'

const router = useRouter()
const { show: showToast } = useToast()

const NONE = '__none__'
const fullName = (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim()
const shortId = (id) => (id ? `${id.substring(0, 8)}…` : '-')
const initial = (n) => String(n || '#').trim().charAt(0).toUpperCase() || '#'
const jabKey = (r) => r.jabatan || NONE

const columns = [
  { key: 'name', label: 'Nama', sortValue: (r) => fullName(r).toLowerCase() },
  { key: 'email', label: 'Email', sortValue: (r) => (r.email || '').toLowerCase() },
  { key: 'jabatan', label: 'Jabatan', sortValue: (r) => (r.jabatan || '').toLowerCase() }
]

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const fetchError = ref(null)
const search = ref('')
const filterJabatan = ref([])
const isOwner = ref(false)
const canViewProfiles = ref(false)
const addModalOpen = ref(false)
const openingAdd = ref(false)
const savingAdd = ref(false)
const modalError = ref('')
const configuration = ref({ accessOptions: [], client: { clientId: 'mobile', roles: [] } })

const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const noJabatanCount = computed(() => rows.value.filter((r) => !r.jabatan).length)
const jabatanList = computed(() => {
  const m = new Map()
  rows.value.forEach((r) => { if (r.jabatan) m.set(r.jabatan, (m.get(r.jabatan) || 0) + 1) })
  return [...m.entries()].map(([value, count]) => ({ value, label: value, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
})
const topJabatan = computed(() => jabatanList.value[0] || null)
const jabatanOptions = computed(() => [
  ...jabatanList.value,
  ...(noJabatanCount.value ? [{ value: NONE, label: 'Tanpa jabatan', count: noJabatanCount.value }] : [])
])
const labelOf = (v) => (v === NONE ? 'Tanpa jabatan' : v)
const bars = computed(() => jabatanOptions.value.map((o) => ({
  key: o.value,
  label: o.label,
  ariaLabel: `${o.label}: ${o.count} pekerja`,
  segments: [{ value: o.count, color: o.value === NONE ? 'var(--border-strong)' : 'var(--success)' }]
})))

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || [fullName(r), r.email, r.user_id].some((v) => String(v || '').toLowerCase().includes(q))) &&
    (!filterJabatan.value.length || filterJabatan.value.includes(jabKey(r)))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterJabatan.value.forEach((k) => c.push({ key: `j-${k}`, label: labelOf(k), remove: () => (filterJabatan.value = filterJabatan.value.filter((x) => x !== k)) }))
  return c
})

function clearAll() {
  search.value = ''
  filterJabatan.value = []
}
const onlyJabatan = (k) => filterJabatan.value.length === 1 && filterJabatan.value[0] === k
function quickJabatan(k) {
  filterJabatan.value = onlyJabatan(k) ? [] : [k]
}
function toggleJabatan(k) {
  filterJabatan.value = filterJabatan.value.includes(k) ? filterJabatan.value.filter((x) => x !== k) : [...filterJabatan.value, k]
}
const allJabatanValues = computed(() => jabatanList.value.map((j) => j.value))
const hasOnly = computed(() =>
  allJabatanValues.value.length > 0 &&
  filterJabatan.value.length === allJabatanValues.value.length &&
  allJabatanValues.value.every((v) => filterJabatan.value.includes(v))
)
function toggleHas() {
  filterJabatan.value = hasOnly.value ? [] : [...allJabatanValues.value]
}

function onView(row) {
  if (!row?.user_id) return
  router.push({ path: `/master-data/pekerja/${encodeURIComponent(row.user_id)}` })
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    const result = await listPekerja()
    rows.value = result.data
    total.value = result.total
  } catch (err) {
    console.error('[Pekerja] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat data pekerja.'
  } finally {
    loading.value = false
  }
}

async function openAddUser() {
  openingAdd.value = true
  modalError.value = ''
  try {
    configuration.value = await userManagementService.getConfiguration()
    addModalOpen.value = true
  } catch (err) {
    showToast(userManagementErrorMessage(err, 'Gagal memuat konfigurasi pengguna.'), 'error')
  } finally {
    openingAdd.value = false
  }
}

async function createUser(form) {
  savingAdd.value = true
  modalError.value = ''
  try {
    const { publicKey } = await getPasswordEncryptionKey()
    const encryptedPassword = await encryptPassword(form.password, publicKey)
    await userManagementService.createUser({
      username: form.username,
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      birthDate: form.birthDate,
      maritalStatus: form.maritalStatus,
      gender: form.gender,
      access: form.access,
      address1: form.address1,
      address2: form.address2,
      directClientRoles: form.directClientRoles,
      encryptedPassword
    })
    addModalOpen.value = false
    showToast('Pengguna berhasil dibuat.')
    await loadData()
  } catch (err) {
    modalError.value = userManagementErrorMessage(err, 'Gagal membuat pengguna.')
  } finally {
    savingAdd.value = false
  }
}

onMounted(async () => {
  const [profileAccessResult] = await Promise.allSettled([
    userManagementService.verifyWorkerProfileAccess(),
    loadData()
  ])
  const access = profileAccessResult.status === 'fulfilled' ? profileAccessResult.value : null
  isOwner.value = access?.isOwner === true
  canViewProfiles.value = access?.canViewWorkerProfiles === true
})
</script>
