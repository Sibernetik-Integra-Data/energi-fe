<template>
    <section>
        <h2 class="m-0 text-3xl font-semibold text-(--text)">{{ t('shipping.summary.title') }}</h2>
        <div class="mt-3 overflow-x-auto rounded-xl border border-(--border)">
            <table class="min-w-full text-sm">
                <thead class="bg-(--surface-muted) text-(--text-muted) uppercase text-xs tracking-wide">
                    <tr>
                        <th class="px-4 py-3 text-left">{{ t('shipping.summary.field') }}</th>
                        <th class="px-4 py-3 text-left">{{ t('shipping.summary.shipment') }}</th>
                        <th class="px-4 py-3 text-left">{{ t('shipping.summary.receipt') }}</th>
                        <th class="px-4 py-3 text-left">{{ t('shipping.summary.difference') }}</th>
                    </tr>
                </thead>
                <tbody class="bg-(--surface) text-(--text)">
                    <tr class="border-t border-(--border)">
                        <td class="px-4 py-3 font-medium">{{ t('shipping.summary.quantity') }}</td>
                        <td class="px-4 py-3">{{ detail.volumeLabel }}</td>
                        <td class="px-4 py-3">{{ detail.receipt.quantityLabel }}</td>
                        <td class="px-4 py-3">
                            <span v-if="difference === null" class="text-(--text-muted)">
                                {{ t('shipping.summary.unitsDiffer') }}
                            </span>
                            <span v-else class="inline-flex rounded-full px-3 py-1 text-xs"
                                :class="difference < 0 ? 'bg-[#fde9eb] text-[#c81e2d]' : 'bg-[#e6f3ea] text-[#00642a]'">
                                {{ differenceLabel }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatQuantity } from '../model'

const { t } = useI18n()

const props = defineProps({
    detail: { type: Object, required: true }
})

// Compared only when both sides use the same unit: there is no conversion rule.
const difference = computed(() => {
    const receipt = props.detail.receipt
    if (!receipt || receipt.unitId !== props.detail.unitId) return null
    return Math.round((receipt.quantity - props.detail.volumeValue) * 1000) / 1000
})

const differenceLabel = computed(() => {
    const value = difference.value
    if (value === 0) return t('shipping.summary.same')
    const text = formatQuantity(Math.abs(value), props.detail.receipt.unitName)
    return value < 0 ? t('shipping.summary.less', { value: text }) : t('shipping.summary.more', { value: text })
})
</script>
