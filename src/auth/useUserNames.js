import { reactive } from 'vue'
import { resolveUsername } from '../utils/userCache'

// Nama yang sudah diketahui, dipakai bersama semua daftar (reaktif agar
// tabel tergambar ulang begitu nama selesai dimuat). Pencarian ke server
// memakai utils/userCache (GET /account/user/:id, ada cache + dedup).
const names = reactive(new Map())

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * userName(id): nama pengguna untuk kolom Created/Updated By.
 * - kosong -> '-'
 * - ID pengguna -> nama setelah dimuat ('…' selama memuat, '-' bila tidak dikenal)
 * - teks lain (mis. 'import', 'system') -> apa adanya
 */
export function useUserNames() {
  function userName(id) {
    const v = String(id ?? '').trim()
    if (!v) return '-'
    if (!UUID.test(v)) return v
    if (!names.has(v)) {
      names.set(v, '…')
      resolveUsername(v).then((name) => names.set(v, name || '-'))
    }
    return names.get(v)
  }
  return { userName }
}
