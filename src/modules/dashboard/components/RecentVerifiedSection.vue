<template>
  <section class="recent-card">
    <div class="recent-card__header">
      <div>
        <h2>{{ section.title }}</h2>
        <p>{{ section.subtitle }}</p>
      </div>
    </div>

    <div class="recent-card__table-wrap">
      <table class="recent-card__table">
        <thead>
          <tr>
            <th v-for="column in section.columns" :key="column.key">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in section.rows" :key="row.sensusId">
            <td class="recent-card__sensus-id">{{ row.sensusId }}</td>
            <td>{{ row.worker }}</td>
            <td>
              <span class="recent-card__meta">
                <span class="recent-card__meta-icon">
                  <BaseIcon name="location-pin" size="16" />
                </span>
                <span>{{ row.block }}</span>
              </span>
            </td>
            <td class="recent-card__datetime-cell">
              <span class="recent-card__meta recent-card__meta--stacked">
                <span class="recent-card__meta-line recent-card__meta-line--date">
                  <span class="recent-card__meta-icon">
                    <BaseIcon name="calendar" size="16" />
                  </span>
                  <span>{{ row.date }}</span>
                </span>
                <span class="recent-card__meta-line recent-card__meta-line--muted">
                  <span class="recent-card__meta-icon">
                    <BaseIcon name="clock" size="16" />
                  </span>
                  <span>{{ row.time }}</span>
                </span>
              </span>
            </td>
            <td>
              <div class="recent-card__chips">
                <span v-for="jobType in row.jobTypes" :key="jobType" class="recent-chip">{{ jobType }}</span>
              </div>
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
.recent-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.recent-card__header {
  padding: 18px 24px;
  min-height: 96px;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--border);
}

.recent-card__header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.recent-card__header p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 20px;
}

.recent-card__table-wrap {
  overflow-x: auto;
}

.recent-card__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1160px;
}

.recent-card__table th,
.recent-card__table td {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

.recent-card__table thead th {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  background: linear-gradient(180deg, rgba(248, 249, 251, 0.9), rgba(248, 249, 251, 0.7));
}

.recent-card__table tbody td {
  font-size: 15px;
  line-height: 1.25;
  color: #1f2937;
}

.recent-card__sensus-id {
  font-weight: 700;
  color: #2f2f2f;
  letter-spacing: -0.02em;
}

.recent-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2f2f2f;
}

.recent-card__meta--stacked {
  display: inline-grid;
  gap: 8px;
}

.recent-card__meta-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.recent-card__meta-line--date {
  white-space: nowrap;
}

.recent-card__meta-line--muted {
  color: #8a8f98;
}

.recent-card__meta-icon {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  color: #a3a3a3;
  flex: 0 0 auto;
}

.recent-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recent-chip {
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

.recent-card__datetime-cell {
  min-width: 152px;
}

@media (max-width: 920px) {
  .recent-card__header {
    min-height: auto;
    padding: 18px 18px 16px;
  }

  .recent-card__table th,
  .recent-card__table td {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>