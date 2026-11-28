// Menerjemahkan error dari backend energi-be ke bahasa aktif.
// Backend mengirim { code, message, data, meta, errorCode, errorParams }; `errorCode`
// stabil dan netral bahasa (lihat energi-be/src/utils/errorCodes.js).
// Dipanggil sekali di api/fetch.js, sehingga semua `err.message` di halaman sudah
// berbahasa aktif. Pesan asli server tetap ada di `err.serverMessage`.
import i18n from '../i18n'

const { t, te } = i18n.global

/** Pesan terjemahan untuk body error API, atau '' bila kodenya belum dikenal. */
export function translateApiError(body) {
  const code = body?.errorCode
  if (!code) return ''
  const key = `apiError.${code}`
  if (!te(key) && !te(key, 'id')) return ''
  return t(key, { ...(body.errorParams || {}) })
}

/** Teks asli dari server (sebelum diterjemahkan), untuk mencocokkan nama constraint dsb. */
export function serverText(err) {
  return String(err?.serverMessage || err?.message || '')
}

/** Error konflik "data sudah ada" (unik). `pattern` = cadangan untuk server lama tanpa errorCode. */
export function isDuplicate(err, pattern = /sudah ada|409/i) {
  return err?.errorCode === 'DUPLICATE' || (!err?.errorCode && pattern.test(serverText(err)))
}

/** Error "masih dipakai data lain" (rujukan). `pattern` = cadangan untuk server lama tanpa errorCode. */
export function isStillReferenced(err, pattern = /dirujuk|409/i) {
  return err?.errorCode === 'STILL_REFERENCED' || (!err?.errorCode && pattern.test(serverText(err)))
}

/** Ganti `message` dengan terjemahan bila ada; simpan pesan asli di `serverMessage`. */
export function localizeApiError(body) {
  if (!body || typeof body !== 'object') return body
  const translated = translateApiError(body)
  if (!translated) return body
  return { ...body, serverMessage: body.message, message: translated }
}
