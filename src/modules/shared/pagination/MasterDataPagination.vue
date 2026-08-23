<template>
  <div>
    <div v-if="totalItems > 0" class="flex items-center justify-between mt-5 gap-4 flex-wrap">
      <p class="text-xs text-(--text-muted) font-medium m-0">
        Showing {{ totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} records
      </p>
      <div class="flex items-center gap-2">
        <label class="text-xs text-(--text-muted) font-medium" :for="`${id}-page-size`">Rows:</label>
        <select
          :id="`${id}-page-size`"
          :value="pageSize"
          class="border border-(--border) bg-(--surface) rounded-lg px-2.5 py-1.5 text-xs text-(--text) outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
          aria-label="Jumlah data per halaman"
          @change="$emit('update:pageSize', Number($event.target.value))">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
        </select>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-end mt-3 gap-4 flex-wrap">
      <nav class="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          :disabled="currentPage === 1"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-(--border) bg-(--surface) text-(--text) hover:bg-(--surface-muted) disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          aria-label="Previous page"
          @click="$emit('update:currentPage', currentPage - 1)">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <template v-for="(page, index) in visiblePages" :key="`${page}-${index}`">
          <span v-if="page === '...'" class="flex items-center justify-center w-9 h-9 text-(--text-muted) text-sm select-none">…</span>
          <button
            v-else
            type="button"
            :aria-current="currentPage === page ? 'page' : undefined"
            :class="currentPage === page ? 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-200 scale-105' : 'bg-(--surface) text-(--text) border-(--border) hover:bg-(--surface-muted)'"
            class="flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-semibold transition-all duration-150 cursor-pointer"
            @click="$emit('update:currentPage', page)">{{ page }}</button>
        </template>
        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-(--border) bg-(--surface) text-(--text) hover:bg-(--surface-muted) disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          aria-label="Next page"
          @click="$emit('update:currentPage', currentPage + 1)">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
defineProps({
  id: { type: String, default: 'master-data' },
  totalItems: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  totalPages: { type: Number, default: 1 },
  visiblePages: { type: Array, default: () => [] }
})

defineEmits(['update:currentPage', 'update:pageSize'])
</script>
