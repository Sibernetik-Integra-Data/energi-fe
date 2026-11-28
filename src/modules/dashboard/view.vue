<template>
  <div class="dashboard-shell">
    <BaseSidebar :items="navigation" :user="user" />

    <div class="dashboard-main">
      <BaseHeader
        eyebrow="Dasbor"
        :title="header.title"
        :notifications="header.notifications"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />

      <main class="dash" aria-labelledby="dash-title">
        <section class="dash__intro">
          <div class="dash__intro-text">
            <h1 id="dash-title">{{ intro.title }}</h1>
            <p class="dash__desc">{{ intro.description }}</p>
          </div>
          <div class="dash__toolbar" role="group" aria-label="Kendali dasbor">
            <span class="dash__live" aria-live="polite">
              <DashIcon name="clock" :size="14" />
              <template v-if="anyLoading">Memuat data…</template>
              <template v-else-if="lastUpdated">Pembaruan terakhir {{ lastUpdatedLabel }}</template>
            </span>
            <button type="button" class="dash__btn" :disabled="anyLoading" :aria-busy="anyLoading" @click="loadAll">
              <DashIcon name="refresh" :size="14" /> Muat ulang
            </button>
            <label class="sr-only" for="dash-period">Periode</label>
            <select id="dash-period" v-model.number="periodDays" class="dash__btn">
              <option v-for="d in PERIODS" :key="d" :value="d">{{ d }} hari</option>
            </select>
          </div>
          <nav v-if="quickLinks.length" class="dash__links" aria-label="Tautan cepat">
            <template v-for="link in quickLinks" :key="`${link.label}-${link.url}`">
              <RouterLink v-if="link.isInternal" :to="link.url" class="dash__link" :title="link.description || undefined">{{ link.label }}</RouterLink>
              <a v-else :href="link.url" target="_blank" rel="noopener noreferrer" class="dash__link" :title="link.description || undefined">{{ link.label }} ↗</a>
            </template>
          </nav>
        </section>

        <!-- KPI gaya Material 3 (prototipe p10): kartu tonal, angka besar + satuan, perubahan, pembanding. -->
        <section class="dash__kpis" aria-label="Ringkasan">
          <button v-for="g in GROUPS" :key="g.key" type="button" class="kc" :aria-pressed="selectedGroup === g.key"
            @click="toggleGroup(g.key)">
            <span class="kc__label">Sensus {{ g.label }}</span>
            <template v-if="sensus.loading"><span class="sk sk--line"></span></template>
            <span v-else-if="sensus.error" class="kc__err">Gagal dimuat</span>
            <template v-else>
              <span class="kc__value">{{ formatNumber(groupKpi[g.key].cur) }}<small>laporan</small></span>
              <KpiDelta :value="groupKpi[g.key].delta" />
              <span class="kc__sub">vs {{ prevLabel }}: {{ formatNumber(groupKpi[g.key].prev) }}</span>
            </template>
          </button>

          <div class="kc kc--primary">
            <span class="kc__label">Volume diterima {{ periodDays }} hari</span>
            <template v-if="ships.loading"><span class="sk sk--line"></span></template>
            <span v-else-if="ships.error" class="kc__err">Gagal dimuat</span>
            <template v-else-if="!unit.primary">
              <span class="kc__value">-</span>
              <span class="kc__sub">Belum ada pengiriman</span>
            </template>
            <template v-else>
              <span class="kc__value">{{ formatNumber(shipCur.received) }}<small>{{ unit.primary.name }}</small></span>
              <KpiDelta :value="receivedDelta" />
              <span class="kc__sub">vs {{ prevLabel }}: {{ formatNumber(shipPrev.received) }}<template v-if="shipCur.selisihPct !== null"> · selisih {{ formatNumber(shipCur.selisihPct, 1) }}%</template></span>
            </template>
            <!-- Bilah porsi volume dikirim yang sudah diterima; selalu tampil, kosong = lintasan saja. -->
            <span v-if="!ships.loading && !ships.error" class="kc__meter" role="img"
              :aria-label="`Diterima ${formatNumber(receivedShare, 1)}% dari volume dikirim`">
              <span class="kc__meter-fill" :style="{ width: `${receivedShare}%` }"></span>
            </span>
          </div>

          <button type="button" class="kc" :aria-pressed="feedKind === 'telat'" @click="toggleKind('telat')">
            <span class="kc__label">Rencana terlambat</span>
            <template v-if="plans.loading"><span class="sk sk--line"></span></template>
            <span v-else-if="plans.error" class="kc__err">Gagal dimuat</span>
            <template v-else>
              <span class="kc__value">{{ formatNumber(latePlans.length) }}<small>dari {{ formatNumber(activePlans.length) }}</small></span>
              <span class="kc__sub">Klik untuk lihat daftar rencana</span>
            </template>
          </button>
        </section>

        <div class="dash__grid">
          <!-- Sensus harian -->
          <section class="p s8" aria-labelledby="h-sensus">
            <h2 id="h-sensus">Sensus harian per kelompok <span>jumlah sensus per hari</span></h2>
            <div v-if="sensus.loading" class="sk sk--block" aria-busy="true"></div>
            <PanelError v-else-if="sensus.error" :text="sensus.error" @retry="loadSensus" />
            <template v-else>
              <p class="find">{{ sensusFinding }}</p>
              <div class="legend" role="group" aria-label="Saring kelompok">
                <button v-for="s in chartSeries" :key="s.key" type="button" :style="{ '--c': s.color }"
                  :aria-pressed="s.visible" @click="toggleGroup(s.key)">{{ s.label }}</button>
              </div>
              <SensusLineChart :rows="sensusRows" :series="chartSeries" />
            </template>
          </section>

          <!-- Perlu tindak lanjut -->
          <section class="p s4" aria-labelledby="h-feed">
            <h2 id="h-feed">Perlu tindak lanjut <span>{{ feedLoading ? '…' : `${feed.length} butir` }}</span></h2>
            <div class="legend" role="group" aria-label="Saring tingkat">
              <button v-for="l in LEVELS" :key="l.key" type="button" style="--c: var(--border-strong)"
                :aria-pressed="!feedLevel || feedLevel === l.key" @click="feedLevel = feedLevel === l.key ? null : l.key">{{ l.label }}</button>
              <button v-if="feedKind" type="button" class="legend__clear" @click="feedKind = null">
                <DashIcon name="x" :size="11" /> {{ KIND_LABEL[feedKind] }}
              </button>
            </div>
            <div v-if="feedLoading" class="sk sk--block" aria-busy="true"></div>
            <template v-else>
              <p v-if="feedErrors.length" class="state state--err" role="alert">
                <DashIcon name="alert" :size="14" /> Sebagian sumber gagal dimuat: {{ feedErrors.join(', ') }}.
              </p>
              <ul v-if="feed.length" class="feed">
                <li v-for="item in feed" :key="item.id">
                  <span class="tg" :class="`tg--${item.level}`"><DashIcon :name="item.level === 'peringatan' ? 'info' : 'alert'" :size="11" /> {{ LEVEL_LABEL[item.level] }}</span>
                  <RouterLink v-if="item.to" :to="item.to" class="feed__link">{{ item.text }}</RouterLink>
                  <span v-else>{{ item.text }}</span>
                </li>
              </ul>
              <p v-else class="state">Tidak ada butir tindak lanjut{{ feedKind || feedLevel ? ' untuk saringan ini' : '' }}.</p>
            </template>
          </section>

          <!-- Pengiriman 7 hari -->
          <section class="p s8" aria-labelledby="h-ship">
            <h2 id="h-ship">Pengiriman 7 hari <span>kirim vs terima per tanggal kirim{{ unit.primary ? `, ${unit.primary.name}` : '' }}</span></h2>
            <div v-if="ships.loading" class="sk sk--block" aria-busy="true"></div>
            <PanelError v-else-if="ships.error" :text="ships.error" @retry="loadShips" />
            <template v-else>
              <p class="find">{{ shipFinding }}</p>
              <div class="legend" aria-hidden="true">
                <span class="legend__key" style="--c: var(--dash-c-ship)">Kirim</span>
                <span class="legend__key" style="--c: var(--text-muted)">Terima</span>
              </div>
              <ul class="ship" aria-label="Kirim dan terima per hari">
                <li v-for="d in shipDays7" :key="d.date">
                  <span class="ship__day">{{ formatDay(d.date) }}</span>
                  <span class="ship__bars" aria-hidden="true">
                    <i class="ship__bar" :style="{ width: barWidth(d.shipped), background: 'var(--dash-c-ship)' }"></i>
                    <i class="ship__bar" :style="{ width: barWidth(d.received), background: 'var(--text-muted)' }"></i>
                  </span>
                  <span class="ship__nums">
                    <span class="sr-only">Kirim</span> {{ formatNumber(d.shipped) }} / <span class="sr-only">terima</span> {{ formatNumber(d.received) }}
                  </span>
                  <span class="ship__pct" :class="{ 'is-over': d.selisihPct !== null && d.selisihPct > SELISIH_LIMIT }">
                    <template v-if="!d.trips">tidak ada</template>
                    <template v-else-if="d.selisihPct === null">belum diterima</template>
                    <template v-else-if="d.selisihPct > SELISIH_LIMIT"><DashIcon name="alert" :size="12" /> {{ formatNumber(d.selisihPct, 1) }}% lewat batas</template>
                    <template v-else>selisih {{ formatNumber(d.selisihPct, 1) }}%</template>
                    <template v-if="d.trips && d.pendingTrips && d.selisihPct !== null"> · {{ d.pendingTrips }} belum diterima</template>
                  </span>
                </li>
              </ul>
              <p class="note">Selisih dihitung hanya dari pengiriman yang sudah diterima dengan satuan yang sama. Batas {{ SELISIH_LIMIT }}%.</p>
            </template>
          </section>

          <!-- Menunggu verifikasi -->
          <section v-if="showPending" class="p s4" aria-labelledby="h-pending">
            <h2 id="h-pending">{{ pendingTitle }} <span>{{ sensus.loading ? '…' : `${pendingFiltered.length} menunggu` }}</span></h2>
            <div v-if="sensus.loading" class="sk sk--block" aria-busy="true"></div>
            <PanelError v-else-if="sensus.error" :text="sensus.error" @retry="loadSensus" />
            <template v-else>
              <p v-if="pendingSubtitle" class="find">{{ pendingSubtitle }}</p>
              <ul v-if="pendingShown.length" class="pending">
                <li v-for="row in pendingShown" :key="row.code">
                  <div class="pending__main">
                    <strong>{{ row.code }}</strong>
                    <span class="pending__meta">{{ row.worker || '…' }} · {{ row.block }} · menunggu {{ waitLabel(hoursSince(row.createdAt)) || formatDay(row.sensusDate, true) }}</span>
                    <span v-if="row.jobTypes.length" class="pending__jobs">{{ row.jobTypes.join(', ') }}</span>
                  </div>
                  <RouterLink v-if="row.id != null" :to="`/sensus/${row.id}`" class="dash__btn dash__btn--icon"
                    :aria-label="`Periksa sensus ${row.code}`" :title="`Periksa sensus ${row.code}`">
                    <DashIcon name="arrowRight" :size="14" />
                  </RouterLink>
                </li>
              </ul>
              <p v-else class="state">Tidak ada sensus yang menunggu verifikasi{{ selectedGroup ? ' untuk kelompok ini' : '' }}.</p>
              <RouterLink v-if="pendingFiltered.length > pendingShown.length" to="/sensus" class="pending__more">
                Lihat semua di Sensus <DashIcon name="arrowRight" :size="12" />
              </RouterLink>
            </template>
          </section>

          <!-- Rencana kerja aktif -->
          <section class="p s12" aria-labelledby="h-plan">
            <h2 id="h-plan">Rencana kerja aktif
              <span v-if="selectedGroup || feedKind === 'telat'">
                {{ [selectedGroup && groupLabel(selectedGroup), feedKind === 'telat' && 'hanya terlambat'].filter(Boolean).join(' · ') }}
                <button type="button" class="dash__btn dash__btn--xs" @click="clearFilters">hapus saringan</button>
              </span>
              <span v-else>klik seri grafik untuk saring</span>
            </h2>
            <div v-if="plans.loading" class="sk sk--block" aria-busy="true"></div>
            <PanelError v-else-if="plans.error" :text="plans.error" @retry="loadPlans" />
            <template v-else>
              <p class="find">{{ planFinding }}</p>
              <div class="sc">
                <table>
                  <caption class="sr-only">Rencana kerja aktif</caption>
                  <thead>
                    <tr>
                      <th v-for="c in PLAN_COLUMNS" :key="c.key" :aria-sort="sortKey === c.key ? (sortDir > 0 ? 'ascending' : 'descending') : 'none'">
                        <button type="button" @click="sortBy(c.key)">{{ c.label }}
                          <DashIcon :name="sortKey === c.key ? (sortDir > 0 ? 'chevronUp' : 'chevronDown') : 'sort'" :size="12" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in planRows" :key="p.id">
                      <td>{{ groupLabel(p.group) || p.groupLabel || '-' }}</td>
                      <td>{{ p.job }}</td>
                      <td>{{ p.block }}</td>
                      <td>{{ formatDay(p.actualStart || p.start, true) }}</td>
                      <td>{{ formatDay(p.end, true) }}</td>
                      <td>
                        <span class="tg" :class="`tg--${planChip(p).tone}`"><DashIcon :name="planChip(p).icon" :size="11" /> {{ planChip(p).label }}</span>
                      </td>
                    </tr>
                    <tr v-if="!planRows.length">
                      <td colspan="6" class="state">{{ activePlans.length ? 'Tidak ada rencana untuk saringan ini.' : 'Belum ada rencana kerja aktif.' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import DashIcon from './components/DashIcon.vue'
import SensusLineChart from './components/SensusLineChart.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { useDashboardSettings } from './dashboardSettings'
import { GROUPS, PLAN_STATUS, SHIPMENT_WINDOW_DAYS, pendingSensus, withWorkerNames } from './model'
import {
  LEVELS, SELISIH_LIMIT, buildFeed, formatDay, formatNumber, hoursSince, percentChange,
  periodRange, primaryUnit, sensusDaily, shipmentDaily, shipmentSummary, waitLabel
} from './dashboardData'

const props = defineProps({
  controller: { type: Object, required: true }
})

const PERIODS = [7, 14, 28]
const LEVEL_LABEL = { kritis: 'KRITIS', serius: 'SERIUS', peringatan: 'PERINGATAN' }
const KIND_LABEL = { telat: 'Rencana terlambat', tunggu: 'Menunggu > 24 jam', timbang: 'Selisih timbang' }
const PLAN_COLUMNS = [
  { key: 'group', label: 'Kelompok' },
  { key: 'job', label: 'Pekerjaan' },
  { key: 'block', label: 'Blok' },
  { key: 'start', label: 'Mulai' },
  { key: 'end', label: 'Selesai' },
  { key: 'status', label: 'Status' }
]
const GROUP_COLOR = { pembersihan: 'var(--dash-c-pembersihan)', pemupukan: 'var(--dash-c-pemupukan)', panen: 'var(--dash-c-panen)' }


// Perubahan untuk kartu KPI: chevron naik/turun + persen (tidak hanya warna).
const KpiDelta = defineComponent({
  props: { value: { type: Number, default: null } },
  setup(p) {
    return () => {
      if (p.value === null || !Number.isFinite(p.value)) return h('span', { class: 'kc__delta kc__delta--none' }, 'Tidak ada pembanding')
      const up = p.value >= 0
      return h('span', { class: ['kc__delta', up ? 'is-up' : 'is-down'] }, [
        h('svg', { viewBox: '0 0 24 24', width: 14, height: 14, 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
          [h('path', { d: up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6' })]),
        h('span', { class: 'sr-only' }, up ? 'naik ' : 'turun '),
        h('span', { class: 'kc__pct' }, `${up ? '+' : '−'}${formatNumber(Math.abs(p.value), 1)}%`)
      ])
    }
  }
})

const PanelError = defineComponent({
  props: { text: { type: String, required: true } },
  emits: ['retry'],
  setup(p, { emit }) {
    return () => h('div', { class: 'state state--err', role: 'alert' }, [
      h('p', p.text),
      h('button', { type: 'button', class: 'dash__btn', onClick: () => emit('retry') }, 'Coba lagi')
    ])
  }
})

const appStore = useAppStore()
const cms = useDashboardSettings()

const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => {
  const base = props.controller.getIntro()
  return {
    title: cms.value?.intro?.title || base.title,
    description: cms.value?.intro?.description || base.description
  }
})
const quickLinks = computed(() => cms.value?.quickLinks || [])
const showPending = computed(() => cms.value?.pending?.isVisible !== false)
const pendingTitle = computed(() => cms.value?.pending?.title || 'Menunggu verifikasi')
const pendingSubtitle = computed(() => cms.value?.pending?.subtitle || '')
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())

// ── Data (tiap sumber berdiri sendiri: satu gagal, yang lain tetap tampil) ──

const sensus = ref({ loading: true, error: '', list: [] })
const plans = ref({ loading: true, error: '', list: [] })
const ships = ref({ loading: true, error: '', list: [] })
const pendingNamed = ref([])
const lastUpdated = ref(null)
const now = ref(new Date())

async function loadSensus() {
  sensus.value = { ...sensus.value, loading: true, error: '' }
  try {
    const list = await props.controller.loadSensus()
    sensus.value = { loading: false, error: '', list }
  } catch (error) {
    console.error('[Dashboard] Gagal memuat sensus:', error)
    sensus.value = { loading: false, error: 'Data sensus gagal dimuat.', list: [] }
  }
}

async function loadPlans() {
  plans.value = { ...plans.value, loading: true, error: '' }
  try {
    plans.value = { loading: false, error: '', list: await props.controller.loadPlannings() }
  } catch (error) {
    console.error('[Dashboard] Gagal memuat rencana kerja:', error)
    plans.value = { loading: false, error: 'Data rencana kerja gagal dimuat.', list: [] }
  }
}

async function loadShips() {
  ships.value = { ...ships.value, loading: true, error: '' }
  try {
    ships.value = { loading: false, error: '', list: await props.controller.loadShipments() }
  } catch (error) {
    console.error('[Dashboard] Gagal memuat pengiriman:', error)
    ships.value = { loading: false, error: 'Data pengiriman gagal dimuat.', list: [] }
  }
}

async function loadAll() {
  now.value = new Date()
  await Promise.allSettled([loadSensus(), loadPlans(), loadShips()])
  now.value = new Date()
  lastUpdated.value = now.value
}

const anyLoading = computed(() => sensus.value.loading || plans.value.loading || ships.value.loading)
const lastUpdatedLabel = computed(() => {
  const d = lastUpdated.value
  if (!d) return ''
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}`
})

watch(() => appStore.ready, (ready) => { if (ready) loadAll() }, { immediate: true })

// ── Saringan ───────────────────────────────────────────────────────────────

const periodDays = ref(14)
const selectedGroup = ref(null)
const feedKind = ref(null)
const feedLevel = ref(null)
const sortKey = ref('end')
const sortDir = ref(1)

function toggleKind(kind) { feedKind.value = feedKind.value === kind ? null : kind }
function toggleGroup(key) { selectedGroup.value = selectedGroup.value === key ? null : key }
function clearFilters() { selectedGroup.value = null; feedKind.value = null; feedLevel.value = null }
function sortBy(key) {
  sortDir.value = sortKey.value === key ? -sortDir.value : 1
  sortKey.value = key
}
const groupLabel = (key) => GROUPS.find((g) => g.key === key)?.label || ''

const range = computed(() => periodRange(periodDays.value, now.value))

// ── Sensus ─────────────────────────────────────────────────────────────────

const sensusRows = computed(() => sensusDaily(sensus.value.list, periodDays.value, now.value))
const chartSeries = computed(() => GROUPS.map((g) => ({
  ...g, color: GROUP_COLOR[g.key], visible: !selectedGroup.value || selectedGroup.value === g.key
})))
const sensusFinding = computed(() => {
  const totals = GROUPS.map((g) => ({ ...g, total: sensusRows.value.reduce((t, r) => t + r[g.key], 0) }))
    .sort((a, b) => b.total - a.total)
  if (!totals[0].total) return `Belum ada sensus tercatat dalam ${periodDays.value} hari terakhir.`
  const top = totals[0]
  const tied = totals.filter((t) => t.total === top.total)
  if (tied.length === totals.length) return `Semua kelompok sama: masing-masing ${formatNumber(top.total)} sensus dalam ${periodDays.value} hari.`
  if (tied.length > 1) return `${tied.map((t) => t.label).join(' dan ')} paling banyak dicatat: masing-masing ${formatNumber(top.total)} sensus dalam ${periodDays.value} hari.`
  return `${top.label} paling banyak dicatat: ${formatNumber(top.total)} sensus dalam ${periodDays.value} hari.`
})

const pendingAll = computed(() => pendingSensus(sensus.value.list))
const pendingFiltered = computed(() => pendingAll.value.filter((r) => !selectedGroup.value || r.groups.includes(selectedGroup.value)))
const pendingShown = computed(() => {
  const named = new Map(pendingNamed.value.map((r) => [r.code, r.worker]))
  return pendingFiltered.value.slice(0, 6).map((r) => ({ ...r, worker: named.get(r.code) || '' }))
})
// Nama pekerja hanya untuk baris yang tampil.
watch(pendingShown, async (rows) => {
  const missing = rows.filter((r) => !r.worker)
  if (!missing.length) return
  const named = await withWorkerNames(missing)
  const known = new Map(pendingNamed.value.map((r) => [r.code, r]))
  named.forEach((r) => known.set(r.code, r))
  pendingNamed.value = [...known.values()]
})

// ── Rencana kerja ──────────────────────────────────────────────────────────

const activePlans = computed(() => plans.value.list.filter((p) => !p.closed))
const latePlans = computed(() => activePlans.value.filter((p) => p.lateDays > 0))

function planChip(p) {
  if (p.lateDays) return { tone: 'kritis', icon: 'alert', label: `Terlambat ${p.lateDays} hari` }
  if (p.status === 'in_progress') return { tone: 'info', icon: 'clock', label: PLAN_STATUS.in_progress }
  if (p.status === 'planned') return { tone: 'netral', icon: 'calendar', label: PLAN_STATUS.planned }
  if (PLAN_STATUS[p.status]) return { tone: 'netral', icon: 'calendar', label: PLAN_STATUS[p.status] }
  // Status kosong: turunkan dari tanggal (sudah mulai = berjalan, belum = direncanakan).
  const today = new Date().toLocaleDateString('sv-SE')
  if (p.actualStart || (p.start && p.start <= today)) return { tone: 'info', icon: 'clock', label: PLAN_STATUS.in_progress }
  return { tone: 'netral', icon: 'calendar', label: PLAN_STATUS.planned }
}

const planRows = computed(() => {
  const key = sortKey.value
  const value = (p) => {
    if (key === 'group') return groupLabel(p.group) || p.groupLabel
    if (key === 'status') return p.lateDays ? `0-${String(9999 - p.lateDays).padStart(4, '0')}` : `1-${p.status}`
    if (key === 'start') return p.actualStart || p.start || ''
    return p[key] || ''
  }
  return activePlans.value
    .filter((p) => (!selectedGroup.value || p.group === selectedGroup.value) && (feedKind.value !== 'telat' || p.lateDays > 0))
    .sort((a, b) => String(value(a)).localeCompare(String(value(b)), 'id') * sortDir.value)
})

const planFinding = computed(() => {
  if (!activePlans.value.length) return 'Tidak ada rencana yang sedang berjalan atau direncanakan.'
  if (!latePlans.value.length) return `${formatNumber(activePlans.value.length)} rencana aktif, semuanya masih dalam tenggat.`
  const worst = [...latePlans.value].sort((a, b) => b.lateDays - a.lateDays)[0]
  return `${formatNumber(latePlans.value.length)} rencana lewat tenggat; terlama ${worst.job} di ${worst.block} (${worst.lateDays} hari).`
})

// ── Pengiriman ─────────────────────────────────────────────────────────────

const unit = computed(() => primaryUnit(ships.value.list))
const shipCur = computed(() => shipmentSummary(ships.value.list, unit.value.primary, range.value.from, range.value.to))
const shipPrev = computed(() => shipmentSummary(ships.value.list, unit.value.primary, range.value.prevFrom, range.value.prevTo))
// Porsi volume dikirim yang sudah diterima (0–100); 0 bila belum ada pengiriman.
const receivedShare = computed(() => {
  const shipped = shipCur.value.shipped
  return shipped > 0 ? Math.min(100, Math.max(0, (shipCur.value.received / shipped) * 100)) : 0
})

// Sensus per kelompok: periode ini vs periode sebelumnya yang sama panjang.
const groupKpi = computed(() => {
  const list = sensus.value.list
  const { from, to, prevFrom, prevTo } = range.value
  const count = (key, a, b) => list.filter((s) => s.date >= a && s.date <= b && s.groups.includes(key)).length
  return Object.fromEntries(GROUPS.map((g) => {
    const cur = count(g.key, from, to)
    const prev = count(g.key, prevFrom, prevTo)
    return [g.key, { cur, prev, delta: percentChange(cur, prev) }]
  }))
})
const prevLabel = computed(() => `${formatDay(range.value.prevFrom)}–${formatDay(range.value.prevTo)}`)
const receivedDelta = computed(() => percentChange(shipCur.value.received, shipPrev.value.received))
const shipDaysPeriod = computed(() => shipmentDaily(ships.value.list, unit.value.primary, periodDays.value, now.value))
const overDays = computed(() => shipDaysPeriod.value.filter((d) => d.selisihPct !== null && d.selisihPct > SELISIH_LIMIT))
const shipDays7 = computed(() => shipmentDaily(ships.value.list, unit.value.primary, 7, now.value))
const shipMax = computed(() => Math.max(1, ...shipDays7.value.flatMap((d) => [d.shipped, d.received])))
const barWidth = (v) => `${Math.max(0, (v / shipMax.value) * 100)}%`
const shipFinding = computed(() => {
  const days = shipDays7.value
  if (!unit.value.primary) return `Belum ada pengiriman dalam ${SHIPMENT_WINDOW_DAYS} hari terakhir.`
  if (!days.some((d) => d.trips)) return 'Tidak ada pengiriman dalam 7 hari terakhir.'
  const over = days.filter((d) => d.selisihPct !== null && d.selisihPct > SELISIH_LIMIT)
  return over.length
    ? `Selisih lebih dari ${SELISIH_LIMIT}% pada ${over.map((d) => formatDay(d.date)).join(', ')}.`
    : `Selisih semua hari dalam batas ${SELISIH_LIMIT}%.`
})

// ── Tindak lanjut ──────────────────────────────────────────────────────────

const feedLoading = computed(() => anyLoading.value)
const feedErrors = computed(() => [
  sensus.value.error && 'sensus',
  plans.value.error && 'rencana kerja',
  ships.value.error && 'pengiriman'
].filter(Boolean))
const feedAll = computed(() => buildFeed({
  plans: plans.value.list,
  pending: pendingAll.value,
  shipDays: shipDaysPeriod.value,
  unitName: unit.value.primary?.name || '',
  now: now.value
}))
const feed = computed(() => feedAll.value.filter((i) => (!feedKind.value || i.kind === feedKind.value) && (!feedLevel.value || i.level === feedLevel.value)))
</script>

<style scoped>
.dashboard-shell { height: 100vh; display: flex; background: transparent; }
.dashboard-main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

.dash {
  /* Warna seri grafik (terang); versi gelap di bawah. Aksen tenang, tanpa glow. */
  --dash-c-pembersihan: #0e7490;
  --dash-c-pemupukan: #6d28d9;
  --dash-c-panen: #c2410c;
  --dash-c-ship: #0e7490;
  /* Kartu KPI tonal (Material 3, p10): permukaan krem dan wadah utama oranye muda. */
  --kc-surface: #f2e4d8;
  --kc-on-variant: #52443c;
  --kc-primary-container: #ffdcbf;
  --kc-on-primary-container: #2d1600;
  --kc-meter: var(--brand-strong);
  flex: 1; min-width: 0; overflow: auto;
  padding: 16px 24px 32px;
  display: grid; gap: 12px; align-content: start;
}
:global(.theme-dark .dash) {
  --dash-c-pembersihan: #22d3ee;
  --dash-c-pemupukan: #a78bfa;
  --dash-c-panen: #fb923c;
  --dash-c-ship: #22d3ee;
  --kc-surface: #2f2824;
  --kc-on-variant: #d8c3b6;
  --kc-primary-container: #6b3b00;
  --kc-on-primary-container: #ffdcbf;
}

.dash__intro { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px 16px; }
.dash__intro-text { flex: 1 1 320px; min-width: 0; }
.dash__intro h1 { margin: 0; font-size: clamp(24px, 2.6vw, 32px); line-height: 1.1; letter-spacing: -0.03em; }
.dash__desc { margin: 4px 0 0; color: var(--text-muted); font-size: 14px; line-height: 20px; max-width: 640px; }
.dash__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.dash__live { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.dash__links { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 8px; }
.dash__link {
  display: inline-flex; align-items: center; min-height: 32px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: 999px; background: var(--surface);
  color: var(--text); font-size: 13px; font-weight: 600; text-decoration: none;
}
.dash__link:hover { border-color: var(--brand); color: var(--brand-strong); }

.dash :deep(.dash__btn) {
  font: inherit; font-size: 13px; min-height: 32px; padding: 4px 10px;
  border: 1px solid var(--border-strong); border-radius: 6px;
  background: var(--surface); color: var(--text); cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
}
.dash :deep(.dash__btn:hover:not(:disabled)) { border-color: var(--brand); }
.dash__btn:disabled { opacity: 0.6; cursor: progress; }
.dash__btn--xs { min-height: 22px; padding: 0 6px; font-size: 11px; text-transform: none; letter-spacing: 0; }
.dash__btn--icon { min-height: 32px; width: 32px; padding: 0; justify-content: center; flex: none; }

.dash :focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

.dash__kpis { display: grid; gap: 12px; grid-template-columns: repeat(5, minmax(0, 1fr)); }

/* ── Kartu KPI gaya Material 3 ─────────────────────────────────────────── */
.kc {
  position: relative;
  display: flex; flex-direction: column; gap: 6px; align-items: flex-start;
  min-height: 132px; padding: 16px 18px;
  border: 0; border-radius: 16px;
  background: var(--kc-surface); color: var(--text);
  font: inherit; text-align: left;
}
button.kc { cursor: pointer; }
/* Lapisan keadaan (state layer) M3 saat diarahkan/ditekan. */
button.kc::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: currentColor; opacity: 0; transition: opacity .15s ease; pointer-events: none; }
button.kc:hover::after { opacity: .06; }
button.kc:active::after { opacity: .1; }
button.kc:focus-visible { outline: 2px solid var(--brand-strong); outline-offset: 2px; }
button.kc[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--brand-strong); }
.kc--primary { background: var(--kc-primary-container); color: var(--kc-on-primary-container); }
.kc__label { font-size: 13px; font-weight: 500; color: var(--kc-on-variant); letter-spacing: .01em; }
.kc--primary .kc__label, .kc--primary .kc__sub, .kc--primary .kc__value small { color: var(--kc-on-primary-container); }
.kc__value { display: inline-flex; align-items: baseline; gap: 6px; font-size: 34px; font-weight: 400; line-height: 1.1; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
.kc__value small { font-size: 14px; font-weight: 400; color: var(--kc-on-variant); letter-spacing: 0; }
.kc__delta { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--text); }
.kc__delta svg { flex: 0 0 auto; }
.kc__delta.is-up svg { color: var(--success); }
.kc__delta.is-down svg { color: var(--danger); }
.kc__delta--none { font-weight: 500; color: var(--kc-on-variant); }
.kc--primary .kc__delta { color: var(--kc-on-primary-container); }
.kc__sub { font-size: 13px; color: var(--kc-on-variant); }
.kc__err { font-size: 13px; color: var(--danger); }
.kc__meter { display: block; width: 100%; height: 8px; margin-top: auto; border-radius: 4px; overflow: hidden; background: color-mix(in srgb, var(--kc-on-primary-container) 18%, transparent); }
.kc__meter-fill { display: block; height: 100%; border-radius: 4px; background: var(--kc-meter); transition: width .3s ease; }
@media (prefers-reduced-motion: reduce) { .kc__meter-fill { transition: none; } }
@media (forced-colors: active) { .kc__meter { border: 1px solid CanvasText; } .kc__meter-fill { background: Highlight; forced-color-adjust: none; } }
@media (prefers-reduced-motion: reduce) { button.kc::after { transition: none; } }
@media (prefers-contrast: more) { .kc { border: 2px solid var(--text); } }
@media (forced-colors: active) { .kc { border: 1px solid CanvasText; } button.kc[aria-pressed="true"] { outline: 2px solid Highlight; } }
.dash__grid { display: grid; gap: 12px; grid-template-columns: repeat(12, minmax(0, 1fr)); }
.s4 { grid-column: span 4; } .s8 { grid-column: span 8; } .s12 { grid-column: span 12; }

.p { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; min-width: 0; }
.p h2 {
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);
  margin: 0 0 6px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;
}
.p h2 > span { text-transform: none; letter-spacing: 0; font-weight: 400; display: inline-flex; align-items: center; gap: 6px; }
.find { font-size: 13px; margin: 0 0 8px; color: var(--text); }
.note { font-size: 11px; color: var(--text-muted); margin: 8px 0 0; }

:deep(.up) { color: var(--success); }
:deep(.down) { color: var(--danger); }

.legend { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.legend button, .legend__key {
  font: inherit; font-size: 12px; border: 1px solid var(--border); background: none; color: var(--text);
  border-radius: 99px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px;
}
.legend button { cursor: pointer; }
.legend button::before, .legend__key::before { content: ''; display: inline-block; width: 10px; height: 3px; background: var(--c); border-radius: 2px; }
.legend button[aria-pressed='false'] { opacity: 0.55; text-decoration: line-through; }
.legend button[aria-pressed='true'] { border-color: var(--border-strong); }
.legend .legend__clear::before { display: none; }

.tg {
  font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 4px;
  display: inline-flex; gap: 3px; align-items: center; white-space: nowrap; color: var(--text);
}
.tg--kritis { background: var(--danger-soft); color: var(--danger); }
.tg--serius { background: var(--warning-soft); }
.tg--peringatan { background: var(--info-soft); }
.tg--info { background: var(--info-soft); }
.tg--netral { background: var(--surface-muted); border: 1px solid var(--border); }

.feed { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 13px; max-height: 320px; overflow: auto; }
.feed li { display: flex; gap: 8px; align-items: flex-start; padding: 6px; border-radius: 6px; background: var(--surface-muted); }
.feed__link { color: var(--text); text-decoration: underline; text-decoration-color: var(--border-strong); text-underline-offset: 2px; }
.feed__link:hover { text-decoration-color: var(--brand); }

.sc { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { padding: 6px; border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
th button {
  font: inherit; font-weight: 600; color: var(--text); background: none; border: 0; cursor: pointer;
  padding: 0; display: inline-flex; gap: 2px; align-items: center;
}
td.state { white-space: normal; }

.pending { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.pending li { display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 6px; background: var(--surface-muted); }
.pending__main { flex: 1; min-width: 0; display: grid; gap: 1px; font-size: 13px; }
.pending__meta, .pending__jobs { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pending__more { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 12px; color: var(--brand-strong); }

.ship { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 12px; }
.ship li { display: grid; grid-template-columns: 52px minmax(80px, 1fr) minmax(90px, auto) minmax(140px, auto); gap: 10px; align-items: center; }
.ship__day { color: var(--text-muted); font-variant-numeric: tabular-nums; }
.ship__bars { display: grid; gap: 2px; padding: 2px 0; border-left: 2px solid var(--border-strong); } /* garis dasar tetap terlihat saat kosong */
.ship__bar { display: block; height: 7px; border-radius: 2px; min-width: 0; }
.ship__nums { text-align: right; font-variant-numeric: tabular-nums; }
.ship__pct { color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
.ship__pct.is-over { color: var(--danger); font-weight: 700; }

.state { color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 8px; margin: 0; }
:deep(.state--err) { color: var(--danger); display: grid; justify-items: center; gap: 8px; }
:deep(.state--err) p { margin: 0; }
p.state--err { display: flex; gap: 6px; justify-content: center; align-items: center; padding: 6px; }

.sk { display: block; border-radius: 8px; background: var(--surface-muted); animation: dash-pulse 1.4s ease-in-out infinite; }
.sk--line { height: 30px; margin-top: 4px; }
.sk--block { height: 160px; }
@keyframes dash-pulse { 50% { opacity: 0.5; } }
@media (prefers-reduced-motion: reduce) { .sk { animation: none; } }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }


@media (max-width: 1180px) {
  .dash__kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .s4, .s8 { grid-column: span 12; }
}
@media (max-width: 920px) {
  .dashboard-shell { flex-direction: column; }
  .dash { padding: 12px 16px 24px; }
}
@media (max-width: 640px) {
  .dash__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ship li { grid-template-columns: 44px 1fr auto; }
  .ship__pct { grid-column: 2 / -1; }
}
</style>
