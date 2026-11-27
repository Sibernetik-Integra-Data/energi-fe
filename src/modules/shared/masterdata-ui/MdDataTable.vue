<template>
  <section class="md-panel md-table-panel" :aria-label="ariaLabel">
    <div v-if="$slots.toolbar" class="md-toolbar"><slot name="toolbar" /></div>

    <!-- Memuat -->
    <div v-if="loading" class="md-tscroll">
      <table class="md-table">
        <thead>
          <tr>
            <th v-for="c in columns" :key="c.key" scope="col" :class="{ 'is-right': c.align === 'right' }">{{ c.label }}</th>
            <th v-if="$slots.actions" scope="col"><span class="md-sr">Aksi</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 6" :key="i">
            <td v-for="(c, j) in columns" :key="c.key">
              <div class="md-skel" :style="{ width: `${[60, 40, 50, 45, 30, 70, 55][j % 7]}%` }" />
            </td>
            <td v-if="$slots.actions" />
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Galat -->
    <div v-else-if="error" class="md-state md-state--err" role="alert">
      <div class="md-state__ill"><MdIcon name="alert" :size="32" /></div>
      <h3>{{ entityLabel }} gagal dimuat</h3>
      <p>{{ error }}</p>
      <button type="button" class="md-btn md-btn--primary" @click="$emit('retry')"><MdIcon name="refresh" />Coba lagi</button>
    </div>

    <!-- Belum ada data sama sekali -->
    <div v-else-if="!totalRows" class="md-state">
      <div class="md-state__ill"><MdIcon :name="emptyIcon" :size="32" /></div>
      <h3>Belum ada {{ entityLabel.toLowerCase() }}</h3>
      <p>{{ emptyText }}</p>
      <button v-if="canAdd" type="button" class="md-btn md-btn--primary" @click="$emit('add')"><MdIcon name="plus" />{{ addLabel }}</button>
    </div>

    <!-- Hasil filter kosong -->
    <div v-else-if="!rows.length" class="md-state">
      <div class="md-state__ill"><MdIcon name="search" :size="32" /></div>
      <h3>Tidak ada {{ entityLabel.toLowerCase() }} yang cocok</h3>
      <p>Coba kata kunci lain atau longgarkan filter yang sedang aktif.</p>
      <button type="button" class="md-btn" @click="$emit('clear-filters')"><MdIcon name="x" />Bersihkan filter</button>
    </div>

    <template v-else>
      <div class="md-tscroll">
        <table class="md-table">
          <thead>
            <tr>
              <th
                v-for="c in columns"
                :key="c.key"
                scope="col"
                :class="{ 'is-right': c.align === 'right' }"
                :aria-sort="c.sortable === false ? undefined : sortKey === c.key ? (sortDir > 0 ? 'ascending' : 'descending') : 'none'">
                <button v-if="c.sortable !== false" type="button" @click="sortBy(c.key)">
                  {{ c.label }}
                  <span class="md-si"><MdIcon :name="sortKey !== c.key ? 'sort' : sortDir > 0 ? 'chevronUp' : 'chevronDown'" :size="14" /></span>
                </button>
                <template v-else>{{ c.label }}</template>
              </th>
              <th v-if="$slots.actions" scope="col" class="is-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in pageRows" :key="r[rowKey]">
              <td v-for="c in columns" :key="c.key" :class="{ 'is-right': c.align === 'right' }">
                <slot :name="`cell-${c.key}`" :row="r">{{ r[c.key] ?? '—' }}</slot>
              </td>
              <td v-if="$slots.actions"><div class="md-row-actions"><slot name="actions" :row="r" /></div></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md-cards">
        <div v-for="r in pageRows" :key="r[rowKey]" class="md-card">
          <slot name="card" :row="r" />
          <div v-if="$slots.actions" class="md-row-actions"><slot name="actions" :row="r" /></div>
        </div>
      </div>

      <div class="md-tfoot">
        <span>Menampilkan <b class="md-num">{{ from }}–{{ to }}</b> dari <b class="md-num">{{ sortedRows.length }}</b> data</span>
        <span class="md-pp">
          Baris per halaman
          <MdDropdown v-model="perPage" :options="perPageOptions" up label="" :summary-text="String(perPage)" @change="page = 1" />
        </span>
        <nav class="md-pager" aria-label="Halaman">
          <button type="button" :disabled="page === 1" aria-label="Halaman sebelumnya" @click="page--"><MdIcon name="chevronLeft" :size="16" /></button>
          <template v-for="(p, i) in pages" :key="i">
            <button v-if="p === '…'" type="button" class="md-pg" disabled>…</button>
            <button v-else type="button" class="md-pg" :aria-current="p === page ? 'page' : undefined" @click="page = p">{{ p }}</button>
          </template>
          <button type="button" :disabled="page === pageCount" aria-label="Halaman berikutnya" @click="page++"><MdIcon name="chevronRight" :size="16" /></button>
        </nav>
      </div>
    </template>
  </section>
