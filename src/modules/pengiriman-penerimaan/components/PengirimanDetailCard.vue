<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
            <div>
                <h2 class="m-0 text-3xl font-bold text-(--text)">Pengiriman</h2>
                <p class="m-0 mt-1 text-sm text-(--text-muted)">Pengiriman {{ detail.idPengiriman }}</p>
            </div>
            <div class="w-14 h-14 rounded-full bg-[#dce9ff] flex items-center justify-center">
                <BaseIcon name="package" :size="24" class="text-[#4674ba]" />
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">Tanggal Pengiriman</span>
                <span class="text-(--text)"> {{ detail.datePengiriman }}</span>
                <span class="text-(--text-muted)">Sensus ID</span>
                <span class="text-(--text)">Sensus {{ detail.sensusId }}</span>
                <span class="text-(--text-muted)">Tujuan</span>
                <span class="text-(--text)">{{ detail.tujuan }}</span>
                <span class="text-(--text-muted)">Berat Pengiriman</span>
                <span class="text-(--text)">{{ detail.qtyPengiriman }}</span>
                <span class="text-(--text-muted)">Jenis Panen</span>
                <span class="text-(--text)">{{ detail.jenisPanen }}</span>
            </div>
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">Kurir</span>
                <span class="text-(--text)">{{ detail.kurir }}</span>
                <span class="text-(--text-muted)">Jenis Kendaraan</span>
                <span class="text-(--text)">{{ detail.jenisKendaraan }}</span>
                <span class="text-(--text-muted)">Nomor Kendaraan</span>
                <span class="text-(--text)">{{ detail.nomorKendaraan }}</span>
            </div>
        </div>
    </section>
</template>

<script setup>
import BaseIcon from '../../shared/icon'

defineProps({
    detail: { type: Object, required: true }
})
</script>
