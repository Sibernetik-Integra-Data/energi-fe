<template>
  <component
    :is="action ? 'button' : 'div'"
    :type="action ? 'button' : undefined"
    class="md-kpi"
    :class="{ 'md-kpi--action': action }"
    :aria-pressed="action ? String(pressed) : undefined"
    @click="action && $emit('select')">
    <span v-if="action && hint" class="md-kpi__hint">{{ hint ?? t('mdui.filter') }}</span>
    <div class="md-kpi__top">
      <span class="md-kpi__ico" :class="`md-tone-${tone}`"><MdIcon :name="icon" /></span>
      {{ label }}
    </div>
    <div class="md-kpi__val">{{ value }}</div>
    <div v-if="sub" class="md-kpi__sub">{{ sub }}</div>
  </component>
</template>

<script setup>
// Kartu KPI. Bila `action`, kartu menjadi tombol (filter cepat) dan memancarkan `select`.
import MdIcon from './MdIcon.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  icon: { type: String, default: 'info' },
  tone: { type: String, default: 'brand' }, // info | success | warning | brand | danger
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  sub: { type: String, default: '' },
  action: { type: Boolean, default: false },
  pressed: { type: Boolean, default: false },
  hint: { type: String, default: undefined }
})
defineEmits(['select'])
</script>
