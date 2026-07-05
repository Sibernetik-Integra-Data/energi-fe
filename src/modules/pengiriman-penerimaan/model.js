import { navigation as sharedNavigation } from '../shared/navigation'

function cloneNavigation(items = []) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
}

function formatDate(isoDate) {
  if (!isoDate) return '-'
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const SHIPMENT_LIST = [
  { idPengiriman: '0001', datePengiriman: '2026-03-05', qtyPengirimanValue: 1312, sensusId: '1298123946' },
  { idPengiriman: '0002', datePengiriman: '2026-03-04', qtyPengirimanValue: 1288, sensusId: '1298123947' },
  { idPengiriman: '0003', datePengiriman: '2026-03-04', qtyPengirimanValue: 1305, sensusId: '1298123948' },
  { idPengiriman: '0004', datePengiriman: '2026-03-03', qtyPengirimanValue: 1250, sensusId: '1298123949' },
  { idPengiriman: '0005', datePengiriman: '2026-03-03', qtyPengirimanValue: 1320, sensusId: '1298123950' },
  { idPengiriman: '0006', datePengiriman: '2026-03-02', qtyPengirimanValue: 1270, sensusId: '1298123951' },
  { idPengiriman: '0007', datePengiriman: '2026-03-02', qtyPengirimanValue: 1295, sensusId: '1298123952' },
  { idPengiriman: '0008', datePengiriman: '2026-03-01', qtyPengirimanValue: 1340, sensusId: '1298123953' },
  { idPengiriman: '0009', datePengiriman: '2026-03-01', qtyPengirimanValue: 1260, sensusId: '1298123954' },
  { idPengiriman: '0010', datePengiriman: '2026-02-28', qtyPengirimanValue: 1308, sensusId: '1298123955' }
]

const RECEIPT_BY_SHIPMENT_ID = {
  '0002': {
    idPenerimaan: 'ACC0001',
    datePenerimaan: '2026-03-05',
    qtyPenerimaanValue: 1280,
    jenisPanen: 'TBS',
    notes: 'Diterima lengkap.'
  }
}

const WORKERS = [
  { id: '0001', name: 'Eko Nugroho', janjang: 120, beratKg: 480 },
  { id: '0002', name: 'Jamal', janjang: 98, beratKg: 392 },
  { id: '0003', name: 'Asep Sunandar', janjang: 110, beratKg: 440 }
]

function toListItem(row) {
  const receipt = RECEIPT_BY_SHIPMENT_ID[row.idPengiriman] || null
  return {
    idPengiriman: row.idPengiriman,
    datePengiriman: formatDate(row.datePengiriman),
    qtyPengiriman: `${row.qtyPengirimanValue.toLocaleString('id-ID')} Kg`,
    qtyPengirimanValue: row.qtyPengirimanValue,
    sensusId: row.sensusId,
    idPenerimaan: receipt?.idPenerimaan || null,
    datePenerimaan: receipt?.datePenerimaan ? formatDate(receipt.datePenerimaan) : null,
    qtyPenerimaan: typeof receipt?.qtyPenerimaanValue === 'number'
      ? `${receipt.qtyPenerimaanValue.toLocaleString('id-ID')} Kg`
      : null,
    qtyPenerimaanValue: receipt?.qtyPenerimaanValue ?? null
  }
}

export function createPengirimanPenerimaanModel() {
  return {
    getNavigation() {
      return cloneNavigation(sharedNavigation)
    },
    getHeader() {
      return { title: 'Pengiriman dan Penerimaan Panen', notifications: 0 }
    },
    getIntro() {
      return {
        title: 'Pengiriman dan Penerimaan Panen',
        description: 'Pantau proses pengiriman hasil panen dan penerimaan timbang dalam satu halaman.'
      }
    }
  }
}

export async function loadPengirimanPenerimaanList() {
  return SHIPMENT_LIST.map(toListItem)
}

export async function loadPengirimanPenerimaanDetail(idPengiriman) {
  const shipment = SHIPMENT_LIST.find((item) => item.idPengiriman === String(idPengiriman))
  if (!shipment) return null

  const receipt = RECEIPT_BY_SHIPMENT_ID[shipment.idPengiriman] || null

  return {
    idPengiriman: shipment.idPengiriman,
    sensusId: shipment.sensusId,
    datePengiriman: formatDate(shipment.datePengiriman),
    qtyPengirimanValue: shipment.qtyPengirimanValue,
    qtyPengiriman: `${shipment.qtyPengirimanValue.toLocaleString('id-ID')} kg`,
    tujuan: 'PKS Kencana Jaya',
    jenisPanen: 'TBS',
    kurir: 'Jasa Antar Sejahtera',
    jenisKendaraan: 'Truck',
    nomorKendaraan: 'U 1526 TBC',
    workers: WORKERS,
    receipt: receipt
      ? {
          ...receipt,
          datePenerimaanLabel: formatDate(receipt.datePenerimaan)
        }
      : null
  }
}
