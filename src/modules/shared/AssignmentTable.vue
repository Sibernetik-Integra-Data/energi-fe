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
          <td class="py-3 px-4 text-sm text-(--text)">{{ item.jobType || '—' }}</td>
          <td class="py-3 px-4 text-sm font-semibold text-(--text) whitespace-nowrap">{{ item.sensusId || '—' }}</td>
          <td class="py-3 px-4 text-sm text-(--text)">{{ item.groupOfWork || taskType || '—' }}</td>
          <td class="py-3 px-4 text-sm text-(--text)">{{ item.blocks?.length || 0 }}</td>
          <td class="py-3 px-4 text-sm text-(--text) whitespace-nowrap">{{ item.startDateFormatted || item.sensusDateFormatted || '—' }}</td>
          <td class="py-3 px-4 text-sm text-(--text) whitespace-nowrap">{{ item.labors?.length || 0 }}</td>
          <td class="py-3 px-4"><span :class="statusClass(item.status)" class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap">{{ statusLabel(item.status) }}</span></td>
          <td class="py-3 px-4"><button type="button" class="text-sm py-1.5 px-4 rounded-full border border-(--border) bg-transparent text-(--text) hover:bg-(--surface-muted) transition-colors cursor-pointer" @click="$emit('view-detail', item)">{{ t('shared.assignment.view') }}</button></td>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="8" class="py-10 text-center text-xs text-(--text-muted)">{{ t('shared.assignment.noData') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({
  items: { type: Array, default: () => [] },
  taskType: { type: String, default: '' }
})

defineEmits(['view-detail'])

const headings = computed(() => ['colTask', 'colSensusId', 'colTaskType', 'colBlocks', 'colSensusDate', 'colWorkers', 'colStatus', 'colAction'].map((k) => t(`shared.assignment.${k}`)))

function statusLabel(status) {
  const map = {
    draft: t('shared.assignment.statusDraft'),
    wip: t('shared.assignment.statusWip'),
    done: t('shared.assignment.statusDone'),
    submitted: t('shared.assignment.statusSubmitted'),
    in_progress: t('shared.assignment.statusWip')
  }
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
