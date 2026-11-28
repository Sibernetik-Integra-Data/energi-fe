<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="flex items-center justify-between mb-4">
            <h3 class="m-0 text-3xl font-bold text-(--text)">{{ t('shipping.workers.title') }}</h3>
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
                    <p class="m-0 text-[10px] text-(--text-muted)">{{ t('shipping.workers.workerId', { id: worker.id }) }}</p>
                </div>
                <div class="text-xs font-bold text-[#0b7396]">{{ t('shipping.workers.bunches', { n: worker.janjang }) }}</div>
                <div class="rounded-xl bg-(--status-done-bg) px-3 py-1 text-xs text-(--status-done-text)">{{ worker.beratKg }} kg</div>
            </div>
        </div>
        <div class="mt-5 flex items-center justify-between text-sm text-(--text)">
            <div class="flex items-center gap-2">
                <span>{{ t('shipping.workers.showing') }}</span>
                <span class="rounded-lg border border-(--border) px-2.5 py-1">10</span>
                <span>{{ t('shipping.workers.ofTotal', { n: workers.length }) }}</span>
            </div>
            <div class="flex items-center gap-3 text-(--brand)">
                <span class="text-(--border-strong)">«</span>
                <span class="text-(--border-strong)">‹</span>
                <span class="w-8 h-8 rounded-lg bg-(--brand) text-white flex items-center justify-center">1</span>
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
    workers: { type: Array, default: () => [] }
})
</script>
