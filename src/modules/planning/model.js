import { navigation as sharedNavigation } from '../shared/navigation'

function cloneNavigation(items) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
}

export function createPlanningModel() {
  const navigation = cloneNavigation(sharedNavigation)

  const header = {
    title: 'Perencanaan',
    eyebrow: 'Planning',
    notifications: 3
  }

  const intro = {
    title: 'Perencanaan',
    description: 'Rencanakan dan pantau jadwal aktivitas kebun secara visual menggunakan tampilan Gantt.'
  }

  /** @type {Array<{id:number, jobType:string, sensusId:string, blocks:string[], startDate:string, endDate:string, color:string}>} */
  const plannings = [
    {
      id: 1,
      jobType: 'Rawat Jalan',
      sensusId: 'Sensus 2026 - 001',
      blocks: ['C1', 'C2', 'C3'],
      startDate: '2026-04-28',
      endDate: '2026-05-05',
      color: 'blue'
    },
    {
      id: 2,
      jobType: 'Rawat Jalan',
      sensusId: 'Sensus 2026 - 004',
      blocks: ['C1', 'C2', 'C3'],
      startDate: '2026-04-30',
      endDate: '2026-05-07',
      color: 'blue'
    },
    {
      id: 3,
      jobType: 'Rawat Jalan',
      sensusId: 'Sensus 2026 - 003',
      blocks: ['C1', 'C2', 'C3'],
      startDate: '2026-04-29',
      endDate: '2026-05-04',
      color: 'blue'
    },
    {
      id: 4,
      jobType: 'Pemupukan NPK TBM',
      sensusId: 'Sensus 2026 - 003',
      blocks: ['C4', 'C5', 'C6'],
      startDate: '2026-05-02',
      endDate: '2026-05-09',
      color: 'green'
    },
    {
      id: 5,
      jobType: 'Panen',
      sensusId: 'Sensus 2026 - 003',
      blocks: ['C4', 'C5', 'C6', 'C7', 'C8'],
      startDate: '2026-05-03',
      endDate: '2026-05-12',
      color: 'orange'
    }
  ]

  const sensusOptions = [
    { value: 'SEN-2024-001', label: 'Sensus 2024-001' },
    { value: 'SEN-2024-005', label: 'Sensus 2024-005' },
    { value: 'SEN-2026-001', label: 'Sensus 2026-001' },
    { value: 'SEN-2026-003', label: 'Sensus 2026-003' },
    { value: 'SEN-2026-004', label: 'Sensus 2026-004' }
  ]

  const blockOptions = [
    'Blok C1', 'Blok C2', 'Blok C3', 'Blok C4', 'Blok C5',
    'Blok C6', 'Blok C7', 'Blok C8', 'Blok D1', 'Blok D2'
  ]

  const aktifitasOptions = [
    'Rawat Jalan', 'Pemupukan NPK TBM', 'Pemupukan Dolomit',
    'Semprot Lalang', 'Panen', 'Pembersihan'
  ]

  return {
    getNavigation() {
      return cloneNavigation(navigation)
    },
    getHeader() {
      return { ...header }
    },
    getIntro() {
      return { ...intro }
    },
    getPlannings() {
      return plannings.map(p => ({ ...p, blocks: [...p.blocks] }))
    },
    getSensusOptions() {
      return [...sensusOptions]
    },
    getBlockOptions() {
      return [...blockOptions]
    },
    getAktifitasOptions() {
      return [...aktifitasOptions]
    }
  }
}
