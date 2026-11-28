<template>
    <form class="rounded-xl bg-(--surface) border border-(--border) p-6" novalidate @submit.prevent="handlePublish">
        <div class="mb-4">
            <h2 class="m-0 text-3xl font-bold text-(--text)">{{ t('shipping.form.title') }}</h2>
            <p class="m-0 mt-1 text-sm text-(--text-muted)">
                {{ t('shipping.form.autoNumber') }}
                <span v-if="detail.replacesReceiptId">{{ t('shipping.form.replaces') }}</span>
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">{{ t('shipping.fields.receivedDate') }} <span aria-hidden="true">*</span></span>
                <input v-model="form.tanggalTerima" type="date" required :disabled="saving"
                    class="date-input rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none" />
            </label>

            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">{{ t('shipping.fields.harvestType') }} <span aria-hidden="true">*</span></span>
                <select v-model="form.jenisPanen" required :disabled="saving"
                    class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none hover:cursor-pointer">
                    <option value="" disabled>{{ t('shipping.form.chooseHarvestType') }}</option>
                    <option v-for="type in harvestTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
                </select>
            </label>

            <div class="grid grid-cols-[140px_1fr] items-start gap-2">
                <label for="penerimaan-jumlah" class="text-sm font-medium text-(--text) pt-2">
                    {{ t('shipping.fields.receivedQuantity') }} <span aria-hidden="true">*</span>
                </label>
                <div>
                    <div class="grid grid-cols-[1fr_120px] gap-2">
                        <input id="penerimaan-jumlah" v-model="form.jumlah" type="number" min="0" step="0.001"
                            inputmode="decimal" required :disabled="saving" :placeholder="t('shipping.form.shippedPlaceholder', { value: detail.volumeLabel })"
                            class="weight-input rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none" />
                        <select v-model="form.unitId" :aria-label="t('shipping.fields.unit')" required :disabled="saving"
                            class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none hover:cursor-pointer">
                            <option v-for="unit in unitOptions" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
                        </select>
                    </div>
                    <p class="m-0 mt-1 text-xs text-(--text-muted)">{{ t('shipping.form.quantityHint', { value: detail.volumeLabel }) }}</p>
                </div>
            </div>

            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">{{ t('shipping.fields.notes') }}</span>
                <textarea v-model="form.keterangan" rows="4" maxlength="1000" :placeholder="t('shipping.form.notesPlaceholder')" :disabled="saving"
                    class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none resize-none"></textarea>
            </label>
        </div>

        <p v-if="errorMessage" role="alert" class="mt-4 text-sm text-red-600">{{ errorMessage }}</p>

        <div class="mt-5 flex items-center justify-end">
            <button type="submit" :disabled="saving"
                class="rounded-3xl bg-(--text) px-4 py-2 text-sm font-medium text-(--surface) opacity-90 hover:opacity-100 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {{ saving ? t('shipping.form.saving') : t('shipping.form.submit') }}
            </button>
        </div>
    </form>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
    detail: { type: Object, required: true },
    units: { type: Array, default: () => [] },
    harvestTypes: { type: Array, default: () => [] },
    saving: { type: Boolean, default: false }
})

const emit = defineEmits(['publish'])

function today() {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

const form = reactive({
    tanggalTerima: today(),
    jumlah: '',
    unitId: props.detail.unitId,
    jenisPanen: '',
    keterangan: ''
})
const errorMessage = ref('')

// The shipment's own unit is always offered, even when the unit list could not be loaded.
const unitOptions = computed(() => {
    const own = props.detail.unitId ? [{ id: props.detail.unitId, name: props.detail.unitName || t('shipping.form.shipmentUnit') }] : []
    return props.units.some((unit) => unit.id === props.detail.unitId) ? props.units : [...own, ...props.units]
})

function handlePublish() {
    const raw = String(form.jumlah ?? '').trim()
    const jumlah = Number(raw)
    if (!form.tanggalTerima) {
        errorMessage.value = t('shipping.validation.dateRequired')
        return
    }
    if (!raw || !Number.isFinite(jumlah) || jumlah <= 0) {
        errorMessage.value = t('shipping.validation.quantityPositive')
        return
    }
    if (Math.abs(jumlah * 1000 - Math.round(jumlah * 1000)) > 1e-6) {
        errorMessage.value = t('shipping.validation.quantityDecimals')
        return
    }
    if (!form.jenisPanen) {
        errorMessage.value = t('shipping.validation.harvestTypeRequired')
        return
    }
    if (!form.unitId) {
        errorMessage.value = t('shipping.validation.unitRequired')
        return
    }

    errorMessage.value = ''
    emit('publish', {
        received_date: form.tanggalTerima,
        quantity: jumlah,
        unit_id: Number(form.unitId),
        harvest_type: form.jenisPanen,
        notes: form.keterangan.trim() || null
    })
}
</script>

<style scoped>
.date-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
}

.weight-input::-webkit-inner-spin-button,
.weight-input::-webkit-outer-spin-button {
    cursor: pointer;
}
</style>
