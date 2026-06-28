<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="mb-4">
            <h2 class="m-0 text-3xl font-bold text-(--text)">Form Penerimaan</h2>
            <p class="m-0 mt-1 text-sm text-(--text-muted)">ID Penerimaan {{ generatedReceiptId }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">Tanggal Terima</span>
                <input v-model="form.tanggalTerima" type="date"
                    class="date-input rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none" />
            </label>

            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">Jenis Panen</span>
                <select v-model="form.jenisPanen"
                    class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none hover:cursor-pointer">
                    <option value="" disabled>Pilih jenis panen</option>
                    <option value="TBS">TBS</option>
                    <option value="Loose Fruit">Loose Fruit</option>
                </select>
            </label>

            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">Berat Terima</span>
                <input v-model="form.beratTerima" type="number" min="1" placeholder="Contoh: 1290"
                    class="weight-input rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none" />
            </label>

            <label class="grid grid-cols-[140px_1fr] items-start gap-2">
                <span class="text-sm font-medium text-(--text) pt-2">Keterangan</span>
                <textarea v-model="form.keterangan" rows="4" placeholder="Ketik disini"
                    class="rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2.5 text-sm text-(--text) outline-none resize-none"></textarea>
            </label>
        </div>

        <p v-if="errorMessage" class="mt-4 text-sm text-red-600">{{ errorMessage }}</p>

        <div class="mt-5 flex items-center justify-between">
            <button type="button"
                class="rounded-3xl border border-(--border-strong) bg-transparent px-4 py-2 text-sm font-medium text-(--text-muted)"
                @click="$emit('cancel')">
                Cancel
            </button>
            <button type="button"
                class="rounded-3xl bg-(--text) px-4 py-2 text-sm font-medium text-(--surface) opacity-90 hover:opacity-100 hover:cursor-pointer"
                @click="handlePublish">
                Simpan dan Publish
            </button>
        </div>
    </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
    initialJenisPanen: { type: String, default: '' },
    generatedReceiptId: { type: String, required: true }
})

const emit = defineEmits(['cancel', 'publish'])

const form = reactive({
    tanggalTerima: '',
    beratTerima: '',
    jenisPanen: '',
    keterangan: ''
})
const errorMessage = ref('')

watch(
    () => props.initialJenisPanen,
    () => {
        const now = new Date()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        form.tanggalTerima = `${now.getFullYear()}-${month}-${day}`
        form.beratTerima = ''
        form.jenisPanen = props.initialJenisPanen || ''
        form.keterangan = ''
        errorMessage.value = ''
    },
    { immediate: true }
)

function handlePublish() {
    const beratTerima = Number(form.beratTerima)
    if (!form.tanggalTerima || !form.jenisPanen || !Number.isFinite(beratTerima) || beratTerima <= 0) {
        errorMessage.value = 'Lengkapi tanggal, jenis panen, dan berat terima sebelum publish.'
        return
    }

    errorMessage.value = ''
    emit('publish', {
        tanggalTerima: form.tanggalTerima,
        beratTerima,
        jenisPanen: form.jenisPanen,
        keterangan: form.keterangan
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
