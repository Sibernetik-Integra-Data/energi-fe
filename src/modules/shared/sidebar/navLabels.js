// Kunci terjemahan menu per alamat halaman.
// Label dari Strapi sudah dalam bahasa aktif (?locale=) dan selalu dipakai. Kunci ini hanya
// cadangan: menu bawaan (shared/navigation.js, sebelum Strapi termuat) dan item tanpa label.
export const NAV_KEY_BY_PATH = {
  '/dashboard': 'nav.dashboard',
  '/sensus': 'nav.sensus',
  '/planning': 'nav.planning',
  '/pembersihan': 'nav.pembersihan',
  '/pemupukan': 'nav.pemupukan',
  '/panen': 'nav.panen',
  '/pengiriman-penerimaan': 'nav.pengirimanPenerimaan',
  '/performance-overview': 'nav.performanceOverview',
  '/audit-log': 'nav.auditLog',
  '/master-data': 'nav.masterData',
  '/bantuan': 'nav.bantuan',
  '/master-data/blocks': 'nav.blocks',
  '/master-data/aktifitas-kebun': 'nav.aktifitasKebun',
  '/master-data/driver': 'nav.driver',
  '/master-data/vehicle': 'nav.vehicle',
  '/master-data/group-of-work': 'nav.groupOfWork',
  '/master-data/petak': 'nav.petak',
  '/master-data/tph': 'nav.tph',
  '/master-data/sensus-progress-status': 'nav.sensusProgressStatus',
  '/master-data/destination': 'nav.destination',
  '/master-data/type-of-accept': 'nav.typeOfAccept',
  '/master-data/type-of-component': 'nav.typeOfComponent',
  '/master-data/type-of-need': 'nav.typeOfNeed',
  '/master-data/type-of-unit': 'nav.typeOfUnit',
  '/master-data/pekerja': 'nav.pekerja',
  '/master-data/fullfil-mapping': 'nav.fullfilMapping',
  '/master-data/fullfil-params': 'nav.fullfilParams',
  '/master-data/fullfil-payment': 'nav.fullfilPayment'
}

/** Label menu untuk bahasa aktif. `t`/`locale` dari useI18n(). */
export function navLabel(item, t, locale) {
  const label = item?.label || ''
  if (item?.fromCms && label) return label
  const key = NAV_KEY_BY_PATH[(item?.to || '').replace(/\/+$/, '')]
  if (key) return t(key)
  void locale
  return label
}
