# PRD Frontend Energi

## 1. Tujuan Dokumen
Dokumen ini menjelaskan requirement produk untuk frontend aplikasi Energi, khususnya modul yang saat ini tersedia pada aplikasi web frontend. Dokumen ini ditujukan untuk developer, product owner, dan tim implementasi sebagai acuan pengembangan dan validasi fitur.

## 2. Ringkasan Produk
Energi FE adalah antarmuka web yang digunakan untuk mendukung operasi kebun dan pengelolaan data operasional secara digital. Aplikasi ini memungkinkan pengguna mengakses informasi penting seperti dashboard performa, data sensus, planning kerja, modul operasional, serta master data referensi.

## 3. Tujuan Bisnis
- Meningkatkan visibilitas operasional melalui dashboard yang informatif
- Mempercepat akses data sensus dan planning kerja
- Menyediakan satu titik akses untuk data referensi utama sistem
- Mengurangi ketergantungan terhadap proses manual dan tidak terintegrasi

## 4. Target Pengguna
- Operator lapangan
- Supervisor / manager
- Administrator / admin sistem

## 5. Ruang Lingkup
### In Scope
- Autentikasi pengguna
- Navigasi utama berbasis sidebar dan header
- Dashboard ringkasan performa
- Modul Sensus
- Modul Planning
- Modul operasional: Pembersihan, Pemupukan, Panen, Pengiriman & Penerimaan
- Modul Master Data
- Integrasi dengan backend API dan Keycloak

### Out of Scope
- Aplikasi mobile native
- Mode offline
- Fitur analitik tingkat lanjut
- Workflow approval multi-level yang kompleks

## 6. Fitur Utama

### 6.1 Autentikasi
- Pengguna dapat login menggunakan Keycloak
- Session pengguna harus aman dan dapat dipulihkan saat halaman dimuat ulang
- Aplikasi harus mengarahkan pengguna ke halaman login saat sesi tidak valid

### 6.2 Dashboard
- Menampilkan ringkasan aktivitas penting
- Menyediakan filter periode (misalnya bulanan/tahunan)
- Menampilkan metrik visual melalui chart
- Menunjukkan area pending verification dan recent verified

### 6.3 Sensus
- Menampilkan daftar sensus
- Menampilkan detail sensus terkait data pekerjaan dan blok
- Mendukung akses informasi yang diperlukan untuk operasional

### 6.4 Planning
- Menampilkan daftar planning kerja
- Mendukung pemilihan sensus dan detail sensus
- Memungkinkan pengguna mengelola planning dengan struktur yang konsisten

### 6.5 Modul Operasional
- Pembersihan
- Pemupukan
- Panen
- Pengiriman & Penerimaan

### 6.6 Master Data
- Menyediakan akses ke referensi sistem yang penting, seperti:
  - Blocks
  - Aktifitas Kebun
  - Pengemudi
  - Vehicle
  - Group of Work
  - Sensus Progress Status
  - Destination
  - Type of Accept
  - Type of Component
  - Type of Need
  - Type of Unit
  - Pekerja
  - Fullfil

## 7. Requirement Fungsional
1. Pengguna harus dapat login dan logout dengan aman.
2. Pengguna harus melihat navigasi utama yang sesuai modul yang tersedia.
3. Dashboard harus menampilkan metrik utama berdasarkan data backend.
4. Pengguna harus dapat melihat daftar dan detail sensus.
5. Pengguna harus dapat mengakses dan mengelola planning kerja.
6. Pengguna harus dapat mengakses modul operasional dan master data sesuai kebutuhan bisnis.
7. Antarmuka harus konsisten antar halaman melalui header, sidebar, dan tema visual.

## 8. Requirement Non-Fungsional
### Usability
- Antarmuka harus sederhana, jelas, dan responsif
- Navigasi harus dipahami oleh pengguna non-teknis

### Security
- Semua halaman harus terlindungi autentikasi
- Token dan sesi harus dikelola dengan aman
- Integrasi API harus menggunakan mekanisme autentikasi yang sah

### Performance
- Halaman utama harus dimuat dengan cepat
- Loading state harus muncul saat data sedang diambil

### Reliability
- Error handling harus jelas saat API gagal
- UI harus tetap memberi feedback pada kondisi error

### Accessibility
- Tombol dan elemen interaktif harus mudah diakses
- Layout harus mendukung tampilan di layar kecil

## 9. UX / UI Guidance
- Gunakan layout berbasis sidebar, header, dan area konten utama
- Pastikan konsistensi visual di seluruh modul
- Gunakan loading state, empty state, dan error state yang konsisten
- Fokus pada tampilan yang bersih, profesional, dan informatif

## 10. Integrasi Sistem
Frontend terintegrasi dengan:
- Backend API
- Keycloak untuk autentikasi
- Strapi CMS untuk navigasi sidebar

## 11. Success Metrics
- Pengguna dapat mencapai tujuan utama tanpa kebingungan
- Data operasional dapat diakses dengan cepat
- Proses pengelolaan master data menjadi lebih terstruktur
- Ketergantungan pada proses manual berkurang

## 12. Tahapan Pengembangan
### Tahap 1
- Stabilkan autentikasi dan navigasi
- Selesaikan dashboard dan modul sensus

### Tahap 2
- Perluas modul planning dan operasional
- Perbaiki alur kerja utama pengguna

### Tahap 3
- Tingkatkan performa, error handling, dan kualitas data
- Perluas fitur master data dan integrasi bisnis

## 13. Catatan Implementasi Developer
- Frontend berbasis Vue 3 dengan Vite
- Menggunakan Pinia untuk state management
- Menggunakan Vue Router untuk navigasi
- Menggunakan Tailwind untuk styling
- Menggunakan ApexCharts untuk visualisasi dashboard
- Semua route yang memerlukan autentikasi harus menerapkan guard yang sesuai

## 14. Open Questions
- Apakah ada kebutuhan role-based access control yang lebih detail?
- Apakah semua modul operasional sudah siap untuk integrasi penuh dengan backend?
- Apakah ada kebutuhan workflow approval atau approval chain tambahan?
- Apakah desain visual final sudah ditetapkan untuk seluruh modul?
