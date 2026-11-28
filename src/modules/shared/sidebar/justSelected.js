// Menu yang baru diklik, disimpan di tingkat modul: setiap halaman memasang sidebar baru,
// jadi status komponen hilang saat pindah halaman. Ikon menu itu memutar animasi pilih +
// percikan sekali di halaman tujuan, lalu penanda dihapus.
import { ref } from 'vue'

export const justSelectedPath = ref('')
let timer = null

export function markJustSelected(path) {
  justSelectedPath.value = path || ''
  clearTimeout(timer)
  timer = setTimeout(() => { justSelectedPath.value = '' }, 1200)
}
