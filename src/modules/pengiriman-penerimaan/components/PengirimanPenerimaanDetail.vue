<template>
    <section class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
            <h1 class="m-0 text-3xl font-semibold text-(--text)">{{ t('shipping.detail.title') }}</h1>
            <button type="button"
                class="inline-flex items-center gap-2 text-sm text-(--brand) hover:opacity-85 bg-transparent border-0 p-0 w-fit hover:cursor-pointer"
                @click="$emit('back')">
                <span aria-hidden="true">↩</span>
                {{ t('shipping.detail.back') }}
            </button>
        </div>
    </section>

    <PengirimanDetailCard :detail="detail" />

    <div v-if="actionError" role="alert"
        class="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
        {{ actionError }}
    </div>

    <template v-if="detail.receipt">
        <PenerimaanInfoCard :detail="detail" :can-cancel="canReceive" :saving="saving"
            @cancel-receipt="$emit('cancel-receipt', $event)" />
        <PenerimaanSummarySection :detail="detail" />
    </template>

    <template v-else>
        <PenerimaanFormCard v-if="canReceive" :key="formKey" :detail="detail" :units="units"
            :harvest-types="harvestTypes" :saving="saving" @publish="$emit('receive', $event)" />
        <section v-else class="rounded-xl bg-(--surface) border border-(--border) p-6">
            <h2 class="m-0 text-xl font-semibold text-(--text)">{{ t('shipping.status.pending') }}</h2>
            <p class="m-0 mt-2 text-sm text-(--text-muted)">
                {{ t('shipping.detail.noReceiptHint') }}
            </p>
        </section>
    </template>

    <section v-if="cancelledHistory.length">
        <h2 class="m-0 text-xl font-semibold text-(--text)">{{ t('shipping.detail.cancelledHistory') }}</h2>
        <div class="mt-3 overflow-x-auto rounded-xl border border-(--border)">
            <table class="min-w-full text-sm">
                <thead class="bg-(--surface-muted) text-(--text-muted) uppercase text-xs tracking-wide">
                    <tr>
                        <th class="px-4 py-3 text-left">{{ t('shipping.fields.receiptNo') }}</th>
                        <th class="px-4 py-3 text-left">{{ t('shipping.fields.receivedDate') }}</th>
                        <th class="px-4 py-3 text-left">{{ t('shipping.summary.quantity') }}</th>
                        <th class="px-4 py-3 text-left">{{ t('shipping.receiptStatus.cancelled') }}</th>
                        <th class="px-4 py-3 text-left">{{ t('shipping.detail.reason') }}</th>
                    </tr>
                </thead>
                <tbody class="bg-(--surface) text-(--text)">
                    <tr v-for="item in cancelledHistory" :key="item.id" class="border-t border-(--border)">
                        <td class="px-4 py-3 font-medium whitespace-nowrap">{{ item.receiptNo }}</td>
                        <td class="px-4 py-3 whitespace-nowrap">{{ item.receivedDate }}</td>
                        <td class="px-4 py-3 whitespace-nowrap">{{ item.quantityLabel }}</td>
                        <td class="px-4 py-3 whitespace-nowrap">{{ item.cancelledAt }}</td>
                        <td class="px-4 py-3">{{ item.cancelReason }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PengirimanDetailCard from './PengirimanDetailCard.vue'
import PenerimaanInfoCard from './PenerimaanInfoCard.vue'
import PenerimaanSummarySection from './PenerimaanSummarySection.vue'
import PenerimaanFormCard from './PenerimaanFormCard.vue'

const { t } = useI18n()

const props = defineProps({
    detail: { type: Object, required: true },
    canReceive: { type: Boolean, default: false },
    units: { type: Array, default: () => [] },
    harvestTypes: { type: Array, default: () => [] },
    saving: { type: Boolean, default: false },
    actionError: { type: String, default: '' }
})

defineEmits(['back', 'receive', 'cancel-receipt'])

const cancelledHistory = computed(() => props.detail.history.filter((item) => item.status === 'cancelled'))
// A fresh form for each trip and after each cancellation.
const formKey = computed(() => `${props.detail.id}-${props.detail.history.length}`)
</script>
