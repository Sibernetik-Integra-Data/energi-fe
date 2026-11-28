<template>
  <div v-if="value != null && value !== ''" class="md-barcell">
    <div class="md-barcell__track"><div class="md-barcell__fill" :style="{ width: `${pct}%` }" /></div>
    <span class="md-num">{{ formatted }}</span>
  </div>
  <span v-else class="md-muted">{{ emptyText ?? t('mdui.notFilled') }}</span>
</template>

<script setup>
// Angka dengan bar proporsi terhadap nilai terbesar di tabel.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentIntlLocale } from '../../../i18n'

const { t, locale } = useI18n()
const props = defineProps({
  value: { type: Number, default: null },
  max: { type: Number, default: 1 },
  emptyText: { type: String, default: undefined }
})
const pct = computed(() => Math.min(100, Math.round(((props.value || 0) / Math.max(1, props.max)) * 100)))
const formatted = computed(() => locale.value && Number(props.value).toLocaleString(currentIntlLocale()))
</script>
