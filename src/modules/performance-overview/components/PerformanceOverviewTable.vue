<template>
  <section class="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
    <header class="border-b border-(--border) px-5 py-4">
      <h2 class="m-0 text-base font-semibold text-(--text)">{{ t('performance.table.title') }}</h2>
      <p class="m-0 mt-1 text-sm text-(--text-muted)">{{ t('performance.table.subtitle') }}</p>
    </header>
    <div class="overflow-x-auto">
      <table class="performance-table">
        <thead>
          <tr>
            <th>{{ t('performance.table.name') }}</th>
            <th>{{ t('performance.table.position') }}</th>
            <th>{{ t('performance.table.workDays') }}</th>
            <th>{{ t('performance.table.cleaning') }}</th>
            <th>{{ t('performance.table.fertilizing') }}</th>
            <th>{{ t('performance.table.harvest') }}</th>
            <th>{{ t('performance.table.totalWorkDays') }}</th>
            <th v-if="canViewProfiles">{{ t('performance.action') }}</th>
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
            <td>{{ t('performance.table.days', { n: row.workDays }, row.workDays) }}</td>
            <td v-if="canViewProfiles" class="text-center">
              <button type="button" class="performance-view-button" @click="$emit('view', row)">{{ t('performance.view') }}</button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="canViewProfiles ? 8 : 7" class="py-10 text-center text-sm text-(--text-muted)">{{ t('performance.table.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
