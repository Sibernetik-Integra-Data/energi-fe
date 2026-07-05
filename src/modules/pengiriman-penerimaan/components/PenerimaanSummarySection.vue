<template>
    <section>
        <h2 class="m-0 text-3xl font-semibold text-(--text)">Summary</h2>
        <div class="mt-3 overflow-hidden rounded-xl border border-(--border)">
            <table class="min-w-full text-sm">
                <thead class="bg-(--surface-muted) text-(--text-muted) uppercase text-xs tracking-wide">
                    <tr>
                        <th class="px-4 py-3 text-left">Field</th>
                        <th class="px-4 py-3 text-left">Pengiriman</th>
                        <th class="px-4 py-3 text-left">Penerimaan</th>
                        <th class="px-4 py-3 text-left">Perbedaan</th>
                    </tr>
                </thead>
                <tbody class="bg-(--surface) text-(--text)">
                    <tr class="border-t border-(--border)">
                        <td class="px-4 py-3 font-medium">Berat (Kg)</td>
                        <td class="px-4 py-3">{{ formatWeight(detail.qtyPengirimanValue) }}</td>
                        <td class="px-4 py-3">{{ formatWeight(detail.receipt.qtyPenerimaanValue) }}</td>
                        <td class="px-4 py-3">
                            <span class="inline-flex rounded-full px-3 py-1 text-xs"
                                :class="differenceWeight < 0 ? 'bg-[#fde9eb] text-[#ed2637]' : 'bg-[#e6f3ea] text-[#00842a]'">
                                {{ differenceWeight > 0 ? '+' : '' }}{{ differenceWeight }} kg
                            </span>
                        </td>
                    </tr>
                    <tr class="border-t border-(--border)">
                        <td class="px-4 py-3 font-medium">Jenis Panen</td>
                        <td class="px-4 py-3">{{ detail.jenisPanen }}</td>
                        <td class="px-4 py-3">{{ detail.receipt.jenisPanen }}</td>
                        <td class="px-4 py-3">-</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    detail: { type: Object, required: true }
})

const differenceWeight = computed(() => {
    return Number(props.detail.receipt.qtyPenerimaanValue || 0) - Number(props.detail.qtyPengirimanValue || 0)
})

function formatWeight(value) {
    return `${Number(value || 0).toLocaleString('id-ID')} kg`
}
</script>
