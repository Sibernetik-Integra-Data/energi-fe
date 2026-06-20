export const navigation = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard', compact: true },
  { label: 'Sensus', icon: 'note', to: '/sensus', compact: true },
  { label: 'Planning', icon: 'date', to: '/planning', compact: true },
  { label: 'Pembersihan', icon: 'broom', to: '/pembersihan' },
  { label: 'Pemupukan', icon: 'plant', to: '/pemupukan', compact: true },
  { label: 'Panen', icon: 'location', to: '/panen', compact: true },
  { label: 'Pengiriman & Penerimaan', icon: 'package', to: '/pengiriman-penerimaan', compact: true },
  {
    label: 'Master Data',
    icon: 'settings',
    key: 'settings',
    defaultExpanded: true,
    children: [
      { label: 'Blocks', icon: 'database', to: '/master-data/blocks' },
      { label: 'Driver', icon: 'users', to: '/master-data/driver' },
      { label: 'Vehicle', icon: 'database', to: '/master-data/vehicle' },
      { label: 'Aktifitas Kebun', icon: 'calendar', to: '/master-data/aktifitas-kebun' },
      { label: 'Group of Work', icon: 'calendar', to: '/master-data/group-of-work' },
      { label: 'Nomor Petak', icon: 'location-pin', to: '/master-data/petak' },
      { label: 'Sensus Progress Status', icon: 'database', to: '/master-data/sensus-progress-status' },
      { label: 'Locations', icon: 'location-pin', to: '/master-data/locations' }
    ]
  }
]

export default navigation
