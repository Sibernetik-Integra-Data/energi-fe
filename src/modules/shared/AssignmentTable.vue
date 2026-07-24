<template>
  <div class="bg-(--surface) border border-(--border) rounded-xl overflow-x-auto shadow-sm">
    <table class="w-full min-w-[780px] border-collapse">
      <thead>
        <tr class="border-b border-(--border) bg-(--surface-muted)">
          <th v-for="heading in headings" :key="heading" class="text-left text-[10px] font-bold text-(--text-muted) py-3 px-4 uppercase tracking-wider whitespace-nowrap">
            {{ heading }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="`${item.id}-${item.detailId || 'none'}`" class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors">
          <td class="py-3 px-4 text-xs font-semibold text-(--text) whitespace-nowrap">{{ item.sensusId || '—' }}</td>
          <td class="py-3 px-4 text-xs text-(--text)">{{ item.jobType || '—' }}</td>
          <td class="py-3 px-4 text-xs text-(--text)">{{ item.groupOfWork || taskType || '—' }}</td>
          <td class="py-3 px-4 text-xs text-(--text)">{{ item.blocks?.length || 0 }}</td>
          <td class="py-3 px-4 text-xs text-(--text) whitespace-nowrap">{{ item.startDateFormatted || item.sensusDateFormatted || '—' }}</td>
          <td class="py-3 px-4"><span :class="statusClass(item.status)" class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap">{{ statusLabel(item.status) }}</span></td>
          <td class="py-3 px-4"><button type="button" class="text-xs py-1.5 px-4 rounded-full border border-(--border) bg-transparent text-(--text) hover:bg-(--surface-muted) transition-colors cursor-pointer" @click="$emit('view-detail', item)">View</button></td>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="7" class="py-10 text-center text-xs text-(--text-muted)">Tidak ada data ditemukan.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  taskType: { type: String, default: '' }
})

defineEmits(['view-detail'])

const headings = ['Sensus ID', 'Task', 'Task Type', 'Total Block', 'Job Types', 'Status', 'Action']

function statusLabel(status) {
  const map = { draft: 'Draft', wip: 'On Progress', done: 'Done', submitted: 'Submitted', in_progress: 'On Progress' }
  return map[status] || status || '—'
}

function statusClass(status) {
  const map = {
    draft: 'bg-orange-50 text-orange-500',
    wip: 'bg-orange-50 text-orange-500',
    done: 'bg-green-50 text-green-600',
    submitted: 'bg-blue-50 text-blue-500',
    in_progress: 'bg-orange-50 text-orange-500'
  }
  return map[status] || 'bg-(--surface-muted) text-(--text-muted)'
}
</script>
