<template>
  <section class="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
    <header class="border-b border-(--border) px-5 py-4">
      <h2 class="m-0 text-base font-semibold text-(--text)">Daftar Pekerja</h2>
      <p class="m-0 mt-1 text-sm text-(--text-muted)">Ringkasan aktivitas pekerja pada periode yang dipilih.</p>
    </header>
    <div class="overflow-x-auto">
      <table class="performance-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Jabatan</th>
            <th>Jumlah Hari Kerja</th>
            <th>Jumlah Pembersihan</th>
            <th>Jumlah Pemupukan</th>
            <th>Jumlah Panen</th>
            <th>Total Hari Kerja</th>
            <th v-if="canViewProfiles">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.user_id">
            <td>{{ workerName(row) }}</td>
            <td>{{ row.jabatan || '—' }}</td>
            <td>{{ row.workDays }}</td>
            <td>{{ row.cleaningDays }}</td>
            <td>{{ row.fertilizingDays }}</td>
            <td>{{ row.harvestDays }}</td>
            <td>{{ row.workDays }} hari</td>
            <td v-if="canViewProfiles" class="text-center">
              <button type="button" class="performance-view-button" @click="$emit('view', row)">View</button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="canViewProfiles ? 8 : 7" class="py-10 text-center text-sm text-(--text-muted)">Tidak ada data pada periode ini.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
  canViewProfiles: { type: Boolean, default: false }
})

defineEmits(['view'])

function workerName(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || '—'
}
</script>

<style scoped>
.performance-table {
  width: 100%;
  min-width: 1040px;
  border-collapse: collapse;
  color: var(--text);
}

.performance-table th {
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .04em;
  padding: 12px;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.performance-table td {
  border-top: 1px solid var(--border);
  font-size: 14px;
  padding: 10px 12px;
  white-space: nowrap;
}

.performance-table td:first-child {
  font-weight: 500;
}

.performance-view-button {
  min-width: 64px;
  border: 1px solid var(--border-strong, var(--border));
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
}

.performance-view-button:hover {
  background: var(--surface-muted);
}
</style>