</template>

<script setup>
// Tabel Data Master: sortir, pagination, state memuat/galat/kosong/hasil kosong, kartu di layar sempit.
// `rows` = baris yang sudah disaring; `totalRows` = jumlah semua baris sebelum filter.
import { computed, ref, watch } from 'vue'
import MdIcon from './MdIcon.vue'
import MdDropdown from './MdDropdown.vue'

const props = defineProps({
  columns: { type: Array, required: true }, // [{ key, label, sortable?, align?, sortValue?(row) }]
  rows: { type: Array, default: () => [] },
  totalRows: { type: Number, default: 0 },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  entityLabel: { type: String, default: 'Data' },
  emptyText: { type: String, default: 'Tambahkan data pertama.' },
  emptyIcon: { type: String, default: 'inbox' },
  addLabel: { type: String, default: 'Tambah' },
  canAdd: { type: Boolean, default: false },
  ariaLabel: { type: String, default: 'Daftar data' },
  initialSort: { type: String, default: '' },
  initialDir: { type: Number, default: 1 }
})
defineEmits(['retry', 'clear-filters', 'add'])

const sortKey = ref(props.initialSort)
const sortDir = ref(props.initialDir)
const page = ref(1)
const perPage = ref(10)
const perPageOptions = [5, 10, 20, 50].map((n) => ({ value: n, label: String(n) }))

function sortBy(key) {
  sortDir.value = sortKey.value === key ? -sortDir.value : 1
  sortKey.value = key
}
// Dipakai halaman, mis. kartu KPI "urutkan".
function setSort(key, dir = 1) {
  sortKey.value = key
  sortDir.value = dir
  page.value = 1
}

const sortedRows = computed(() => {
  const col = props.columns.find((c) => c.key === sortKey.value)
  if (!col) return props.rows
  const get = col.sortValue || ((r) => r[col.key])
  return [...props.rows].sort((a, b) => {
    const A = get(a)
    const B = get(b)
    if (A == null || A === '') return 1
    if (B == null || B === '') return -1
    const cmp = typeof A === 'number' && typeof B === 'number'
      ? A - B
      : String(A).localeCompare(String(B), 'id', { numeric: true })
    return cmp * sortDir.value
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / perPage.value)))
watch([() => props.rows, pageCount], () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})
watch(() => props.rows.length, () => { page.value = 1 })

const pageRows = computed(() => sortedRows.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const from = computed(() => (sortedRows.value.length ? (page.value - 1) * perPage.value + 1 : 0))
const to = computed(() => Math.min(page.value * perPage.value, sortedRows.value.length))
const pages = computed(() => {
  const out = []
  for (let i = 1; i <= pageCount.value; i++) {
    if (i === 1 || i === pageCount.value || Math.abs(i - page.value) <= 1) out.push(i)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
})

defineExpose({ setSort })
</script>
