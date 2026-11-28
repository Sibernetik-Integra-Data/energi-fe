<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
            <div>
                <h2 class="m-0 text-3xl font-bold text-(--text)">{{ t('shipping.receipt.title') }}</h2>
                <p class="m-0 mt-1 text-sm text-(--text-muted)">{{ receipt.receiptNo }} · {{ receipt.statusLabel }}</p>
            </div>
            <div class="w-14 h-14 rounded-full bg-(--status-done-bg) flex items-center justify-center text-(--status-done-text) text-xl"
                aria-hidden="true">✓</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">{{ t('shipping.fields.receiptNo') }}</span>
                <span class="text-(--text) font-medium">{{ receipt.receiptNo }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.fields.receivedDate') }}</span>
                <span class="text-(--text)">{{ receipt.receivedDate }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.fields.receivedQuantity') }}</span>
                <span class="text-(--text)">{{ receipt.quantityLabel }}</span>
            </div>
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">{{ t('shipping.fields.harvestType') }}</span>
                <span class="text-(--text)">{{ receipt.harvestLabel }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.receipt.recordedAt') }}</span>
                <span class="text-(--text)">{{ receipt.createdAt }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.fields.notes') }}</span>
                <span class="text-(--text)">{{ receipt.notes }}</span>
            </div>
        </div>

        <div v-if="canCancel" class="mt-5 border-t border-(--border) pt-4">
            <button v-if="!cancelling" type="button" :disabled="saving"
                class="rounded-3xl border border-red-300 bg-transparent px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:cursor-pointer disabled:opacity-50"
                @click="cancelling = true">
                {{ t('shipping.receipt.cancel') }}
            </button>

            <form v-else novalidate @submit.prevent="submitCancel">
                <label for="penerimaan-alasan-batal" class="block text-sm font-medium text-(--text)">
                    {{ t('shipping.receipt.cancelReason') }} <span aria-hidden="true">*</span>
                </label>
                <p class="m-0 mt-1 text-xs text-(--text-muted)">
                    {{ t('shipping.receipt.cancelHint', { no: receipt.receiptNo }) }}
                </p>
                <textarea id="penerimaan-alasan-batal" v-model="reason" rows="3" maxlength="500" :disabled="saving" @input="errorMessage = ''"
                    :placeholder="t('shipping.receipt.cancelPlaceholder')"
                    class="mt-2 w-full rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none resize-none"></textarea>
                <p v-if="errorMessage" role="alert" class="m-0 mt-2 text-sm text-red-600">{{ errorMessage }}</p>
                <div class="mt-3 flex items-center justify-end gap-2">
                    <button type="button" :disabled="saving"
                        class="rounded-3xl border border-(--border-strong) bg-transparent px-4 py-2 text-sm font-medium text-(--text-muted) hover:cursor-pointer"
                        @click="closeCancel">
                        {{ t('shipping.receipt.keep') }}
                    </button>
                    <button type="submit" :disabled="saving"
                        class="rounded-3xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ saving ? t('shipping.receipt.cancelling') : t('shipping.receipt.confirmCancel') }}
                    </button>
                </div>
            </form>
        </div>
    </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
    detail: { type: Object, required: true },
    canCancel: { type: Boolean, default: false },
    saving: { type: Boolean, default: false }
})

const emit = defineEmits(['cancel-receipt'])

const receipt = computed(() => props.detail.receipt)
const cancelling = ref(false)
const reason = ref('')
const errorMessage = ref('')

function closeCancel() {
    cancelling.value = false
    reason.value = ''
    errorMessage.value = ''
}

function submitCancel() {
    const text = reason.value.trim()
    if (!text) {
        errorMessage.value = t('shipping.validation.reasonRequired')
        return
    }
    errorMessage.value = ''
    emit('cancel-receipt', { receiptId: receipt.value.id, reason: text })
}
</script>
