<template>
  <div class="sensus-list">
    <div class="sensus-header">
      <div>
        <h2>{{ title }}</h2>
        <p class="muted">{{ subtitle }}</p>
      </div>
        <div class="tabs" role="tablist" aria-label="Sensus filters">
          <button class="tab active" role="tab" aria-selected="true">All Reports ({{ rows.length }})</button>
          <button class="tab" role="tab">Open ({{ rows.filter(r=>r.status==='Open').length }})</button>
          <button class="tab" role="tab">Verified ({{ rows.filter(r=>r.status==='Verified').length }})</button>
        </div>
    </div>

    <div class="table-wrap">
      <table class="sensus-table">
        <thead>
          <tr>
            <th>SENSUS ID</th>
            <th>REPORTER</th>
            <th>DATE & TIME</th>
            <th>JOB TYPES</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td class="sensus-id">{{ row.id }}</td>
            <td>{{ row.worker }}</td>
            <td class="meta-line--date">{{ row.date }}, {{ row.time }}</td>
            <td>
              <div class="job-chips">
                <span v-for="(j,idx) in row.jobTypes" :key="idx" class="chip">{{ j }}</span>
              </div>
            </td>
            <td>
              <span :class="['status-chip', row.status && row.status.toLowerCase()]">{{ row.status || 'Open' }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn btn-ghost">View</button>
                <button class="btn btn-primary">Verify</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Responsive cards for small screens -->
    <div class="card-list">
      <div class="sensus-card" v-for="row in rows" :key="row.id">
        <div class="card-top">
          <div>
            <div class="sensus-id">{{ row.id }}</div>
            <div class="small muted">{{ row.worker }} • {{ row.date }}, {{ row.time }}</div>
          </div>
          <div>
            <span :class="['status-chip', row.status && row.status.toLowerCase()]">{{ row.status || 'Open' }}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="job-chips">
            <span v-for="(j,idx) in row.jobTypes" :key="idx" class="chip">{{ j }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-ghost">View</button>
          <button class="btn btn-primary">Verify</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})
</script>

<style scoped>
.sensus-list { }
.sensus-header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:12px }
.sensus-list h2 { font-size:24px; margin:0 0 6px; font-weight:800; letter-spacing:-0.01em; color:var(--text) }
.sensus-list .muted { margin:0 0 12px; color:var(--text-muted); font-size:14px }
.tabs { display:flex; gap:8px; background: #f3f4f6; padding:6px; border-radius:999px; align-items:center }
.tab { background:transparent; border:0; padding:8px 14px; border-radius:999px; color:var(--text-muted); font-weight:600; cursor:pointer; transition:all .15s ease }
.tab:hover { color:var(--text); transform:translateY(-1px) }
.tab.active { background:#ffffff; color:var(--text); box-shadow:0 6px 14px rgba(15,23,42,0.06); border:1px solid rgba(0,0,0,0.04) }
.table-wrap { background:transparent }
.sensus-table { width:100%; border-collapse:collapse; background:#fff; border-radius:12px; overflow:hidden }
.sensus-table thead th { text-align:left; font-size:12px; font-weight:800; color:#475569; padding:18px 26px; text-transform:uppercase; letter-spacing:0.08em; background:linear-gradient(180deg,#fbfdff,#f7f8fa); border-bottom:1px solid rgba(15,23,42,0.04); box-shadow: inset 0 -1px 0 rgba(15,23,42,0.02) }
.sensus-table thead th:first-child { border-top-left-radius:12px }
.sensus-table thead th:last-child { border-top-right-radius:12px }
.sensus-table tbody td { padding:20px 24px; vertical-align:middle; border-bottom:1px solid rgba(0,0,0,0.04) }
.sensus-id { font-weight:700 }
.job-chips { display:flex; gap:8px; flex-wrap:wrap }
.chip { background:#f1f5f9; padding:8px 12px; border-radius:999px; font-size:13px; color:#374151 }
.status-chip { display:inline-block; padding:6px 10px; border-radius:999px; font-size:13px; font-weight:700; letter-spacing:0.01em; transition:transform .12s ease, box-shadow .12s ease }
.status-chip.open { background: linear-gradient(180deg,#fff8f0,#fff6f0); color:#b45309; border:1px solid rgba(180,83,9,0.12); box-shadow:0 2px 6px rgba(180,83,9,0.06) }
.status-chip.verified { background: linear-gradient(180deg,#f0fdf6,#ecfff4); color:#065f46; border:1px solid rgba(6,95,70,0.08); box-shadow:0 2px 6px rgba(6,95,70,0.04) }
.status-chip:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(15,23,42,0.08) }
.actions { display:flex; gap:10px; align-items:center }
.btn { padding:8px 12px; border-radius:10px; border:1px solid rgba(15,23,42,0.06); background:#fff; font-weight:700; color:var(--text); box-shadow:0 2px 6px rgba(15,23,42,0.04); transition:transform .12s ease, box-shadow .12s ease }
.btn:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(15,23,42,0.08) }
.btn-ghost { background:#fff; color:var(--text); border:1px solid rgba(15,23,42,0.06) }
.btn-ghost:hover { background:#fff } 
.btn-primary { background: linear-gradient(180deg,#0ea37a,#0b8d5f); color:#fff; border:0; box-shadow:0 8px 20px rgba(6,95,70,0.12) }
.btn-primary:hover { filter:brightness(.95); transform:translateY(-2px) }

/* Ensure card actions use the same modern styles */
.card-actions .btn { padding:8px 12px; border-radius:10px }
.card-actions .btn-primary { box-shadow:0 8px 20px rgba(6,95,70,0.10) }

/* Smaller controls inside table rows */
.sensus-table .status-chip { padding:6px 10px; font-size:12px }
.sensus-table .actions .btn { padding:6px 10px; font-size:13px; border-radius:8px }


/* Card list (hidden on desktop) */
.card-list { display:none; gap:12px; margin-top:12px }
.sensus-card { background:#fff; border:1px solid var(--border); border-radius:12px; padding:16px; box-shadow:0 6px 16px rgba(15,23,42,0.03); display:flex; flex-direction:column; gap:12px }
.card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px }
.card-body { display:flex; gap:8px; flex-wrap:wrap }
.card-actions { display:flex; justify-content:flex-end; gap:8px }

/* Spacing and typography tweaks to better match Figma */
.sensus-table tbody td { padding:22px 28px }
.sensus-table thead th { padding:20px 28px }
.sensus-list h2 { /* already styled above */ }

@media (max-width: 920px) {
  .table-wrap { display:none }
  .card-list { display:flex; flex-direction:column }
  .sensus-content { padding:12px }
}

</style>
