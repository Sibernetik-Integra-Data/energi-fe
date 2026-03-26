export function createDashboardModel() {
  const navigation = [
    { label: 'Dashboard', icon: 'dashboard', active: true },
    { label: 'Sensus', icon: 'sensus' },
    { label: 'Pembersihan', icon: 'cleaning' },
    { label: 'Pemupukan', icon: 'fertilize' },
    { label: 'Panen', icon: 'harvest' },
    { label: 'Notifications', icon: 'notifications', badge: '5' },
    { label: 'Settings', icon: 'settings' }
  ]

  const header = {
    title: 'Dashboard',
    notifications: 5,
    user: {
      name: 'Kepala Kebun',
      role: 'Pusat kendali aktivitas',
      initials: 'KK'
    }
  }

  const intro = {
    title: 'Dashboard',
    description: 'Ringkasan aktivitas kebun, progres pekerjaan, dan daftar tindak lanjut yang sedang berjalan.'
  }

  const metrics = [
    {
      title: 'Sensus',
      value: '128',
      delta: '+12%',
      detail: 'Pembaruan hari ini',
      tone: 'orange',
      points: [18, 22, 19, 28, 34, 31, 39, 36]
    },
    {
      title: 'Pembersihan',
      value: '54',
      delta: '-4%',
      detail: 'Blok aktif',
      tone: 'green',
      points: [30, 28, 25, 31, 29, 35, 33, 37]
    },
    {
      title: 'Pemupukan',
      value: '76',
      delta: '+8%',
      detail: 'Target mingguan',
      tone: 'blue',
      points: [14, 18, 21, 26, 24, 30, 36, 40]
    },
    {
      title: 'Panen',
      value: '92',
      delta: '+15%',
      detail: 'Tonase terkini',
      tone: 'amber',
      points: [20, 22, 28, 26, 30, 34, 38, 42]
    }
  ]

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
      return navigation.map((item) => ({ ...item }))
    },
    getHeader() {
      return { ...header, user: { ...header.user } }
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
      return metrics.map((item) => ({ ...item, points: [...item.points] }))
    },
  }
}