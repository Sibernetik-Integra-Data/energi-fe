import { getAuthenticatedUser } from '../../auth/keycloak'
import { navigation as sharedNavigation } from '../shared/navigation'
import { signedApiFetch } from '../../api/fetch'
import { resolveUsernames } from '../../utils/userCache'

function cloneNavigation(items) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
}

function parseIsoDate(dateString) {
  if (typeof dateString !== 'string') return null
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) return null
  return date
}

// ── Weekly (per-month) helpers ─────────────────────────────────────────────

function getCurrentMonthWeekLabels(referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekCount = Math.ceil(daysInMonth / 7)
  const monthLabel = referenceDate.toLocaleString('id-ID', { month: 'long' })

  return Array.from({ length: weekCount }, (_, index) => {
    const weekNumber = index + 1
    const startDay = index * 7 + 1
    const endDay = Math.min((index + 1) * 7, daysInMonth)
    return `Minggu ke ${weekNumber} (${startDay}-${endDay} ${monthLabel})`
  })
}

function getMonthKey(referenceDate = new Date()) {
  return `${referenceDate.getFullYear()}-${referenceDate.getMonth() + 1}`
}

// Persentase perubahan; null bila periode pembanding kosong (persentase tidak bermakna).
function deltaText(current, previous) {
  if (!previous) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

function buildWeeklyMetric(config, sensusList, referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const pointLabels = getCurrentMonthWeekLabels(referenceDate)
  const weeklyTotals = Array(pointLabels.length).fill(0)

  for (const sensus of sensusList) {
    const sensusDate = parseIsoDate(sensus?.sensus_date)
    if (!sensusDate) continue
    if (sensusDate.getFullYear() !== year || sensusDate.getMonth() !== month) continue

    const weekIndex = Math.floor((sensusDate.getDate() - 1) / 7)
    if (weekIndex >= 0 && weekIndex < weeklyTotals.length) {
      weeklyTotals[weekIndex] += 1
    }
  }

  const currentMonthTotal = weeklyTotals.reduce((sum, value) => sum + value, 0)
  // Bulan berjalan: minggu ini dibanding minggu lalu. Bulan lampau: dua minggu terakhirnya.
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const lastIdx = isCurrentMonth ? Math.min(Math.floor((today.getDate() - 1) / 7), weeklyTotals.length - 1) : weeklyTotals.length - 1
  const delta = deltaText(weeklyTotals[lastIdx] || 0, lastIdx > 0 ? weeklyTotals[lastIdx - 1] : 0)

  return {
    key: config.key,
    title: config.title,
    value: String(currentMonthTotal),
    delta,
    deltaHint: 'dibanding minggu lalu',
    detail: config.detail,
    tone: config.tone,
    points: weeklyTotals,
    pointLabels,
    tooltipLabel: config.tooltipLabel
  }
}

// ── Yearly (12-month) helpers ──────────────────────────────────────────────

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function getYearlyMonthLabels(year) {
  return MONTH_NAMES_ID.map((name) => `${name} ${year}`)
}

function buildYearlyMetric(config, sensusList, year) {
  const pointLabels = getYearlyMonthLabels(year)
  const monthlyTotals = Array(12).fill(0)

  for (const sensus of sensusList) {
    const sensusDate = parseIsoDate(sensus?.sensus_date)
    if (!sensusDate) continue
    if (sensusDate.getFullYear() !== year) continue

    const monthIndex = sensusDate.getMonth() // 0-based
    monthlyTotals[monthIndex] += 1
  }

  const yearTotal = monthlyTotals.reduce((sum, v) => sum + v, 0)

  // Tahun berjalan: bulan ini dibanding bulan lalu. Tahun lampau: Desember dibanding November.
  const today = new Date()
  const monthIdx = today.getFullYear() === year ? today.getMonth() : 11
  const delta = deltaText(monthlyTotals[monthIdx], monthIdx > 0 ? monthlyTotals[monthIdx - 1] : 0)

  return {
    key: config.key,
    title: config.title,
    value: String(yearTotal),
    delta,
    deltaHint: 'dibanding bulan lalu',
    detail: `Total tahun ${year}`,
    tone: config.tone,
    points: monthlyTotals,
    pointLabels,
    tooltipLabel: config.tooltipLabel
  }
}

// ── Config ─────────────────────────────────────────────────────────────────

const DASHBOARD_METRIC_CONFIGS = [
  {
    key: 'sensus',
    title: 'Sensus',
    detail: 'Total bulan berjalan',
    tone: 'orange',
    tooltipLabel: 'Total sensus',
    groupOfWork: null
  },
  {
    key: 'pembersihan',
    title: 'Pembersihan',
    detail: 'Blok aktif',
    tone: 'green',
    tooltipLabel: 'Total aktivitas',
    groupOfWork: 1
  },
  {
    key: 'pemupukan',
    title: 'Pemupukan',
    detail: 'Target mingguan',
    tone: 'blue',
    tooltipLabel: 'Total aktivitas',
    groupOfWork: 3
  },
  {
    key: 'panen',
    title: 'Panen',
    detail: 'Tonase terkini',
    tone: 'amber',
    tooltipLabel: 'Total aktivitas',
    groupOfWork: 2
  }
]

function buildEmptyMetric(config, referenceDate = new Date(), value = '0', mode = 'monthly') {
  const pointLabels = mode === 'yearly'
    ? getYearlyMonthLabels(referenceDate.getFullYear())
    : getCurrentMonthWeekLabels(referenceDate)
  return {
    key: config.key,
    title: config.title,
    value,
    delta: null,
    detail: config.detail,
    tone: config.tone,
    points: Array(pointLabels.length).fill(0),
    pointLabels,
    tooltipLabel: config.tooltipLabel
  }
}

/**
 * Fetch metrics for a given filter.
 * @param {Object} filter - { mode: 'monthly'|'yearly', year: number, month: number (1-based, only for monthly) }
 */
async function fetchMetricWithFilter(config, filter) {
  const { mode, year, month } = filter
  const referenceDate = mode === 'monthly'
    ? new Date(year, month - 1, 1)
    : new Date(year, 0, 1)

  try {
    const params = new URLSearchParams()
    params.set('limit', '500')
    if (config.groupOfWork !== null && config.groupOfWork !== undefined) {
      params.set('group_of_work', String(config.groupOfWork))
    }

    const response = await signedApiFetch(`/sensus?${params.toString()}`, { method: 'GET' })
    const sensusList = Array.isArray(response.data) ? response.data : []

    if (mode === 'yearly') {
      return buildYearlyMetric(config, sensusList, year)
    }
    return buildWeeklyMetric(config, sensusList, referenceDate)
  } catch (error) {
    console.error(`[Dashboard] Failed to fetch ${config.title} metrics:`, error)
    return buildEmptyMetric(config, referenceDate, '0', mode)
  }
}

// ── Main factory ───────────────────────────────────────────────────────────

// ── Verifikasi sensus (data sungguhan) ──────────────────────────────────────
// Detail sensus dianggap terverifikasi bila sudah punya planning; selama belum,
// sensus itu menunggu pemeriksaan (kecuali detail yang selesai/dibatalkan).
const CLOSED_STATUSES = new Set(['done', 'cancelled'])
const VERIFICATION_LIMIT = 5

function formatSensusDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatSensusTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function blockLabel(details) {
  const names = [...new Set(details.flatMap((d) => (d.blocks || []).map((b) => String(b.name || `Blok ${b.id}`).replace(/^Block\b/i, 'Blok'))))]
  if (!names.length) return '-'
  return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0]
}

