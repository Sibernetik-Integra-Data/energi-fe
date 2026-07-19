import { getAuthenticatedUser } from '../../auth/keycloak'
import { navigation as sharedNavigation } from '../shared/navigation'
import { signedApiFetch } from '../../api/fetch'

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
  const lastValue = weeklyTotals[weeklyTotals.length - 1] || 0
  const prevValue = weeklyTotals[weeklyTotals.length - 2] || 0
  const deltaPercent = prevValue > 0
    ? Math.round(((lastValue - prevValue) / prevValue) * 100)
    : (lastValue > 0 ? 100 : 0)
  const deltaSign = deltaPercent >= 0 ? '+' : ''

  return {
    title: config.title,
    value: String(currentMonthTotal),
    delta: `${deltaSign}${deltaPercent}%`,
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

  // Delta: last non-zero month vs the one before it
  let lastIdx = -1
  for (let i = 11; i >= 0; i--) {
    if (monthlyTotals[i] > 0) { lastIdx = i; break }
  }
  const lastValue = lastIdx >= 0 ? monthlyTotals[lastIdx] : 0
  const prevValue = lastIdx > 0 ? monthlyTotals[lastIdx - 1] : 0
  const deltaPercent = prevValue > 0
    ? Math.round(((lastValue - prevValue) / prevValue) * 100)
    : (lastValue > 0 ? 100 : 0)
  const deltaSign = deltaPercent >= 0 ? '+' : ''

  return {
    title: config.title,
    value: String(yearTotal),
    delta: `${deltaSign}${deltaPercent}%`,
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
    title: 'Sensus',
    detail: 'Total bulan berjalan',
    tone: 'orange',
    tooltipLabel: 'Total sensus',
    groupOfWork: null
  },
  {
    title: 'Pembersihan',
    detail: 'Blok aktif',
    tone: 'green',
    tooltipLabel: 'Total aktivitas',
    groupOfWork: 1
  },
  {
    title: 'Pemupukan',
    detail: 'Target mingguan',
    tone: 'blue',
    tooltipLabel: 'Total aktivitas',
    groupOfWork: 3
  },
  {
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
    title: config.title,
    value,
    delta: '+0%',
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

export function createDashboardModel() {
  const navigation = cloneNavigation(sharedNavigation)

  const header = {
    title: 'Dashboard',
    notifications: 5
  }

  const intro = {
    title: 'Dashboard',
    description: 'Ringkasan aktivitas kebun, progres pekerjaan, dan daftar tindak lanjut yang sedang berjalan.'
  }

  const pendingVerification = {
    title: 'Pending Verifications',
    subtitle: 'Worker reports awaiting your review',
    badge: '3 Pending',
    columns: [
      { key: 'sensusId', label: 'SENSUS ID' },
      { key: 'worker', label: 'WORKER' },
      { key: 'block', label: 'BLOCK' },
      { key: 'dateTime', label: 'DATE & TIME', type: 'datetime' },
      { key: 'jobTypes', label: 'JOB TYPES', type: 'chips' },
      { key: 'status', label: 'STATUS', type: 'status' }
    ],
    rows: [
      {
        sensusId: 'SEN-2024-005',
        worker: 'Eko Prasetyo',
        block: 'Block D-22',
        date: '2026-02-18',
        time: '10:30',
        jobTypes: ['Rawat jalan', 'Pemupukan NPK TBM', 'Semprot lalang'],
        status: 'Pending'
      },
      {
        sensusId: 'SEN-2024-006',
        worker: 'Rina Wijaya',
        block: 'Block E-14',
        date: '2026-02-18',
        time: '11:00',
        jobTypes: ['Panen', 'Pemupukan dolomit'],
        status: 'Pending'
      },
      {
        sensusId: 'SEN-2024-007',
        worker: 'Agus Setiawan',
        block: 'Block F-09',
        date: '2026-02-18',
        time: '09:45',
        jobTypes: ['Semprot lalang', 'Rawat jalan'],
        status: 'Pending'
      }
    ]
  }

  const recentVerified = {
    title: 'Recent Verified Sensus',
    subtitle: 'Latest verified worker reports',
    columns: [
      { key: 'sensusId', label: 'SENSUS ID' },
      { key: 'worker', label: 'WORKER' },
      { key: 'block', label: 'BLOCK' },
      { key: 'dateTime', label: 'DATE & TIME', type: 'datetime' },
      { key: 'jobTypes', label: 'JOB TYPES', type: 'chips' }
    ],
    rows: [
      {
        sensusId: 'SEN-2024-001',
        worker: 'Ahmad Rifai',
        block: 'Block A-12',
        date: '2026-02-18',
        time: '08:30',
        jobTypes: ['Rawat jalan', 'Pemupukan NPK TBM']
      },
      {
        sensusId: 'SEN-2024-002',
        worker: 'Budi Santoso',
        block: 'Block B-05',
        date: '2026-02-18',
        time: '09:15',
        jobTypes: ['Panen', 'Semprot lalang']
      },
      {
        sensusId: 'SEN-2024-003',
        worker: 'Siti Nurhaliza',
        block: 'Block C-18',
        date: '2026-02-18',
        time: '07:45',
        jobTypes: ['Pemupukan dolomit', 'Rawat jalan']
      },
      {
        sensusId: 'SEN-2024-004',
        worker: 'Dewi Lestari',
        block: 'Block A-08',
        date: '2026-02-17',
        time: '14:20',
        jobTypes: ['Panen']
      }
    ]
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