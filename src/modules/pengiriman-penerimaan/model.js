import { signedApiFetch } from '../../api/fetch'
import { navigation as sharedNavigation } from '../shared/navigation'
import i18n, { currentIntlLocale } from '../../i18n'

const t = (...args) => i18n.global.t(...args)

// Labels are read when called, so they follow the active language.
export function getHarvestTypes() {
  return [
    { value: 'TBS', label: t('shipping.harvestType.tbs') },
    { value: 'LOOSE_FRUIT', label: t('shipping.harvestType.looseFruit') }
  ]
}

export function getStatusFilters() {
  return [
    { value: '', label: t('shipping.status.all') },
    { value: 'pending', label: t('shipping.status.pending') },
    { value: 'received', label: t('shipping.status.received') }
  ]
}

function cloneNavigation(items = []) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
}

const DATE_OPTIONS = { day: '2-digit', month: 'short', year: 'numeric' }

function formatDate(value) {
  if (!value) return '-'
  // A plain calendar date (YYYY-MM-DD) is shown as written, without time zone shifting.
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  const date = plain ? new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3])) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(currentIntlLocale(), DATE_OPTIONS)
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.toLocaleDateString(currentIntlLocale(), DATE_OPTIONS)} ${date.toLocaleTimeString(currentIntlLocale(), { hour: '2-digit', minute: '2-digit' })}`
}

export function formatQuantity(value, unitName = '') {
  const quantity = Number(value)
  if (value === null || value === undefined || !Number.isFinite(quantity)) return '-'
  return `${quantity.toLocaleString(currentIntlLocale(), { maximumFractionDigits: 3 })}${unitName ? ` ${unitName}` : ''}`
}

function harvestLabel(value) {
  return getHarvestTypes().find((item) => item.value === value)?.label || '-'
}

function parseListMeta(meta, fallback = {}) {
  if (!meta || typeof meta !== 'object') return { total: 0, ...fallback, totals: { shipped: [], received: [] } }
  return {
    total: Number(meta.total) || 0,
    page: Number(meta.page) || fallback.page || 1,
    limit: Number(meta.limit) || fallback.limit || 10,
    totals: {
      shipped: Array.isArray(meta.totals?.shipped) ? meta.totals.shipped : [],
      received: Array.isArray(meta.totals?.received) ? meta.totals.received : []
    }
  }
}

// Totals are kept per unit; different units are never added together.
function totalsLabel(rows = []) {
  if (!rows.length) return '-'
  return rows.map((row) => formatQuantity(row.total, row.unit_name || '')).join(' · ')
}

function mapReceipt(receipt) {
  if (!receipt) return null
  const cancelled = receipt.status === 'cancelled'
  return {
    id: receipt.id,
    receiptNo: receipt.receipt_no,
    receivedDate: formatDate(receipt.received_date),
    quantity: Number(receipt.quantity),
    unitId: receipt.unit_id,
    unitName: receipt.unit_name || '',
    quantityLabel: formatQuantity(receipt.quantity, receipt.unit_name),
    harvestLabel: harvestLabel(receipt.harvest_type),
    notes: receipt.notes || '-',
    status: receipt.status || 'posted',
    statusLabel: cancelled ? t('shipping.receiptStatus.cancelled') : t('shipping.receiptStatus.posted'),
    createdAt: formatDateTime(receipt.created_at),
    cancelledAt: cancelled ? formatDateTime(receipt.cancelled_at) : '-',
    cancelReason: receipt.cancel_reason || '-',
    replacesReceiptId: receipt.replaces_receipt_id ?? null
  }
}

function mapShipmentToListItem(row = {}) {
  const receipt = mapReceipt(row.receipt)
  return {
    id: row.trip_id,
    startTime: formatDate(row.shipped_at),
    originName: row.origin_name || '-',
    destinationName: row.destination_name || '-',
    volumeLabel: formatQuantity(row.shipped_quantity, row.shipped_unit_name),
    received: Boolean(receipt),
    statusLabel: receipt ? t('shipping.status.received') : t('shipping.status.pending'),
    receiptNo: receipt?.receiptNo || '-',
    receivedDate: receipt?.receivedDate || '-',
    receivedLabel: receipt?.quantityLabel || '-'
  }
}

function mapTrip(trip = {}) {
  const volume = Number(trip.volume)
  return {
    id: trip.id,
    startTime: formatDate(trip.start_time),
    endTime: formatDate(trip.end_time),
    originName: trip.origin_name || '-',
    destinationName: trip.destination_name || '-',
    driverName: trip.driver_name || '-',
    unitId: trip.unit_id ?? null,
    unitName: trip.unit_name || '',
    volumeValue: Number.isFinite(volume) ? volume : 0,
    volumeLabel: formatQuantity(trip.volume, trip.unit_name),
    notes: trip.notes ?? '-'
  }
}

export function createPengirimanPenerimaanModel() {
  return {
    getNavigation() {
      return cloneNavigation(sharedNavigation)
    },
    getHeader() {
      return { title: t('shipping.title'), notifications: 0 }
    },
    getIntro() {
      return {
        title: t('shipping.title'),
        description: t('shipping.description')
      }
    }
  }
}

export async function loadPengirimanPenerimaanList(filters = {}) {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filters.status) params.set('status', filters.status)
  const response = await signedApiFetch(`/trip-receipts?${params.toString()}`, { method: 'GET' })
  const meta = parseListMeta(response.meta, { page, limit })

  return {
    items: Array.isArray(response.data) ? response.data.map(mapShipmentToListItem) : [],
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    summary: {
      totalTrips: meta.total,
      shippedLabel: totalsLabel(meta.totals.shipped),
      receivedLabel: totalsLabel(meta.totals.received)
    }
  }
}

/**
 * One shipment with its receipt history. `receipt` is the receipt in force
 * (or null); `replacesReceiptId` is what a new receipt should point to when
 * the latest receipt of the trip was cancelled (a correction).
 */
export async function loadPengirimanPenerimaanDetail(id) {
  const tripId = encodeURIComponent(id)
  const [tripResponse, historyResponse] = await Promise.all([
    signedApiFetch(`/trips/${tripId}`, { method: 'GET' }),
    signedApiFetch(`/trip-receipts/trip/${tripId}`, { method: 'GET' })
  ])
  if (!tripResponse.data) return null

  const history = (Array.isArray(historyResponse.data) ? historyResponse.data : []).map(mapReceipt)
  const receipt = history.find((item) => item.status === 'posted') || null
  const latest = history[0] || null

  return {
    ...mapTrip(tripResponse.data),
    receipt,
    history,
    replacesReceiptId: !receipt && latest?.status === 'cancelled' ? latest.id : null
  }
}

export async function loadUnits() {
  const response = await signedApiFetch('/type_of_unit', { method: 'GET' })
  return (Array.isArray(response.data) ? response.data : []).map((unit) => ({ id: unit.id, name: unit.name }))
}

export async function receiveTrip(payload) {
  const response = await signedApiFetch('/trip-receipts', { method: 'POST', body: JSON.stringify(payload) })
  return mapReceipt(response.data)
}

export async function cancelReceipt(receiptId, reason) {
  const response = await signedApiFetch(`/trip-receipts/${encodeURIComponent(receiptId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  })
  return mapReceipt(response.data)
}
