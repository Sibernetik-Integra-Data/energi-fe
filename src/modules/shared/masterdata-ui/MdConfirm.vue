<template>
  <MdModal :open="open" :title="title ?? t('mdui.deleteTitle')" size="sm" alert @close="!busy && $emit('cancel')">
    <template #icon><div class="md-warn-ico"><MdIcon name="trash" /></div></template>
    <template #subtitle><slot /></template>
    <template #footer>
      <div v-if="error" class="md-modal__error" style="flex: 1 1 100%; margin-bottom: 4px" role="alert">{{ error }}</div>
      <button type="button" class="md-btn" :disabled="busy" @click="$emit('cancel')">{{ t('mdui.cancel') }}</button>
      <button type="button" class="md-btn md-btn--danger" :disabled="busy || blocked" @click="$emit('confirm')">
        <MdIcon name="trash" />{{ busy ? t('mdui.deleting') : (confirmLabel ?? t('mdui.confirmDelete')) }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
// Dialog konfirmasi hapus. Isi slot default = kalimat yang menyebut item dan akibatnya.
import MdModal from './MdModal.vue'
import MdIcon from './MdIcon.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: undefined },
  confirmLabel: { type: String, default: undefined },
  busy: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
defineEmits(['confirm', 'cancel'])
</script>
