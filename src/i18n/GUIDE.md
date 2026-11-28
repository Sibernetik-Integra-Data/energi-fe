# Panduan terjemahan energi-fe (ID/EN)

Pustaka: vue-i18n 11, Composition API (`legacy: false`). Bahasa sumber: Indonesia.

## Struktur

- `locales/id/<modul>.json` dan `locales/en/<modul>.json`, digabung otomatis oleh `i18n/index.js`.
- Kunci teratas di setiap file = nama modul (mis. `{"dashboard": {...}}`). Jangan memakai kunci teratas milik file lain.
- `core.json` berisi kunci bersama: `common`, `language`, `app`, `header`, `sidebar`, `nav`, `announcement`, `module`, `comingSoon`. Boleh dipakai semua modul; jangan diubah oleh agen modul (usulkan tambahan di laporan).
- File `id` dan `en` sebuah modul harus memiliki kunci yang **persis sama**.

## Cara memakai

Komponen (`<script setup>`):

```js
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
```

Template: `{{ t('dashboard.kpi.title') }}`, atribut: `:aria-label="t('...')"`, interpolasi `t('x.y', { n: 3 })` dengan pesan `"{n} butir"`.
Jamak (pipe): `"tidak ada butir | 1 butir | {n} butir"` lalu `t('x.y', n)` — bahasa Indonesia boleh satu bentuk saja.

Berkas `.js` biasa (model, util, store): `import i18n from '<rel>/i18n'` lalu `i18n.global.t('...')`. Nilai yang dihitung sekali saat modul dimuat tidak ikut berganti bahasa: ubah menjadi fungsi atau `computed` yang memanggil `t` saat dipakai.

Format angka/tanggal: `import { currentIntlLocale } from '<rel>/i18n'` lalu `value.toLocaleString(currentIntlLocale())` / `toLocaleDateString(currentIntlLocale(), opts)`; di template agar reaktif, panggil di dalam `computed` yang membaca `locale.value`. Ganti `'id-ID'` yang tertulis langsung untuk teks tampilan. Jangan mengubah format tanggal yang dikirim ke API (mis. `YYYY-MM-DD`, `sv-SE`).

## Yang diterjemahkan

Semua teks yang terlihat pengguna: judul, label, tombol, placeholder, `title`, `aria-label`, `alt`, teks kosong/memuat/galat, pesan toast, pesan validasi, konfirmasi, label status, nama hari/bulan buatan sendiri (ganti dengan `Intl`).

## Yang TIDAK diterjemahkan

- Data dari API/DB (nama blok, nama pekerjaan, satuan, nama pengguna, catatan).
- Pesan galat dari server (`err.message` dari backend) — tetap tampilkan apa adanya; teks cadangan (`|| 'Gagal ...'`) diterjemahkan.
- Nilai yang dikirim ke API, kunci status internal (`'planned'`, `'done'`), nama route, nama event, kelas CSS, `console.*`, komentar kode.
- Teks yang datang dari Strapi (dikerjakan di tahap terpisah).

## Glosarium (wajib konsisten)

| Indonesia | English |
|---|---|
| Dasbor | Dashboard |
| Sensus | Census |
| Perencanaan / rencana kerja | Planning / work plan |
| Pembersihan | Weeding |
| Pemupukan | Fertilising |
| Panen | Harvest |
| Pengiriman dan Penerimaan | Shipping and Receiving |
| Ikhtisar Kinerja | Performance Overview |
| Jejak Audit | Audit Trail |
| Data Master | Master Data |
| Bantuan | Help |
| Blok | Block |
| Petak / Nomor Petak | Plot |
| TPH (Tempat Pengumpulan Hasil) | Collection point (TPH) |
| TM (Tanaman Menghasilkan) | Mature (TM) |
| TBM (Tanaman Belum Menghasilkan) | Immature (TBM) |
| Kelompok pekerjaan | Work group |
| Jenis pekerjaan | Work type |
| Aktivitas kebun | Estate activity |
| Pekerja | Worker |
| Mandor | Foreman (Mandor) |
| Kepala Kebun | Estate Manager |
| Asisten Kebun | Assistant Manager |
| Pengemudi | Driver |
| Kendaraan / nomor polisi | Vehicle / licence plate |
| Tujuan | Destination |
| Satuan | Unit |
| Jenis kebutuhan / komponen | Requirement type / component type |
| Penugasan / status penugasan | Assignment / assignment status |
| Verifikasi / menunggu verifikasi / terverifikasi | Verification / awaiting verification / verified |
| Tindak lanjut | Follow-up |
| Selisih timbang | Weighing difference |
| Janjang (tandan) | Bunches |
| Brondolan | Loose fruit |
| Tahun tanam | Planting year |
| Jumlah pohon | Tree count |
| Luas (ha) | Area (ha) |
| Simpan / Batal / Hapus / Ubah / Tambah | Save / Cancel / Delete / Edit / Add |
| Cari | Search |
| Saring / filter | Filter |
| Muat ulang / coba lagi | Reload / try again |
| Gagal memuat … | Failed to load … |
| Dibuat oleh / diubah oleh | Created by / updated by |
| Terlambat N hari | N days late |

Gaya Inggris: British spelling (prioritise, colour), kalimat pendek, sentence case untuk judul dan tombol.
