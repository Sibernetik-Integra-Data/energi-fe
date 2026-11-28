export const navigation = [
  { label: 'Dasbor', icon: 'dashboard', to: '/dashboard', compact: true },
  { label: 'Sensus', icon: 'note', to: '/sensus', compact: true },
  { label: 'Perencanaan', icon: 'calendar', to: '/planning', compact: true },
  { label: 'Pembersihan', icon: 'broom', to: '/pembersihan', compact: true },
  { label: 'Pemupukan', icon: 'plant', to: '/pemupukan', compact: true },
  { label: 'Panen', icon: 'location', to: '/panen', compact: true },
  { label: 'Pengiriman dan Penerimaan', icon: 'package', to: '/pengiriman-penerimaan', compact: true },
  { label: 'Ikhtisar Kinerja', icon: 'database', to: '/performance-overview', compact: true },
  { label: 'Jejak Audit', icon: 'users', to: '/audit-log', compact: true },
  {
    label: 'Data Master',
    icon: 'settings',
    key: 'master-data',
    to: '/master-data',
    defaultExpanded: false,
    // Keep fallback order aligned with Strapi CMS `order` values.
    children: [
      { label: 'Blok', icon: 'database', to: '/master-data/blocks', order: 10 },
      { label: 'Aktivitas Kebun', icon: 'calendar', to: '/master-data/aktifitas-kebun', order: 20 },
      { label: 'Pengemudi', icon: 'users', to: '/master-data/driver', order: 30 },
      { label: 'Kendaraan', icon: 'database', to: '/master-data/vehicle', order: 40 },
      { label: 'Kelompok Pekerjaan', icon: 'calendar', to: '/master-data/group-of-work', order: 50 },
      { label: 'Nomor Petak', icon: 'location-pin', to: '/master-data/petak', order: 60 },
      { label: 'TPH', icon: 'location-pin', to: '/master-data/tph', order: 65 },
      { label: 'Status Progres Sensus', icon: 'database', to: '/master-data/sensus-progress-status', order: 70 },
      { label: 'Tujuan', icon: 'location-pin', to: '/master-data/destination', order: 80 },
      { label: 'Status Penugasan', icon: 'calendar', to: '/master-data/type-of-accept', order: 90 },
      { label: 'Jenis Komponen', icon: 'database', to: '/master-data/type-of-component', order: 100 },
      { label: 'Jenis Kebutuhan', icon: 'calendar', to: '/master-data/type-of-need', order: 110 },
      { label: 'Satuan', icon: 'database', to: '/master-data/type-of-unit', order: 120 },
      { label: 'Pekerja', icon: 'users', to: '/master-data/pekerja', order: 130 },
      { label: 'Pemetaan Kebutuhan', icon: 'database', to: '/master-data/fullfil-mapping', order: 140 },
      { label: 'Parameter Kebutuhan', icon: 'database', to: '/master-data/fullfil-params', order: 150 },
      { label: 'Pembayaran Kebutuhan', icon: 'database', to: '/master-data/fullfil-payment', order: 160 },
    ]
  },
  { label: 'Bantuan', icon: 'list-check', to: '/bantuan', compact: true }
]

export default navigation
