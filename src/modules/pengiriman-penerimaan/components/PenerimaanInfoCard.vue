<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
            <div>
                <h2 class="m-0 text-3xl font-bold text-(--text)">Penerimaan</h2>
                <p class="m-0 mt-1 text-sm text-(--text-muted)">Pengiriman {{ detail.idPengiriman }}</p>
            </div>
            <div class="w-14 h-14 rounded-full bg-[#e6f3ea] flex items-center justify-center text-[#00842a] text-xl">✓</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">Tanggal Penerimaan</span>
                <span class="text-(--text)">{{ detail.receipt.datePenerimaanLabel }}</span>
                <span class="text-(--text-muted)">Berat Penerimaan</span>
                <span class="text-(--text)">{{ formatWeight(detail.receipt.qtyPenerimaanValue) }}</span>
                <span class="text-(--text-muted)">Jenis Panen</span>
                <span class="text-(--text)">{{ detail.receipt.jenisPanen }}</span>
                <span class="text-(--text-muted)">Notes</span>
                <span class="text-(--text)">{{ detail.receipt.notes || '-' }}</span>
            </div>
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">ID Penerimaan</span>
                <span class="text-(--text)">{{ detail.receipt.idPenerimaan }}</span>
                <span class="text-(--text-muted)">Jenis Kendaraan</span>
                <span class="text-(--text)">{{ detail.jenisKendaraan }}</span>
                <span class="text-(--text-muted)">Nomor Kendaraan</span>
                <span class="text-(--text)">{{ detail.nomorKendaraan }}</span>
            </div>
        </div>
    </section>
</template>

<script setup>
defineProps({
    detail: { type: Object, required: true }
})

function formatWeight(value) {
    return `${Number(value || 0).toLocaleString('id-ID')} kg`
}
</script>
