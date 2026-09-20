<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
            <div>
                <h2 class="m-0 text-3xl font-bold text-(--text)">Trip Pengiriman</h2>
                <p class="m-0 mt-1 text-sm text-(--text-muted)">Trip {{ detail.id }}</p>
            </div>
            <div class="w-14 h-14 rounded-full bg-[#dce9ff] flex items-center justify-center">
                <BaseIcon name="package" :size="24" class="text-[#4674ba]" />
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">Tanggal Mulai</span>
                <span class="text-(--text)">{{ detail.startTime }}</span>
                <span class="text-(--text-muted)">Tanggal Selesai</span>
                <span class="text-(--text)">{{ detail.endTime }}</span>
                <span class="text-(--text-muted)">Asal</span>
                <span class="text-(--text)">{{ detail.originName }}</span>
                <span class="text-(--text-muted)">Tujuan</span>
                <span class="text-(--text)">{{ detail.destinationName }}</span>
            </div>
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">Volume</span>
                <span class="text-(--text)">{{ detail.volumeLabel }}</span>
                <span class="text-(--text-muted)">Driver</span>
                <span class="text-(--text)">{{ detail.driverName }}</span>
                <span class="text-(--text-muted)">Catatan</span>
                <span class="text-(--text)">{{ detail.notes }}</span>
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
