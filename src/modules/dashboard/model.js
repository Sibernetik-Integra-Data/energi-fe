import { getAuthenticatedUser } from '../../auth/keycloak'
import { navigation as sharedNavigation } from '../shared/navigation'
import { signedApiFetch } from '../../api/fetch'
import { resolveUsernames } from '../../utils/userCache'
import i18n from '../../i18n'

const t = (...args) => i18n.global.t(...args)

// Dasbor "Ruang kendali" (prototipe p08). Semua angka berasal dari API:
// /sensus, /planning dan /trip-receipts. Tidak ada data contoh di sini.

function cloneNavigation(items) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
}

// ── Tanggal ────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0')

/** Tanggal lokal sebagai kunci YYYY-MM-DD. */
export function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Nilai API (tanggal polos atau stempel waktu) ke kunci YYYY-MM-DD lokal; null bila tidak terbaca. */
export function toDateKey(value) {
  if (!value) return null
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  if (plain) return plain[0]
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : dateKey(d)
}

export function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + days)
  return d
}

/** Selisih hari kalender a - b (kunci YYYY-MM-DD). */
export function dayDiff(a, b) {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(ya, ma - 1, da) - Date.UTC(yb, mb - 1, db)) / 86400000)
}

// ── Kelompok pekerjaan ─────────────────────────────────────────────────────

export const GROUPS = [
  { key: 'pembersihan', get label() { return t('nav.pembersihan') } },
  { key: 'pemupukan', get label() { return t('nav.pemupukan') } },
  { key: 'panen', get label() { return t('nav.panen') } }
]
// Cadangan bila nama kelompok tidak dikirim: id yang dipakai dasbor lama.
const GROUP_BY_ID = { 1: 'pembersihan', 2: 'panen', 3: 'pemupukan' }

export function groupKeyOf(typeOfWork) {
  const name = String(typeOfWork?.group_of_work_name || '').toLowerCase()
  if (name.includes('bersih')) return 'pembersihan'
  if (name.includes('pupuk')) return 'pemupukan'
  if (name.includes('panen')) return 'panen'
  const id = Number(typeOfWork?.group_of_work)
  return GROUP_BY_ID[id] || null
}

function blockNames(blocks) {
  return [...new Set((Array.isArray(blocks) ? blocks : [])
    .map((b) => String((typeof b === 'string' ? b : b?.name) || (b?.id ? t('dashboard.block', { id: b.id }) : '')).replace(/^Block\b/i, 'Blok'))
    .filter(Boolean))]
}

function blockLabel(names) {
  if (!names.length) return '-'
  return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0]
}

// ── Sensus ─────────────────────────────────────────────────────────────────

/** Satu permintaan /sensus; daftar mentahnya dipakai grafik, KPI dan verifikasi. */
async function loadSensusList() {
  const resp = await signedApiFetch('/sensus?page=1&limit=500', { method: 'GET' })
  const list = Array.isArray(resp?.data) ? resp.data : []
  return list.map((sensus) => {
    const details = Array.isArray(sensus.details) ? sensus.details : []
    return {
      id: sensus.id ?? null,
      code: sensus.id_sensus || `#${sensus.id}`,
      date: toDateKey(sensus.sensus_date),
      createdAt: sensus.created_at || null,
      createdBy: sensus.created_by || '',
      groups: [...new Set(details.map((d) => groupKeyOf(d.type_of_work)).filter(Boolean))],
      details
    }
  })
}

// Detail sensus dianggap terverifikasi bila sudah punya planning; selama belum,
// sensus itu menunggu pemeriksaan (kecuali detail yang selesai/dibatalkan).
const CLOSED_DETAIL = new Set(['done', 'cancelled'])
const PENDING_LIMIT = 6

/** Sensus yang menunggu verifikasi, yang paling lama menunggu lebih dulu. */
export function pendingSensus(sensusList) {
  const rows = []
  for (const s of sensusList) {
    const open = s.details.filter((d) => !d.planning && !CLOSED_DETAIL.has(String(d.progress_status || '').toLowerCase()))
    if (!open.length) continue
    rows.push({
      id: s.id,
      code: s.code,
      workerId: s.createdBy,
      worker: '',
      block: blockLabel(blockNames(open.flatMap((d) => d.blocks || []))),
      jobTypes: [...new Set(open.map((d) => d.type_of_work?.name).filter(Boolean))],
      groups: [...new Set(open.map((d) => groupKeyOf(d.type_of_work)).filter(Boolean))],
      sensusDate: s.date,
      createdAt: s.createdAt,
      sortKey: s.createdAt || s.date || ''
    })
  }
  rows.sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)))
  return rows
}

