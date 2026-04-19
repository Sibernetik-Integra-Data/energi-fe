<template>
  <div>
    <!-- Title + Tabs (space-between) -->
    <div class="flex justify-between items-center gap-4 mb-3">
      <div>
        <h2 class="text-2xl font-extrabold tracking-tight text-(--text) m-0 mb-1.5">{{ title }}</h2>
        <p class="text-sm text-(--text-muted) m-0">{{ subtitle }}</p>
      </div>
      <div class="flex gap-2 bg-gray-100 p-1.5 rounded-full items-center shrink-0" role="tablist" aria-label="Sensus filters">
        <button
          class="bg-white text-(--text) shadow-sm border border-black/5 py-2 px-3.5 rounded-full text-sm font-semibold cursor-pointer"
          role="tab" aria-selected="true"
        >All Reports ({{ rows.length }})</button>
        <button
          class="bg-transparent border-0 py-2 px-3.5 rounded-full text-(--text-muted) text-sm font-semibold cursor-pointer hover:text-(--text) transition-colors"
          role="tab"
        >Open ({{ rows.filter(r => r.status === 'Open').length }})</button>
        <button
          class="bg-transparent border-0 py-2 px-3.5 rounded-full text-(--text-muted) text-sm font-semibold cursor-pointer hover:text-(--text) transition-colors"
          role="tab"
        >Verified ({{ rows.filter(r => r.status === 'Verified').length }})</button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">
      Memuat data&hellip;
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex justify-center items-center py-16 text-sm text-red-600">
      {{ error }}
    </div>

    <!-- Table desktop -->
    <template v-else>
    <div class="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm max-[920px]:hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50">
            <th class="text-left text-xs font-extrabold text-slate-500 py-4 px-6 uppercase tracking-widest">SENSUS ID</th>
            <th class="text-left text-xs font-extrabold text-slate-500 py-4 px-6 uppercase tracking-widest">REPORTER</th>
            <th class="text-left text-xs font-extrabold text-slate-500 py-4 px-6 uppercase tracking-widest">DATE & TIME</th>
            <th class="text-left text-xs font-extrabold text-slate-500 py-4 px-6 uppercase tracking-widest">JOB TYPES</th>
            <th class="text-left text-xs font-extrabold text-slate-500 py-4 px-6 uppercase tracking-widest">STATUS</th>
            <th class="text-left text-xs font-extrabold text-slate-500 py-4 px-6 uppercase tracking-widest">ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows" :key="row.id"
            class="border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
          >
            <td class="py-5 px-6 align-middle text-sm font-bold text-(--text)">{{ row.id }}</td>
            <td class="py-5 px-6 align-middle text-sm text-(--text)">{{ row.worker }}</td>
            <td class="py-5 px-6 align-middle text-sm text-(--text)">{{ row.date }}{{ row.time ? ', ' + row.time : '' }}</td>
            <td class="py-5 px-6 align-middle">
              <div class="flex gap-2 flex-wrap">
                <span
                  v-for="(j, idx) in row.jobTypes" :key="idx"
                  class="inline-block bg-slate-100 text-gray-700 py-1.5 px-3 rounded-full text-xs"
                >{{ j }}</span>
              </div>
            </td>
            <td class="py-5 px-6 align-middle">
              <span :class="statusChipClass(row.status)">{{ row.status || 'Open' }}</span>
            </td>
            <td class="py-5 px-6 align-middle">
              <div class="flex gap-2.5 items-center">
                <button class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border-0 hover:bg-slate-100 transition-colors cursor-pointer">View</button>
                <button class="text-sm py-1.5 px-4 rounded-lg border-0 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors cursor-pointer">Verify</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="hidden gap-3 mt-3 max-[920px]:flex max-[920px]:flex-col">
      <div
        v-for="row in rows" :key="row.id"
        class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col gap-3"
      >
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="font-bold text-sm text-(--text)">{{ row.id }}</div>
            <div class="text-xs text-(--text-muted) mt-0.5">{{ row.worker }} • {{ row.date }}{{ row.time ? ', ' + row.time : '' }}</div>
          </div>
          <span :class="statusChipClass(row.status)">{{ row.status || 'Open' }}</span>
        </div>
        <div class="flex gap-2 flex-wrap">
          <span
            v-for="(j, idx) in row.jobTypes" :key="idx"
            class="inline-block bg-slate-100 text-gray-700 py-1.5 px-3 rounded-full text-xs"
          >{{ j }}</span>
        </div>
        <div class="flex justify-end gap-2">
          <button class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer">View</button>
          <button class="text-sm py-1.5 px-4 rounded-lg border-0 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors cursor-pointer">Verify</button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

function statusChipClass(status) {
  const base = 'inline-block py-1.5 px-3 rounded-full text-xs font-semibold border'
  if (status && status.toLowerCase() === 'verified') {
    return base + ' bg-green-50 text-green-700 border-green-200'
  }
  return base + ' bg-orange-50 text-orange-700 border-orange-200'
}
</script>
