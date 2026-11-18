<template>
    <form class="rounded-xl bg-(--surface) border border-(--border) p-6" novalidate @submit.prevent="handlePublish">
        <div class="mb-4">
            <h2 class="m-0 text-3xl font-bold text-(--text)">Form Penerimaan</h2>
            <p class="m-0 mt-1 text-sm text-(--text-muted)">
                Nomor penerimaan dibuat otomatis saat disimpan.
                <span v-if="detail.replacesReceiptId">Penerimaan ini menggantikan penerimaan yang dibatalkan.</span>
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">Tanggal Terima <span aria-hidden="true">*</span></span>
                <input v-model="form.tanggalTerima" type="date" required :disabled="saving"
                    class="date-input rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none" />
            </label>

            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">Jenis Panen <span aria-hidden="true">*</span></span>
                <select v-model="form.jenisPanen" required :disabled="saving"
                    class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none hover:cursor-pointer">
                    <option value="" disabled>Pilih jenis panen</option>
                    <option v-for="type in harvestTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
                </select>
            </label>

            <div class="grid grid-cols-[140px_1fr] items-start gap-2">
                <label for="penerimaan-jumlah" class="text-sm font-medium text-(--text) pt-2">
                    Jumlah Terima <span aria-hidden="true">*</span>
                </label>
                <div>
                    <div class="grid grid-cols-[1fr_120px] gap-2">
                        <input id="penerimaan-jumlah" v-model="form.jumlah" type="number" min="0" step="0.001"
                            inputmode="decimal" required :disabled="saving" :placeholder="`Dikirim: ${detail.volumeLabel}`"
                            class="weight-input rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none" />
                        <select v-model="form.unitId" aria-label="Satuan" required :disabled="saving"
                            class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none hover:cursor-pointer">
                            <option v-for="unit in unitOptions" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
                        </select>
                    </div>
                    <p class="m-0 mt-1 text-xs text-(--text-muted)">Dikirim: {{ detail.volumeLabel }}. Paling banyak tiga angka di belakang koma.</p>
                </div>
            </div>

            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">Keterangan</span>
                <textarea v-model="form.keterangan" rows="4" maxlength="1000" placeholder="Ketik disini" :disabled="saving"
                    class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none resize-none"></textarea>
            </label>
        </div>

        <p v-if="errorMessage" role="alert" class="mt-4 text-sm text-red-600">{{ errorMessage }}</p>

        <div class="mt-5 flex items-center justify-end">
            <button type="submit" :disabled="saving"
                class="rounded-3xl bg-(--text) px-4 py-2 text-sm font-medium text-(--surface) opacity-90 hover:opacity-100 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {{ saving ? 'Menyimpan…' : 'Simpan Penerimaan' }}
            </button>
        </div>
    </form>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

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
    const own = props.detail.unitId ? [{ id: props.detail.unitId, name: props.detail.unitName || 'Satuan pengiriman' }] : []
    return props.units.some((unit) => unit.id === props.detail.unitId) ? props.units : [...own, ...props.units]
})

function handlePublish() {
    const raw = String(form.jumlah ?? '').trim()
    const jumlah = Number(raw)
    if (!form.tanggalTerima) {
        errorMessage.value = 'Tanggal terima wajib diisi.'
        return
    }
    if (!raw || !Number.isFinite(jumlah) || jumlah <= 0) {
        errorMessage.value = 'Jumlah terima harus lebih besar dari 0.'
        return
    }
    if (Math.abs(jumlah * 1000 - Math.round(jumlah * 1000)) > 1e-6) {
        errorMessage.value = 'Jumlah terima paling banyak tiga angka di belakang koma.'
        return
    }
    if (!form.jenisPanen) {
        errorMessage.value = 'Jenis panen wajib dipilih.'
        return
    }
    if (!form.unitId) {
        errorMessage.value = 'Satuan wajib dipilih.'
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