/** Isi nama pekerja untuk baris yang ditampilkan (resolveUsernames). */
export async function withWorkerNames(rows) {
  const shown = rows.slice(0, PENDING_LIMIT).map((r) => ({ ...r }))
  try {
    const names = await resolveUsernames([...new Set(shown.map((r) => r.workerId).filter(Boolean))])
    shown.forEach((r) => { r.worker = names.get(r.workerId) || '-' })
  } catch {
    shown.forEach((r) => { r.worker = '-' })
  }
  return shown
}

// ── Planning ───────────────────────────────────────────────────────────────

export const PLAN_STATUS = {
  get planned() { return t('dashboard.plan.status.planned') },
  get in_progress() { return t('dashboard.plan.status.in_progress') },
  get done() { return t('dashboard.plan.status.done') },
  get cancelled() { return t('dashboard.plan.status.cancelled') }
}

function mapPlanning(p, todayKey) {
  const tow = p.sensus_detail?.type_of_work || p.type_of_work || null
  const status = String(p.status || '').toLowerCase()
  const start = toDateKey(p.start_date)
  const end = toDateKey(p.end_date)
  const actualEnd = toDateKey(p.actual_end_date)
  const closed = status === 'done' || status === 'cancelled' || Boolean(actualEnd)
  const lateDays = !closed && end && end < todayKey ? dayDiff(todayKey, end) : 0
  return {
    id: p.id,
    sensusCode: p.id_sensus || '',
    group: groupKeyOf(tow),
    groupLabel: tow?.group_of_work_name || '',
    job: tow?.name || '-',
    block: blockLabel(blockNames(Array.isArray(p.blocks) ? p.blocks : p.sensus_detail?.blocks)),
    start,
    end,
    actualStart: toDateKey(p.actual_start_date),
    actualEnd,
    status,
    closed,
    lateDays
  }
}

async function loadPlanningList() {
  const rows = []
  const limit = 500
  for (let page = 1; page <= 10; page += 1) {
    const resp = await signedApiFetch(`/planning?page=${page}&limit=${limit}`, { method: 'GET' })
    const data = Array.isArray(resp?.data) ? resp.data : []
    rows.push(...data)
    const total = Number(resp?.meta?.total)
    if (data.length < limit || (Number.isFinite(total) && rows.length >= total)) break
  }
  const todayKey = dateKey(new Date())
  return rows.map((p) => mapPlanning(p, todayKey))
}

// ── Pengiriman dan penerimaan ──────────────────────────────────────────────

export const SHIPMENT_WINDOW_DAYS = 56 // dua kali periode terpanjang (28 hari)

/** Pengiriman sejak `days` hari lalu (filter tanggal kirim di server), beserta penerimaan yang berlaku. */
async function loadShipmentList(days = SHIPMENT_WINDOW_DAYS) {
  const today = new Date()
  const params = new URLSearchParams({
    date_from: dateKey(addDays(today, -(days - 1))),
    date_to: dateKey(today),
    limit: '200'
  })
  const rows = []
  for (let page = 1; page <= 20; page += 1) {
    params.set('page', String(page))
    const resp = await signedApiFetch(`/trip-receipts?${params.toString()}`, { method: 'GET' })
    const data = Array.isArray(resp?.data) ? resp.data : []
    rows.push(...data)
    const total = Number(resp?.meta?.total)
    if (data.length < 200 || (Number.isFinite(total) && rows.length >= total)) break
  }
  return rows.map((row) => {
    const shipped = Number(row.shipped_quantity)
    const received = row.receipt ? Number(row.receipt.quantity) : null
    return {
      tripId: row.trip_id,
      date: toDateKey(row.shipped_at),
      shippedQty: Number.isFinite(shipped) ? shipped : 0,
      shippedUnitId: row.shipped_unit_id ?? null,
      shippedUnit: row.shipped_unit_name || '',
      received: Boolean(row.receipt),
      receivedQty: Number.isFinite(received) ? received : null,
      receivedUnitId: row.receipt?.unit_id ?? null,
      receivedUnit: row.receipt?.unit_name || '',
      receivedDate: toDateKey(row.receipt?.received_date)
    }
  })
}

// ── Model ──────────────────────────────────────────────────────────────────

export function createDashboardModel() {
  const navigation = cloneNavigation(sharedNavigation)

  return {
    getNavigation() {
      return cloneNavigation(navigation)
    },
    getHeader() {
      return { title: t('dashboard.title'), notifications: 0, user: { ...getAuthenticatedUser() } }
    },
    getIntro() {
      return {
        title: t('dashboard.title'),
        description: t('dashboard.introDescription')
      }
    },
    loadSensus: loadSensusList,
    loadPlannings: loadPlanningList,
    loadShipments: loadShipmentList
  }
}
