<template>
    <div class="flex min-h-full flex-col">
        <div v-if="loading" class="flex justify-center items-center py-20 text-sm text-(--text-muted)">
            <span class="animate-pulse">Memuat data pengiriman&hellip;</span>
        </div>

        <div v-else class="flex flex-1 flex-col">
            <div class="overflow-hidden rounded-xl border border-(--border) bg-(--surface)">
                <div class="overflow-x-auto table-scroll">
                    <table class="min-w-[1000px] w-full divide-y divide-(--border)">
                        <thead>
                            <tr class="text-left text-xs font-medium uppercase tracking-wide text-(--text-muted) bg-(--surface-muted)">
                                <th class="px-4 py-4">ID Trip</th>
                                <th class="px-4 py-4">Tanggal Kirim</th>
                                <th class="px-4 py-4">Asal</th>
                                <th class="px-4 py-4">Tujuan</th>
                                <th class="px-4 py-4">Dikirim</th>
                                <th class="px-4 py-4">Status</th>
                                <th class="px-4 py-4">No. Penerimaan</th>
                                <th class="px-4 py-4">Tanggal Terima</th>
                                <th class="px-4 py-4">Diterima</th>
                                <th class="px-4 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-(--border)">
                            <tr v-for="item in items" :key="item.id" class="text-sm text-(--text)">
                                <td class="px-4 py-4 font-medium">{{ item.id ?? '-' }}</td>
                                <td class="px-4 py-4 whitespace-nowrap">{{ item.startTime }}</td>
                                <td class="px-4 py-4">{{ item.originName }}</td>
                                <td class="px-4 py-4">{{ item.destinationName }}</td>
                                <td class="px-4 py-4 whitespace-nowrap">{{ item.volumeLabel }}</td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                                        :class="item.received ? 'bg-[#e6f3ea] text-[#00642a]' : 'bg-[#fff4d6] text-[#7a5b00]'">
                                        {{ item.statusLabel }}
                                    </span>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">{{ item.receiptNo }}</td>
                                <td class="px-4 py-4 whitespace-nowrap">{{ item.receivedDate }}</td>
                                <td class="px-4 py-4 whitespace-nowrap">{{ item.receivedLabel }}</td>
                                <td class="px-4 py-4">
                                    <div class="flex items-center justify-end gap-2">
                                        <button type="button"
                                            class="rounded-md border border-(--border) px-3.5 py-1.5 text-sm font-medium text-(--text) hover:bg-(--surface-muted) hover:cursor-pointer"
                                            @click="$emit('view', item)">
                                            View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="items.length === 0">
                                <td colspan="10" class="px-6 py-10 text-center text-sm text-(--text-muted)">
                                    Tidak ada data pengiriman ditemukan.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <ListPagination
                :total-items="totalItems"
                :current-page="currentPage"
                :page-size="pageSize"
                :total-pages="totalPages"
                :visible-pages="visiblePages"
                @update:current-page="$emit('update:currentPage', $event)"
                @update:page-size="$emit('update:pageSize', $event)"
            />
        </div>
    </div>
</template>

<script setup>
import { ListPagination } from '../../shared/pagination'

defineProps({
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    totalItems: { type: Number, default: 0 },
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: 10 },
    totalPages: { type: Number, default: 1 },
    visiblePages: { type: Array, default: () => [] }
})

defineEmits(['view', 'update:currentPage', 'update:pageSize'])
</script>

<style>
.table-scroll {
    scrollbar-width: thin;
    scrollbar-color: var(--text-muted) var(--surface-muted);
    max-height: 600px;
    overflow-x: auto;
    overflow-y: auto;
}

.table-scroll::-webkit-scrollbar {
    height: 8px;
    width: 8px;
}

.table-scroll::-webkit-scrollbar-track {
    background: var(--surface-muted);
    border-radius: 4px;
}

.table-scroll::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 4px;
}
</style>
