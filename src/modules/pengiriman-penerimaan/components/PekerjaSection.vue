<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="flex items-center justify-between mb-4">
            <h3 class="m-0 text-3xl font-bold text-(--text)">Pekerja</h3>
            <button type="button" class="w-12 h-12 rounded-lg border border-(--border) text-(--text-muted) bg-transparent">
                ^
            </button>
        </div>
        <div class="flex flex-col gap-4">
            <div v-for="worker in workers" :key="worker.id"
                class="rounded-2xl border border-(--border-strong) px-3 py-2.5 flex items-center gap-4">
                <div class="w-8 h-8 rounded-full bg-(--surface-muted) flex items-center justify-center text-xs font-semibold text-(--text-muted)">
                    {{ worker.name.split(' ').map((part) => part[0]).join('').slice(0, 2) }}
                </div>
                <div class="flex-1">
                    <p class="m-0 text-sm font-medium text-(--text)">{{ worker.name }}</p>
                    <p class="m-0 text-[10px] text-(--text-muted)">ID Pekerja {{ worker.id }}</p>
                </div>
                <div class="text-xs font-bold text-[#0b7396]">{{ worker.janjang }} Janjang</div>
                <div class="rounded-xl bg-[#e6f3ea] px-3 py-1 text-xs text-[#00842a]">{{ worker.beratKg }} kg</div>
            </div>
        </div>
        <div class="mt-5 flex items-center justify-between text-sm text-(--text)">
            <div class="flex items-center gap-2">
                <span>Showing</span>
                <span class="rounded-lg border border-(--border) px-2.5 py-1">10</span>
                <span>of {{ workers.length }} Data</span>
            </div>
            <div class="flex items-center gap-3 text-[#fb8c00]">
                <span class="text-[#d8d8d9]">«</span>
                <span class="text-[#d8d8d9]">‹</span>
                <span class="w-8 h-8 rounded-lg bg-[#fb8c00] text-white flex items-center justify-center">1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>›</span>
                <span>»</span>
            </div>
        </div>
    </section>
</template>

<script setup>
defineProps({
    workers: { type: Array, default: () => [] }
})
</script>
