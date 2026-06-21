<template>
    <section class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
            <h1 class="m-0 text-3xl font-semibold text-(--text)">Detail</h1>
            <button class="inline-flex items-center gap-2 text-sm text-(--brand) hover:opacity-85 bg-transparent border-0 p-0 w-fit"
                @click="$emit('back')">
                <span aria-hidden="true">↩</span>
                Kembali ke halaman sebelumnya
            </button>
        </div>
        <button v-if="!detail.receipt && !showReceiptForm" type="button"
            class="rounded-3xl bg-(--text) px-4 py-2.5 text-sm font-medium text-(--surface) opacity-90 hover:opacity-100"
            @click="showReceiptForm = true">
            Terima Pengiriman
        </button>
    </section>

    <PengirimanDetailCard :detail="detail" />

    <PenerimaanFormCard v-if="showReceiptForm && !detail.receipt" :generated-receipt-id="generatedReceiptId"
        :initial-jenis-panen="detail.jenisPanen" @cancel="showReceiptForm = false" @publish="handlePublish" />

    <PenerimaanInfoCard v-if="detail.receipt" :detail="detail" />
    <PenerimaanSummarySection v-if="detail.receipt" :detail="detail" />
    <PekerjaSection :workers="detail.workers" />
</template>

<script setup>
import { computed, ref } from 'vue'
import PengirimanDetailCard from './PengirimanDetailCard.vue'
import PenerimaanFormCard from './PenerimaanFormCard.vue'
import PenerimaanInfoCard from './PenerimaanInfoCard.vue'
import PenerimaanSummarySection from './PenerimaanSummarySection.vue'
import PekerjaSection from './PekerjaSection.vue'

const props = defineProps({
    detail: { type: Object, required: true }
})

const emit = defineEmits(['back', 'publish-receipt'])

const showReceiptForm = ref(false)

const generatedReceiptId = computed(() => `ACC${props.detail.idPengiriman}`)

function formatDate(value) {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function handlePublish(payload) {
    showReceiptForm.value = false
    emit('publish-receipt', {
        idPenerimaan: generatedReceiptId.value,
        datePenerimaan: payload.tanggalTerima,
        datePenerimaanLabel: formatDate(payload.tanggalTerima),
        qtyPenerimaanValue: payload.beratTerima,
        jenisPanen: payload.jenisPanen,
        notes: payload.keterangan
    })
}
</script>
