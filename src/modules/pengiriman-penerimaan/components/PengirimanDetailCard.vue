<template>
    <section class="rounded-xl bg-(--surface) border border-(--border) p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
            <div>
                <h2 class="m-0 text-3xl font-bold text-(--text)">{{ t('shipping.trip.title') }}</h2>
                <p class="m-0 mt-1 text-sm text-(--text-muted)">{{ t('shipping.trip.id', { id: detail.id }) }}</p>
            </div>
            <div class="w-14 h-14 rounded-full bg-[#dce9ff] flex items-center justify-center">
                <BaseIcon name="package" :size="24" class="text-[#4674ba]" />
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">{{ t('shipping.trip.startDate') }}</span>
                <span class="text-(--text)">{{ detail.startTime }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.trip.endDate') }}</span>
                <span class="text-(--text)">{{ detail.endTime }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.fields.origin') }}</span>
                <span class="text-(--text)">{{ detail.originName }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.fields.destination') }}</span>
                <span class="text-(--text)">{{ detail.destinationName }}</span>
            </div>
            <div class="grid grid-cols-[140px_1fr] gap-y-3">
                <span class="text-(--text-muted)">{{ t('shipping.trip.volume') }}</span>
                <span class="text-(--text)">{{ detail.volumeLabel }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.trip.driver') }}</span>
                <span class="text-(--text)">{{ detail.driverName }}</span>
                <span class="text-(--text-muted)">{{ t('shipping.fields.notes') }}</span>
                <span class="text-(--text)">{{ detail.notes }}</span>
            </div>
        </div>
    </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import BaseIcon from '../../shared/icon'

const { t } = useI18n()

defineProps({
    detail: { type: Object, required: true }
})
</script>
