<template>
    <section class="flex justify-between gap-6 items-end max-[920px]:flex-col max-[920px]:items-start shrink-0">
        <div>
            <h1 class="m-0 text-[clamp(24px,2.5vw,36px)] font-extrabold leading-tight tracking-[-0.04em]">
                {{ intro.title }}
            </h1>
            <p class="mt-2 max-w-130 text-(--text-muted) text-sm leading-relaxed">{{ intro.description }}</p>
        </div>
        <!-- <button type="button"
            class="inline-flex items-center gap-2 rounded-3xl bg-[#4d4d4d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3f3f3f]"
            @click="$emit('tambah-penerimaan')">
            <span class="text-base leading-none">+</span>
            Tambah Penerimaan
        </button> -->
    </section>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PengirimanPenerimanCard label="Total Pengiriman" :value="summary.totalPengiriman" unit="Kg"
            icon-bg-class="bg-[#4674ba]">
            <template #icon>
                <BaseIcon name="package" :size="20" class="text-white" />
            </template>
        </PengirimanPenerimanCard>
        <PengirimanPenerimanCard label="Total Penerimaan" :value="summary.totalPenerimaan" unit="Kg"
            icon-bg-class="bg-[#b8a44c]">
            <template #icon>
                <BaseIcon name="location" :size="20" class="text-white" />
            </template>
        </PengirimanPenerimanCard>
    </div>

    <PengirimanPenerimaanList :items="items" @terima="$emit('terima', $event)" @view="$emit('view', $event)" />
</template>

<script setup>
import BaseIcon from '../../shared/icon'
import PengirimanPenerimanCard from './PengirimanPenerimanCard.vue'
import PengirimanPenerimaanList from './PengirimanPenerimaanList.vue'

defineProps({
    intro: { type: Object, required: true },
    summary: { type: Object, required: true },
    items: { type: Array, default: () => [] }
})

defineEmits(['tambah-penerimaan', 'terima', 'view'])
</script>
