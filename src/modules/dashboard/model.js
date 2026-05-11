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

function buildWeeklySensusMetric(sensusList, referenceDate = new Date()) {
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
    title: 'Sensus',
    value: String(currentMonthTotal),
    delta: `${deltaSign}${deltaPercent}%`,
    detail: 'Total bulan berjalan',
    tone: 'orange',
    points: weeklyTotals,
    pointLabels,
    tooltipLabel: 'Total sensus'
  }
}

function buildDummyWeeklyPoints(sourcePoints, length) {
  if (!Array.isArray(sourcePoints) || sourcePoints.length === 0) {
    return Array(length).fill(0)
  }

  if (sourcePoints.length === length) {
    return [...sourcePoints]
  }

  return Array.from({ length }, (_, index) => {
    const mappedIndex = Math.floor((index / Math.max(length - 1, 1)) * (sourcePoints.length - 1))
    return sourcePoints[mappedIndex]
  })
}

// Helper function to fetch sensus metrics
async function fetchSensusMetrics(referenceDate = new Date()) {
  try {
    const response = await signedApiFetch('/sensus?limit=100', { method: 'GET' })
    const sensusList = Array.isArray(response.data) ? response.data : []
    return buildWeeklySensusMetric(sensusList, referenceDate)
  } catch (error) {
    console.error('[Dashboard] Failed to fetch sensus metrics:', error)
    const pointLabels = getCurrentMonthWeekLabels(referenceDate)
    return {
      title: 'Sensus',
      value: '0',
      delta: '+0%',
      detail: 'Total bulan berjalan',
      tone: 'orange',
      points: Array(pointLabels.length).fill(0),
      pointLabels,
      tooltipLabel: 'Total sensus'
    }
  }
}

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

  function buildStaticMetrics(referenceDate = new Date()) {
    const currentMonthWeekLabels = getCurrentMonthWeekLabels(referenceDate)

    return [
      {
        title: 'Pembersihan',
        value: '54',
        delta: '-4%',
        detail: 'Blok aktif',
        tone: 'green',
        points: buildDummyWeeklyPoints([30, 28, 25, 31, 29, 35, 33, 37], currentMonthWeekLabels.length),
        pointLabels: currentMonthWeekLabels,
        tooltipLabel: 'Total aktivitas'
      },
      {
        title: 'Pemupukan',
        value: '76',
        delta: '+8%',
        detail: 'Target mingguan',
        tone: 'blue',
        points: buildDummyWeeklyPoints([14, 18, 21, 26, 24, 30, 36, 40], currentMonthWeekLabels.length),
        pointLabels: currentMonthWeekLabels,
        tooltipLabel: 'Total aktivitas'
      },
      {
        title: 'Panen',
        value: '92',
        delta: '+15%',
        detail: 'Tonase terkini',
        tone: 'amber',
        points: buildDummyWeeklyPoints([20, 22, 28, 26, 30, 34, 38, 42], currentMonthWeekLabels.length),
        pointLabels: currentMonthWeekLabels,
        tooltipLabel: 'Total aktivitas'
      }
    ]
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

  // Store metrics in variable to be populated asynchronously
  let metricsCache = null
  let metricsLoadingPromise = null
  let metricsMonthKey = ''

  // Load metrics asynchronously
  function loadMetricsAsync() {
    const referenceDate = new Date()
    const monthKey = getMonthKey(referenceDate)

    if (!metricsLoadingPromise || metricsMonthKey !== monthKey) {
      metricsMonthKey = monthKey
      metricsLoadingPromise = fetchSensusMetrics(referenceDate).then((sensusMetric) => {
        metricsCache = [sensusMetric, ...buildStaticMetrics(referenceDate)]
        return metricsCache
      })
    }
    return metricsLoadingPromise
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
    getMetrics() {
      const referenceDate = new Date()
      const monthKey = getMonthKey(referenceDate)
      const currentMonthWeekLabels = getCurrentMonthWeekLabels(referenceDate)

      // Return cached metrics or placeholder while loading
      if (metricsCache && metricsMonthKey === monthKey) {
        return metricsCache.map((item) => ({ ...item, points: [...item.points] }))
      }
      // Return placeholder metrics while loading
      return [
        {
          title: 'Sensus',
          value: '—',
          delta: '—',
          detail: 'Total bulan berjalan',
          tone: 'orange',
          points: Array(currentMonthWeekLabels.length).fill(0),
          pointLabels: currentMonthWeekLabels,
          tooltipLabel: 'Total sensus'
        },
        ...buildStaticMetrics(referenceDate)
      ]
    },
    loadMetrics() {
      return loadMetricsAsync()
    }
  }
}