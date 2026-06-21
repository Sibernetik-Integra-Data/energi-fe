<template>
    <div class="overflow-hidden rounded-xl border border-(--border) bg-(--surface)">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-(--border)">
                <thead>
                    <tr class="text-left text-xs font-medium uppercase tracking-wide text-(--text-muted) bg-(--surface-muted)">
                        <th class="px-6 py-4">ID Pengiriman</th>
                        <th class="px-6 py-4">Date Pengiriman</th>
                        <th class="px-6 py-4">Qty Pengiriman</th>
                        <th class="px-6 py-4">Sensus ID</th>
                        <th class="px-6 py-4">ID Penerimaan</th>
                        <th class="px-6 py-4">Date Penerimaan</th>
                        <th class="px-6 py-4">Qty Penerimaan</th>
                        <th class="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-(--border)">
                    <tr v-for="item in items" :key="item.idPengiriman" class="text-sm text-(--text-muted)">
                        <td class="px-6 py-4 font-medium text-(--text)">{{ item.idPengiriman }}</td>
                        <td class="px-6 py-4">{{ item.datePengiriman }}</td>
                        <td class="px-6 py-4">{{ item.qtyPengiriman }}</td>
                        <td class="px-6 py-4 text-(--text-muted)">{{ item.sensusId }}</td>
                        <td class="px-6 py-4">{{ item.idPenerimaan ?? '-' }}</td>
                        <td class="px-6 py-4">{{ item.datePenerimaan ?? '-' }}</td>
                        <td class="px-6 py-4">{{ item.qtyPenerimaan ?? '-' }}</td>
                        <td class="px-6 py-4">
                            <div class="flex items-center justify-end gap-2">
                                <button v-if="!item.idPenerimaan" type="button"
                                    class="rounded-md bg-(--text) px-3.5 py-1.5 text-sm font-medium text-(--surface) opacity-90 hover:opacity-100"
                                    @click="$emit('terima', item)">
                                    Terima
                                </button>
                                <button type="button"
                                    class="rounded-md border border-(--border) px-3.5 py-1.5 text-sm font-medium text-(--text) hover:bg-(--surface-muted)"
                                    @click="$emit('view', item)">
                                    View
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
defineProps({
    items: {
        type: Array,
        default: () => [],
    },
})

defineEmits(['terima', 'view'])
</script>