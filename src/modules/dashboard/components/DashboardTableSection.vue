<template>
  <section class="section-card">
    <div class="section-card__header">
      <div>
        <p class="section-card__eyebrow">{{ title }}</p>
        <h2>{{ subtitle }}</h2>
      </div>
    </div>

    <div class="section-card__table-wrap">
      <table class="section-card__table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" :class="column.align ? `is-${column.align}` : ''">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="rowKey(row)">
            <td v-for="column in columns" :key="column.key" :class="column.align ? `is-${column.align}` : ''">
              <template v-if="column.type === 'status'">
                <span class="status-pill" :class="statusClass(row[column.key])">
                  {{ row[column.key] }}
                </span>
              </template>
              <template v-else>
                {{ row[column.key] }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="!rows.length" class="section-card__empty">{{ emptyLabel }}</p>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    required: true
  },
  emptyLabel: {
    type: String,
    default: 'Tidak ada data'
  }
})

function rowKey(row) {
  return [row.activity, row.area, row.pic, row.time, row.result].filter(Boolean).join('|')
}

function statusClass(value) {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('selesai') || normalized.includes('disetujui') || normalized.includes('terkirim')) {
    return 'status-pill--success'
  }
  if (normalized.includes('berjalan')) {
    return 'status-pill--info'
  }
  return 'status-pill--warning'
}
</script>

<style scoped>
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.section-card__header {
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
}

.section-card__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brand);
}

.section-card h2 {
  margin: 0;
  font-size: 18px;
  line-height: 26px;
  letter-spacing: -0.03em;
}

.section-card__table-wrap {
  padding: 6px 12px 12px;
  overflow-x: auto;
}

.section-card__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
}

.section-card__table th,
.section-card__table td {
  padding: 16px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
}

.section-card__table th {
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-card__table tr:last-child td {
  border-bottom: 0;
}

.section-card__table td {
  color: var(--text);
}

.section-card__table td:first-child {
  font-weight: 700;
}

.section-card__table .is-right {
  text-align: right;
}

.section-card__table .is-center {
  text-align: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pill--success {
  color: var(--success);
  background: var(--success-soft);
}

.status-pill--info {
  color: var(--info);
  background: var(--info-soft);
}

.status-pill--warning {
  color: var(--warning);
  background: var(--warning-soft);
}

.section-card__empty {
  margin: 18px 12px 8px;
  color: var(--text-muted);
  font-size: 14px;
}
</style>