function toVerificationRow(sensus, details, extra = {}) {
  return {
    sensusId: sensus.id_sensus || `#${sensus.id}`,
    numericId: sensus.id ?? null,
    workerId: sensus.created_by || '',
    worker: '',
    block: blockLabel(details),
    date: formatSensusDate(sensus.sensus_date),
    time: formatSensusTime(sensus.created_at),
    jobTypes: [...new Set(details.map((d) => d.type_of_work?.name).filter(Boolean))],
    ...extra
  }
}

async function loadVerificationRows() {
  const resp = await signedApiFetch('/sensus?page=1&limit=100', { method: 'GET' })
  const list = Array.isArray(resp?.data) ? resp.data : []
  const pending = []
  const verified = []

  for (const sensus of list) {
    const details = Array.isArray(sensus.details) ? sensus.details : []
    const open = details.filter((d) => !d.planning && !CLOSED_STATUSES.has(String(d.progress_status || '').toLowerCase()))
    const planned = details.filter((d) => d.planning)
    if (open.length) pending.push(toVerificationRow(sensus, open, { status: 'Menunggu', sortKey: sensus.created_at || sensus.sensus_date }))
    if (planned.length) {
      const lastPlanned = planned.map((d) => d.planning.start_date || '').sort().pop() || sensus.sensus_date
      verified.push(toVerificationRow(sensus, planned, { sortKey: lastPlanned }))
    }
  }

  // Menunggu: yang paling lama menunggu di atas. Terverifikasi: yang terbaru di atas.
  pending.sort((a, b) => String(a.sortKey || '').localeCompare(String(b.sortKey || '')))
  verified.sort((a, b) => String(b.sortKey || '').localeCompare(String(a.sortKey || '')))

  const pendingTotal = pending.length
  const pendingRows = pending.slice(0, VERIFICATION_LIMIT)
  const verifiedRows = verified.slice(0, VERIFICATION_LIMIT)
  const shown = [...pendingRows, ...verifiedRows]

  try {
    const names = await resolveUsernames([...new Set(shown.map((r) => r.workerId).filter(Boolean))])
    shown.forEach((r) => { r.worker = names.get(r.workerId) || '-' })
  } catch {
    shown.forEach((r) => { r.worker = '-' })
  }

  return { pendingRows, pendingTotal, verifiedRows }
}

