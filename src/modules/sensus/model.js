import { navigation as sharedNavigation } from '../shared/navigation'

export function createSensusModel() {
  const navigation = sharedNavigation.map((i) => ({ ...i, active: i.to === '/sensus' }))

  const header = { title: 'Sensus', notifications: 0, user: { name: 'Kepala Kebun', role: 'Manager', initials: 'KK' } }

  const list = {
    title: 'Daftar Sensus',
    subtitle: 'Laporan terbaru',
    rows: [
      { id: 'SEN-2024-005', worker: 'Eko Prasetyo', block: 'Block A-1', date: '2026-02-18', time: '09:00', jobTypes: ['Rawat jalan','Pemupukan NPK TBM','Panen'], status: 'Open' },
      { id: 'SEN-2024-006', worker: 'Eko Prasetyo', block: 'Block B-3', date: '2026-02-18', time: '09:00', jobTypes: ['Rawat jalan','Pemupukan NPK TBM','Semprot lalang'], status: 'Open' },
      { id: 'SEN-2024-007', worker: 'Eko Prasetyo', block: 'Block C-2', date: '2026-02-18', time: '09:00', jobTypes: ['Rawat jalan','Pemupukan NPK TBM','Semprot lalang'], status: 'Open' },
      { id: 'SEN-2024-008', worker: 'Eko Prasetyo', block: 'Block D-4', date: '2026-02-18', time: '09:00', jobTypes: ['Rawat jalan','Pemupukan NPK TBM','Semprot lalang'], status: 'Open' },
      { id: 'SEN-2024-009', worker: 'Eko Prasetyo', block: 'Block E-5', date: '2026-02-18', time: '09:00', jobTypes: ['Rawat jalan','Pemupukan NPK TBM','Semprot lalang'], status: 'Verified' }
    ]
  }

  const stats = { total: 128, today: 12, pending: 3 }

  return {
    getNavigation() { return navigation.map(i => ({ ...i })) },
    getHeader() { return { ...header, notifications: list.rows.filter(r => r.status==='Open').length, user: { ...header.user } } },
    getList() { return { ...list, rows: list.rows.map(r => ({ ...r })) } },
    getStats() { return { ...stats } }
  }
}
