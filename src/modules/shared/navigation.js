export const navigation = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard', compact: true },
  { label: 'Sensus', icon: 'sensus', to: '/sensus', compact: true },
  { label: 'Planning', icon: 'calendar', to: '/planning', compact: true },
  { label: 'Pembersihan', icon: 'cleaning', to: '/pembersihan' },
  { label: 'Pemupukan', icon: 'fertilize', to: '/pemupukan', compact: true },
  { label: 'Panen', icon: 'harvest', to: '/panen', compact: true },
  {
    label: 'Master Data',
    icon: 'settings',
    key: 'settings',
    defaultExpanded: true,
    children: [
      { label: 'Blocks', icon: 'database', to: '/master-data/blocks' },
      { label: 'Driver', icon: 'users', to: '/settings/admin-master-akun' }
    ]
  }
]

export default navigation
