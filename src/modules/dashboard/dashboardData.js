import { GROUPS, addDays, dateKey, dayDiff } from './model'

// Perhitungan murni untuk panel dasbor; masukannya hasil pemuat di model.js.

export const SELISIH_LIMIT = 2 // persen; di atas ini ditandai
const SELISIH_CRITICAL = 5
const LATE_CRITICAL_DAYS = 7
const STALE_HOURS = 24
const STALE_SERIOUS_HOURS = 72

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** "28 Nov" atau "28 Nov 2026" dari kunci YYYY-MM-DD. */
export function formatDay(key, withYear = false) {
  if (!key) return '-'
  const [y, m, d] = key.split('-').map(Number)
  return `${d} ${BULAN[m - 1]}${withYear ? ` ${y}` : ''}`
}

export function periodRange(days, today = new Date()) {
  return {
    from: dateKey(addDays(today, -(days - 1))),
    to: dateKey(today),
    prevFrom: dateKey(addDays(today, -(2 * days - 1))),
    prevTo: dateKey(addDays(today, -days))
  }
}

const inRange = (key, from, to) => Boolean(key) && key >= from && key <= to

export function percentChange(current, previous) {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

// ── Sensus ─────────────────────────────────────────────────────────────────

export function countSensus(list, from, to) {
  return list.filter((s) => inRange(s.date, from, to)).length
}

/** Baris per hari: { date, pembersihan, pemupukan, panen } (sensus dihitung per kelompok yang dimuatnya). */
export function sensusDaily(list, days, today = new Date()) {
  const rows = Array.from({ length: days }, (_, i) => {
    const row = { date: dateKey(addDays(today, i - days + 1)) }
    GROUPS.forEach((g) => { row[g.key] = 0 })
    return row
  })
  const index = new Map(rows.map((r, i) => [r.date, i]))
  for (const s of list) {
    const i = index.get(s.date)
    if (i === undefined) continue
    s.groups.forEach((g) => { rows[i][g] += 1 })
  }
  return rows
}

// ── Pengiriman ─────────────────────────────────────────────────────────────

const unitKey = (id, name) => (id !== null && id !== undefined ? `id:${id}` : `nm:${name}`)

/** Satuan yang paling sering dipakai pengiriman dalam rentang; satuan lain tidak dijumlahkan bersamanya. */
export function primaryUnit(shipments) {
  const counts = new Map()
  for (const s of shipments) {
    const k = unitKey(s.shippedUnitId, s.shippedUnit)
    const c = counts.get(k) || { key: k, name: s.shippedUnit || 'tanpa satuan', count: 0 }
    c.count += 1
    counts.set(k, c)
  }
  const sorted = [...counts.values()].sort((a, b) => b.count - a.count)
  return { primary: sorted[0] || null, others: sorted.slice(1) }
}

const sameUnit = (s, key) => unitKey(s.shippedUnitId, s.shippedUnit) === key
const receivedSameUnit = (s) => s.received && s.receivedQty !== null &&
  unitKey(s.receivedUnitId, s.receivedUnit) === unitKey(s.shippedUnitId, s.shippedUnit)

/** Ringkasan satu rentang untuk satu satuan: kirim, terima, selisih (hanya pengiriman yang sudah diterima). */
export function shipmentSummary(shipments, unit, from, to) {
  const rows = shipments.filter((s) => inRange(s.date, from, to) && unit && sameUnit(s, unit.key))
  const matched = rows.filter(receivedSameUnit)
  const shippedMatched = matched.reduce((t, s) => t + s.shippedQty, 0)
  const received = matched.reduce((t, s) => t + s.receivedQty, 0)
  return {
    trips: rows.length,
    shipped: rows.reduce((t, s) => t + s.shippedQty, 0),
    received,
    shippedMatched,
    receivedTrips: matched.length,
    pendingTrips: rows.filter((s) => !s.received).length,
    selisihPct: shippedMatched > 0 ? ((shippedMatched - received) / shippedMatched) * 100 : null
  }
}

/** Per hari (tanggal kirim) untuk `days` hari terakhir. */
export function shipmentDaily(shipments, unit, days, today = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const key = dateKey(addDays(today, i - days + 1))
    return { date: key, ...shipmentSummary(shipments, unit, key, key) }
  })
}

// ── Tindak lanjut ──────────────────────────────────────────────────────────

export const LEVELS = [
  { key: 'kritis', label: 'Kritis' },
  { key: 'serius', label: 'Serius' },
  { key: 'peringatan', label: 'Peringatan' }
]

export function hoursSince(value, now = new Date()) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : (now.getTime() - d.getTime()) / 3600000
}

export function waitLabel(hours) {
  if (hours === null) return ''
  if (hours < 1) return 'kurang dari 1 jam'
  if (hours < 48) return `${Math.floor(hours)} jam`
  return `${Math.floor(hours / 24)} hari`
}

/**
 * Butir tindak lanjut dari data sungguhan. Tiap butir: { id, kind, level, text, to? }.
 * kind: 'telat' (rencana terlambat), 'tunggu' (sensus menunggu > 24 jam), 'timbang' (selisih > 2%).
 */
export function buildFeed({ plans, pending, shipDays, unitName, now = new Date() }) {
  const items = []
  for (const p of plans || []) {
    if (!p.lateDays) continue
    items.push({
      id: `plan-${p.id}`,
      kind: 'telat',
      level: p.lateDays >= LATE_CRITICAL_DAYS ? 'kritis' : 'serius',
      sortValue: p.lateDays * 24,
      text: `Rencana ${p.job} di ${p.block} terlambat ${p.lateDays} hari (tenggat ${formatDay(p.end, true)}).`,
      group: p.group
    })
  }
  for (const s of pending || []) {
    const h = hoursSince(s.createdAt, now) ?? (s.sensusDate ? dayDiff(dateKey(now), s.sensusDate) * 24 : null)
    if (h === null || h <= STALE_HOURS) continue
    items.push({
      id: `sensus-${s.id ?? s.code}`,
      kind: 'tunggu',
      level: h > STALE_SERIOUS_HOURS ? 'serius' : 'peringatan',
      sortValue: h,
      text: `Sensus ${s.code} (${s.block}) menunggu verifikasi ${waitLabel(h)}.`,
      to: s.id !== null && s.id !== undefined ? `/sensus/${s.id}` : null,
      group: s.groups?.[0] || null
    })
  }
  for (const d of shipDays || []) {
    if (d.selisihPct === null || d.selisihPct <= SELISIH_LIMIT) continue
    items.push({
      id: `timbang-${d.date}`,
      kind: 'timbang',
      level: d.selisihPct > SELISIH_CRITICAL ? 'kritis' : 'serius',
      sortValue: d.selisihPct * 100,
      text: `Selisih timbang ${formatNumber(d.selisihPct, 1)}% pada pengiriman ${formatDay(d.date, true)} (kirim ${formatNumber(d.shippedMatched)} ${unitName}, terima ${formatNumber(d.received)} ${unitName}).`,
      group: null
    })
  }
  const order = { kritis: 0, serius: 1, peringatan: 2 }
  return items.sort((a, b) => order[a.level] - order[b.level] || b.sortValue - a.sortValue)
}
