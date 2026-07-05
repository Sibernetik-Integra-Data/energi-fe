# Dashboard Sensus Integration dengan ApexCharts

## Overview
Halaman dashboard telah diintegrasikan dengan API `/api/sensus` untuk menampilkan data real-time. Card "Sensus" sekarang menampilkan:
- **Total count**: Jumlah total sensus details yang ada di database
- **Trend chart**: Area chart yang menunjukkan trend perubahan jumlah sensus
- **Delta percentage**: Perubahan persentase dari data sebelumnya
- **Dynamic styling**: Chart menggunakan warna yang sesuai dengan tone (orange untuk Sensus)

## Teknologi yang Digunakan
- **ApexCharts 3.46.1**: Library untuk membuat interactive charts
- **Vue3-ApexCharts 1.4.1**: Vue 3 wrapper untuk ApexCharts
- **Signed API Fetch**: Menggunakan `signedApiFetch` dari `src/api/fetch.js` untuk authenticate request ke backend

## File-file yang Dimodifikasi

### 1. `package.json`
```json
{
  "dependencies": {
    "apexcharts": "^3.46.1",
    "vue3-apexcharts": "^1.4.1"
    // ... dependencies lainnya
  }
}
```
Perlu run `npm install` untuk menginstall dependency baru.

### 2. `src/modules/dashboard/components/DashboardMetricCard.vue`
- Mengganti SVG sparkline component dengan ApexCharts area chart
- Chart options dikonfigurasi untuk sparkline style (no toolbar, no grid, etc)
- Supports gradient fill dengan opacity yang berbeda
- Auto re-render saat `metric.points` berubah

```vue
<apexchart
  :key="chartKey"
  :options="chartOptions"
  :series="chartSeries"
  type="area"
  height="72"
/>
```

### 3. `src/modules/dashboard/model.js`
Menambahkan fungsi untuk fetch data dari API:

```javascript
// Fetch sensus data dari /api/sensus
async function fetchSensusMetrics() {
  const response = await signedApiFetch('/sensus?limit=100', { method: 'GET' })
  // Aggregate data dan generate trend points
  const totalDetails = sensusList.reduce((sum, sensus) => {
    return sum + sensus.details.length
  }, 0)
  // ... generate trend dan delta
}
```

**Logical Flow:**
1. Fetch sensus list dari `/api/sensus` endpoint (max 100 records)
2. Count total detail records dari semua sensus
3. Generate 8 data points untuk trend (menggunakan historical detail counts)
4. Calculate delta percentage dari perubahan data terakhir
5. Return formatted metric object

**Fallback Mechanism:**
- Jika API request gagal, akan return dummy data default
- User tetap bisa melihat dashboard tanpa error

### 4. `src/modules/dashboard/controller.js`
Menambahkan `loadMetrics()` method untuk expose async metrics loading.

### 5. `src/modules/dashboard/view.vue`
Menambahkan:
- Import `ref` dan `onMounted` dari Vue
- `metricsData` ref untuk store metrics state
- `onMounted` hook yang memanggil `controller.loadMetrics()` saat component mount
- Metrics computed property yang return cached data atau fallback

```javascript
const metricsData = ref(null)

onMounted(async () => {
  const loadedMetrics = await props.controller.loadMetrics()
  metricsData.value = loadedMetrics
})
```

## API Endpoint Structure

### GET /api/sensus

**Request:**
```
GET /api/sensus?limit=100&page=1
Headers:
  Authorization: Bearer <access_token>
  X-Signature: <signature>
  X-Signature-Timestamp: <timestamp>
  X-Signature-UUID: <uuid>
```

