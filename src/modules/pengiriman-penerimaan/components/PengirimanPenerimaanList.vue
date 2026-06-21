<template>
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100">
                <thead>
                    <tr class="text-left text-xs font-medium uppercase tracking-wide text-gray-400">
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
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="item in items" :key="item.idPengiriman" class="text-sm text-gray-700">
                        <td class="px-6 py-4 font-medium text-gray-900">{{ item.idPengiriman }}</td>
                        <td class="px-6 py-4">{{ item.datePengiriman }}</td>
                        <td class="px-6 py-4">{{ item.qtyPengiriman }}</td>
                        <td class="px-6 py-4 text-gray-400">{{ item.sensudId }}</td>
                        <td class="px-6 py-4">{{ item.idPenerimaan ?? '-' }}</td>
                        <td class="px-6 py-4">{{ item.datePenerimaan ?? '-' }}</td>
                        <td class="px-6 py-4">{{ item.qtyPenerimaan ?? '-' }}</td>
                        <td class="px-6 py-4">
                            <div class="flex items-center justify-end gap-2">
                                <button v-if="!item.idPenerimaan" type="button"
                                    class="rounded-md bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                                    @click="$emit('terima', item)">
                                    Terima
                                </button>
                                <button type="button"
                                    class="rounded-md border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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