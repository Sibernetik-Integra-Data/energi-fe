<template>
  <section class="pending-card">
    <div class="pending-card__header">
      <div>
        <h2>{{ section.title }}</h2>
        <p>{{ section.subtitle }}</p>
      </div>

      <span class="pending-card__badge">{{ section.badge }}</span>
    </div>

    <div class="pending-card__table-wrap">
      <table class="pending-card__table">
        <thead>
          <tr>
            <th v-for="column in section.columns" :key="column.key">
              {{ column.label }}
            </th>
            <th class="pending-card__actions-column"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in section.rows" :key="row.sensusId">
            <td class="pending-card__sensus-id">{{ row.sensusId }}</td>
            <td>{{ row.worker }}</td>
            <td>
              <span class="pending-card__meta">
                <span class="pending-card__meta-icon">
                  <BaseIcon name="location-pin" size="16" />
                </span>
                <span>{{ row.block }}</span>
              </span>
            </td>
            <td class="pending-card__datetime-cell">
              <span class="pending-card__meta pending-card__meta--stacked">
                <span class="pending-card__meta-line pending-card__meta-line--date">
                  <span class="pending-card__meta-icon">
                    <BaseIcon name="calendar" size="16" />
                  </span>
                  <span>{{ row.date }}</span>
                </span>
                <span class="pending-card__meta-line pending-card__meta-line--muted">
                  <span class="pending-card__meta-icon">
                    <BaseIcon name="clock" size="16" />
                  </span>
                  <span>{{ row.time }}</span>
                </span>
              </span>
            </td>
            <td>
              <div class="pending-card__chips">
                <span v-for="jobType in row.jobTypes" :key="jobType" class="pending-chip">{{ jobType }}</span>
              </div>
            </td>
            <td>
              <span class="pending-status">{{ row.status }}</span>
            </td>
            <td class="pending-card__actions-cell">
              <button type="button" class="pending-card__action" aria-label="Open verification">
                <span></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import BaseIcon from '../../shared/icon'

defineProps({
  section: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.pending-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.pending-card__header {
  padding: 20px 24px;
  min-height: 100px;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--border);
}

.pending-card__header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.pending-card__header p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 20px;
}

.pending-card__badge {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #c2410c;
  color: #fff;
  font-size: 13px;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
}

.pending-card__table-wrap {
  overflow-x: auto;
}

.pending-card__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1180px;
}

.pending-card__table th,
.pending-card__table td {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

.pending-card__table thead th {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  background: linear-gradient(180deg, rgba(248, 249, 251, 0.9), rgba(248, 249, 251, 0.7));
}

.pending-card__table tbody td {
  font-size: 15px;
  line-height: 1.25;
  color: #1f2937;
}

.pending-card__sensus-id {
  font-weight: 700;
  color: #2f2f2f;
  letter-spacing: -0.02em;
}

.pending-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2f2f2f;
}

.pending-card__meta--stacked {
  display: inline-grid;
  gap: 8px;
}

.pending-card__meta-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pending-card__meta-line--date {
  white-space: nowrap;
}

.pending-card__meta-line--muted {
  color: #8a8f98;
}

.pending-card__meta-icon {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  color: #a3a3a3;
  flex: 0 0 auto;
}

.pending-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pending-chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #e9ecf2;
  color: #111827;
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
}

.pending-status {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid #fb923c;
  color: #9a3412;
  background: #fff7ed;
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
}

.pending-card__actions-column {
  width: 56px;
}

.pending-card__datetime-cell {
  min-width: 152px;
}

.pending-card__actions-cell {
  width: 56px;
  padding-left: 0;
  padding-right: 16px;
}

.pending-card__action {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: inline-grid;
  place-items: center;
}

.pending-card__action span {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  position: relative;
}

.pending-card__action span::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #d1d5db;
  transform: translateY(-50%);
}

@media (max-width: 920px) {
  .pending-card__header {
    min-height: auto;
    padding: 18px 18px 16px;
    flex-direction: column;
  }

  .pending-card__table th,
  .pending-card__table td {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>