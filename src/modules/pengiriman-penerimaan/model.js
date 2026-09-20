import { signedApiFetch } from '../../api/fetch'
import { navigation as sharedNavigation } from '../shared/navigation'

function cloneNavigation(items = []) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatVolume(value, unitName = '') {
  const volume = Number(value)
  if (!Number.isFinite(volume)) return '-'
  return `${volume.toLocaleString('id-ID')}${unitName ? ` ${unitName}` : ''}`
}

function parseListMeta(meta, fallback = {}) {
  if (!meta || typeof meta !== 'object') return fallback
  return {
    total: Number(meta.total) || 0,
    page: Number(meta.page) || fallback.page || 1,
    limit: Number(meta.limit) || fallback.limit || 10
  }
}

function mapTripToListItem(trip = {}) {
  const volume = Number(trip.volume)

  return {
    id: trip.id,
    idPengiriman: trip.id,
    startTime: formatDate(trip.start_time),
    endTime: formatDate(trip.end_time),
    startTimeValue: trip.start_time || null,
    endTimeValue: trip.end_time || null,
    originName: trip.origin_name || '-',
    destinationName: trip.destination_name || '-',
    driverName: trip.driver_name || '-',
    unitName: trip.unit_name || '',
    volumeValue: Number.isFinite(volume) ? volume : 0,
    volumeLabel: formatVolume(trip.volume, trip.unit_name),
    notes: trip.notes || '-'
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
        description: 'Pantau perjalanan pengiriman hasil panen berdasarkan data perjalanan aktual.'
      }
    }
  }
}

export async function loadPengirimanPenerimaanList(filters = {}) {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const response = await signedApiFetch(`/trips?${params.toString()}`, { method: 'GET' })
  const meta = parseListMeta(response.meta, { page, limit })

  return {
    items: Array.isArray(response.data) ? response.data.map(mapTripToListItem) : [],
    total: meta.total,
    page: meta.page,
    limit: meta.limit
  }
}

export async function loadPengirimanPenerimaanDetail(id) {
  const response = await signedApiFetch(`/trips/${encodeURIComponent(id)}`, { method: 'GET' })
  return response.data ? mapTripToListItem(response.data) : null
}
