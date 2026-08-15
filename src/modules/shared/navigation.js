export const navigation = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard', compact: true },
  { label: 'Sensus', icon: 'note', to: '/sensus', compact: true },
  { label: 'Planning', icon: 'calendar', to: '/planning', compact: true },
  { label: 'Pembersihan', icon: 'broom', to: '/pembersihan', compact: true },
  { label: 'Pemupukan', icon: 'plant', to: '/pemupukan', compact: true },
  { label: 'Panen', icon: 'location', to: '/panen', compact: true },
  { label: 'Pengiriman & Penerimaan', icon: 'package', to: '/pengiriman-penerimaan', compact: true },
  {
    label: 'Master Data',
    icon: 'settings',
    key: 'master-data',
    to: '/master-data',
    defaultExpanded: false,
    // Keep fallback order aligned with Strapi CMS `order` values.
    children: [
      { label: 'Blocks', icon: 'database', to: '/master-data/blocks', order: 10 },
      { label: 'Aktifitas Kebun', icon: 'calendar', to: '/master-data/aktifitas-kebun', order: 20 },
      { label: 'Pengemudi', icon: 'users', to: '/master-data/driver', order: 30 },
      { label: 'Vehicle', icon: 'database', to: '/master-data/vehicle', order: 40 },
      { label: 'Group of Work', icon: 'calendar', to: '/master-data/group-of-work', order: 50 },
      { label: 'Nomor Petak', icon: 'location-pin', to: '/master-data/petak', order: 60 },
      { label: 'Sensus Progress Status', icon: 'database', to: '/master-data/sensus-progress-status', order: 70 },
      { label: 'Destination', icon: 'location-pin', to: '/master-data/destination', order: 80 },
      { label: 'Type of Accept', icon: 'calendar', to: '/master-data/type-of-accept', order: 90 },
      { label: 'Type of Component', icon: 'database', to: '/master-data/type-of-component', order: 100 },
      { label: 'Type of Need', icon: 'calendar', to: '/master-data/type-of-need', order: 110 },
      { label: 'Type of Unit', icon: 'database', to: '/master-data/type-of-unit', order: 120 },
      { label: 'Pekerja', icon: 'users', to: '/master-data/pekerja', order: 130 },
      { label: 'Fullfil Mapping', icon: 'database', to: '/master-data/fullfil-mapping', order: 140 },
    ]
  }
]

export default navigation