**Response:**
```json
{
  "code": 0,
  "message": "sensus list",
  "data": [
    {
      "id": 1,
      "id_sensus": "SENSUS0001",
      "sensus_date": "2026-03-31",
      "created_at": "2026-03-31T00:00:00.000Z",
      "created_by": "tester",
      "updated_at": "2026-03-31T00:00:00.000Z",
      "updated_by": "tester",
      "description": "sample",
      "details": [
        {
          "id": 11,
          "id_location": 101,
          "type_of_work": { ... },
          "rows_no": [1, 2],
          "blocks": [ ... ],
          "description": "detail 1",
          "photo1": "...",
          "progress_status": "draft",
          "created_at": "...",
          "created_by": "...",
          "updated_at": "...",
          "updated_by": "..."
        }
      ]
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

## Data Flow

```
┌─────────────────┐
│   view.vue      │
│   (onMounted)   │
└────────┬────────┘
         │
         │ calls loadMetrics()
         │
         ▼
┌─────────────────┐
│  controller.js  │
│  loadMetrics()  │
└────────┬────────┘
         │
         │ calls model.loadMetrics()
         │
         ▼
┌─────────────────────────────┐
│ model.js                    │
│ fetchSensusMetrics()        │
│ - signedApiFetch()          │
│ - aggregate data            │
│ - generate trend points     │
│ - calculate delta           │
└────────┬────────────────────┘
         │
         │ returns metrics
         │
         ▼
┌─────────────────────────────┐
│ /api/sensus endpoint        │
│ (Backend)                   │
└─────────────────────────────┘
```

## Chart Styling

Setiap metric card memiliki warna tersendiri yang dikonfigurasi di `toneColorMap`:

```javascript
const toneColorMap = {
  orange: { color: '#fb8c00', light: 'rgba(251, 140, 0, 0.1)' },
  green: { color: '#16a34a', light: 'rgba(22, 163, 74, 0.1)' },
  blue: { color: '#2563eb', light: 'rgba(37, 99, 235, 0.1)' },
  amber: { color: '#d97706', light: 'rgba(217, 119, 6, 0.1)' }
}
```

Chart menggunakan:
- **Stroke**: Solid line dengan width 2px
- **Fill**: Gradient dengan opacity fade dari 0.28 ke 0.02
- **Sparkline**: No toolbar, no grid, no labels
- **Tooltip**: Disabled untuk clean look

## Pengembangan Lebih Lanjut

### Untuk card Pembersihan, Pemupukan, Panen:

1. **Identify API endpoint** masing-masing card
2. **Create separate fetch functions** di model.js
3. **Update metrics array** untuk include hasil dari API calls
4. **Test dengan actual data** dari backend

Contoh untuk Pembersihan:
```javascript
async function fetchCleaningMetrics() {
  const response = await signedApiFetch('/activities?type=pembersihan&limit=100')
  // Process data...
  return { title: 'Pembersihan', value: '...', points: [...], ... }
}
```

### Caching & Performance:
- Current implementation uses simple in-memory cache
- Consider adding TTL (time-to-live) untuk cache invalidation
- Add loading indicator saat fetching data

### Error Handling:
- Current fallback to dummy data jika API fails
- Consider adding user notification untuk API errors
- Add retry logic untuk failed requests

## Installation & Running

```bash
# Install dependencies (termasuk ApexCharts)
cd energi-fe
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Chart tidak muncul:
1. Pastikan ApexCharts sudah di-install: `npm ls apexcharts`
2. Check browser console untuk error messages
3. Verify API endpoint `/api/sensus` accessible dan working

### Data tidak update:
1. Check network tab di browser DevTools
2. Verify API response structure sesuai dengan expected format
3. Check console log untuk error messages dalam `fetchSensusMetrics()`

### Chart styling tidak sesuai:
1. Verify CSS variables sudah didefinisikan (--surface, --border, --text-soft, etc)
2. Check ApexCharts version compatible dengan Vue 3
3. Try clear cache dan reload page

## References
- [ApexCharts Documentation](https://apexcharts.com)
- [Vue3-ApexCharts](https://apexcharts.com/docs/vue/)
- [Energi Backend API Docs](./energi-be/)
