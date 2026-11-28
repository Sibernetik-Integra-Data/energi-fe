// Multibahasa (vue-i18n, Composition API). Bahasa sumber: Indonesia.
// Teks yang belum diterjemahkan jatuh ke Bahasa Indonesia (fallbackLocale).
import { createI18n } from 'vue-i18n'
import id from './locales/id.json'
import en from './locales/en.json'

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

export function initLocale() {
  applyDocumentLang(i18n.global.locale.value)
}

export default i18n