export function createDashboardModel() {
  const navigation = cloneNavigation(sharedNavigation)

  const header = {
    title: 'Dasbor',
    notifications: 5
  }

  const intro = {
    title: 'Dasbor',
    description: 'Ringkasan aktivitas kebun, progres pekerjaan, dan daftar tindak lanjut yang sedang berjalan.'
  }

  // Kolom tabel verifikasi; barisnya diisi loadVerification() dari data sensus sungguhan.
  const verificationColumns = [
    { key: 'sensusId', label: 'ID SENSUS' },
    { key: 'worker', label: 'PEKERJA' },
    { key: 'block', label: 'BLOK' },
    { key: 'dateTime', label: 'TANGGAL DAN WAKTU', type: 'datetime' },
    { key: 'jobTypes', label: 'JENIS PEKERJAAN', type: 'chips' }
  ]

  const pendingVerification = {
    title: 'Menunggu Verifikasi',
    subtitle: 'Laporan pekerja yang menunggu pemeriksaan Anda',
    columns: [...verificationColumns, { key: 'status', label: 'STATUS', type: 'status' }],
    rows: []
  }

  const recentVerified = {
    title: 'Sensus Terverifikasi Terbaru',
    subtitle: 'Laporan pekerja terbaru yang sudah diverifikasi',
    columns: verificationColumns,
    rows: []
  }

  return {
    getNavigation() {
      return cloneNavigation(navigation)
    },
    getHeader() {
      return { ...header, user: { ...getAuthenticatedUser() } }
    },
    getIntro() {
      return { ...intro }
    },
    getPendingVerification() {
      return {
        ...pendingVerification,
        columns: pendingVerification.columns.map((column) => ({ ...column })),
        rows: pendingVerification.rows.map((row) => ({
          ...row,
          jobTypes: [...row.jobTypes]
        }))
      }
    },
    loadVerification: loadVerificationRows,
    getRecentVerified() {
      return {
        ...recentVerified,
        columns: recentVerified.columns.map((column) => ({ ...column })),
        rows: recentVerified.rows.map((row) => ({
          ...row,
          jobTypes: [...row.jobTypes]
        }))
      }
    },
    getMetrics(filter) {
      const now = new Date()
      const safeFilter = filter || {
        mode: 'monthly',
        year: now.getFullYear(),
        month: now.getMonth() + 1
      }
      const referenceDate = safeFilter.mode === 'yearly'
        ? new Date(safeFilter.year, 0, 1)
        : new Date(safeFilter.year, safeFilter.month - 1, 1)
      return DASHBOARD_METRIC_CONFIGS.map((config) =>
        buildEmptyMetric(config, referenceDate, '-', safeFilter.mode)
      )
    },
    async loadMetrics(filter) {
      const now = new Date()
      const safeFilter = filter || {
        mode: 'monthly',
        year: now.getFullYear(),
        month: now.getMonth() + 1
      }
      const results = await Promise.all(
        DASHBOARD_METRIC_CONFIGS.map((config) => fetchMetricWithFilter(config, safeFilter))
      )
      return results
    }
  }
}