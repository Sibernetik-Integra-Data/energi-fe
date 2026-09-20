<template>
    <section class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
            <h1 class="m-0 text-3xl font-semibold text-(--text)">Detail</h1>
            <button class="inline-flex items-center gap-2 text-sm text-(--brand) hover:opacity-85 bg-transparent border-0 p-0 w-fit hover:cursor-pointer"
                @click="$emit('back')">
                <span aria-hidden="true">↩</span>
                Kembali ke halaman sebelumnya
            </button>
        </div>
    </section>

    <PengirimanDetailCard :detail="detail" />

</template>

<script setup>
import PengirimanDetailCard from './PengirimanDetailCard.vue'

const props = defineProps({
    detail: { type: Object, required: true }
})

defineEmits(['back'])
</script>
