<template>
    <div class="flex items-center justify-between rounded-xl border border-(--border) bg-(--surface) p-5">
        <div>
            <p class="text-sm text-(--text-muted)">{{ label }}</p>
            <p class="mt-2 text-2xl font-semibold text-(--text)">
                {{ formattedValue }} <span v-if="unit">{{ unit }}</span>
            </p>
        </div>
        <div :class="['flex h-11 w-11 items-center justify-center rounded-full', iconBgClass]">
            <slot name="icon" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    unit: { type: String, default: '' },
    iconBgClass: { type: String, default: 'bg-gray-900' },
})

const formattedValue = computed(() => {
    if (typeof props.value === 'number') {
        return props.value.toLocaleString('id-ID')
    }
    return props.value
})
</script>