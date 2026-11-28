// Multibahasa (vue-i18n, Composition API). Bahasa sumber: Indonesia.
// Teks yang belum diterjemahkan jatuh ke Bahasa Indonesia (fallbackLocale).
import { getCurrentScope, onScopeDispose, watch } from 'vue'
import { createI18n } from 'vue-i18n'

// Satu file per modul: locales/<bahasa>/<modul>.json, kunci teratas = nama modul
// (core.json memuat kunci bersama: common, app, header, sidebar, nav, …).
// Digabung otomatis saat build supaya tiap modul bisa diterjemahkan terpisah.
function mergeLocale(files) {
  const out = {}
  for (const mod of Object.values(files)) Object.assign(out, mod.default || mod)
  return out
}
const id = mergeLocale(import.meta.glob('./locales/id/*.json', { eager: true }))
const en = mergeLocale(import.meta.glob('./locales/en/*.json', { eager: true }))

export const SUPPORTED_LOCALES = [
  { code: 'id', label: 'ID', name: 'Bahasa Indonesia', intl: 'id-ID' },
  { code: 'en', label: 'EN', name: 'English', intl: 'en-GB' }
]
export const DEFAULT_LOCALE = 'id'
const STORAGE_KEY = 'energi-locale'

const isSupported = (code) => SUPPORTED_LOCALES.some((l) => l.code === code)

function readStoredLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isSupported(stored) ? stored : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

const numberFormats = {
  id: {
    decimal: { style: 'decimal', maximumFractionDigits: 2 },
    integer: { style: 'decimal', maximumFractionDigits: 0 },
    percent: { style: 'percent', maximumFractionDigits: 1 }
  },
  en: {
    decimal: { style: 'decimal', maximumFractionDigits: 2 },
    integer: { style: 'decimal', maximumFractionDigits: 0 },
    percent: { style: 'percent', maximumFractionDigits: 1 }
  }
}

const datetimeFormats = {
  id: {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' }
  },
  en: {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' }
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: readStoredLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { id, en },
  numberFormats,
  datetimeFormats,
  missingWarn: false,
  fallbackWarn: false
})

// Bentuk jamak otomatis: pesan "1 plot | {n} plots" dipilih dari {n}/{count}. vue-i18n hanya
// melakukannya bila nilainya angka, sedangkan banyak pemanggil mengirim angka yang sudah
// diformat ("1.234"). Ubah ke angka sebagai pemilih jamak; pesan tanpa "|" tidak terpengaruh.
const toCount = (value) => Number(String(value).replace(/[\s.,  ]/g, ''))
const baseT = i18n.global.t
i18n.global.t = (key, ...args) => {
  const named = args[0]
  if (args.length === 1 && named && typeof named === 'object' && !Array.isArray(named)) {
    const count = named.n ?? named.count
    if (count !== undefined && typeof count !== 'number' && Number.isFinite(toCount(count))) {
      return baseT(key, named, toCount(count))
    }
  }
  return baseT(key, ...args)
}

/** Kode Intl (mis. 'id-ID') untuk bahasa aktif; dipakai toLocaleString di kode lama. */
export function currentIntlLocale() {
  const code = i18n.global.locale.value
  return SUPPORTED_LOCALES.find((l) => l.code === code)?.intl || 'id-ID'
}

function applyDocumentLang(code) {
  document.documentElement.setAttribute('lang', code)
}

export function setLocale(code) {
  if (!isSupported(code)) return
  i18n.global.locale.value = code
  applyDocumentLang(code)
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // penyimpanan diblokir: pilihan berlaku sampai halaman ditutup
  }
}

/** Kode bahasa aktif ('id' | 'en') untuk parameter `locale` ke Strapi. */
export function currentLocaleCode() {
  const code = i18n.global.locale.value
  return isSupported(code) ? code : DEFAULT_LOCALE
}

/** Tambahkan `locale=<bahasa aktif>` ke URL Strapi (menghormati query yang sudah ada). */
export function withLocale(url, code = currentLocaleCode()) {
  if (!url) return url
  const hashIndex = url.indexOf('#')
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
  return `${base}${base.includes('?') ? '&' : '?'}locale=${encodeURIComponent(code)}${hash}`
}

/**
 * Jalankan `callback(code)` setiap kali bahasa berganti. Mengembalikan fungsi berhenti;
 * dipanggil di setup() komponen, pengamat berhenti sendiri saat komponen dilepas.
 */
export function onLocaleChange(callback) {
  const stop = watch(() => i18n.global.locale.value, (code, previous) => {
    if (code !== previous) callback(code)
  })
  if (getCurrentScope()) onScopeDispose(stop)
  return stop
}

export function initLocale() {
  applyDocumentLang(i18n.global.locale.value)
}

export default i18n
