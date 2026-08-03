<template>
  <div v-if="src" class="protected-image" :class="containerClass">
    <img v-if="resolvedSrc" :src="resolvedSrc" :alt="alt" :class="imageClass" @error="handleError" />
    <span v-else-if="loading" class="protected-image__loading">Memuat gambar…</span>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { signedApiFetchBlob } from '../../api/fetch'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  imageClass: { type: String, default: '' },
  containerClass: { type: String, default: '' }
})

const resolvedSrc = ref('')
const loading = ref(false)
let objectUrl = ''

function cleanup() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

async function resolveImage(value) {
  cleanup()
  resolvedSrc.value = ''
  if (!value) return

  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    resolvedSrc.value = value
    return
  }

  loading.value = true
  try {
    const storagePath = value.startsWith('/storage?') ? value : `/storage?path=${encodeURIComponent(value)}`
    const blob = await signedApiFetchBlob(storagePath)
    objectUrl = URL.createObjectURL(blob)
    resolvedSrc.value = objectUrl
  } catch (error) {
    console.warn('[ProtectedImage] Failed to load image:', error)
  } finally {
    loading.value = false
  }
}

function handleError() {
  resolvedSrc.value = ''
}

watch(() => props.src, resolveImage, { immediate: true })
onBeforeUnmount(cleanup)
</script>

<style scoped>
.protected-image { min-width: 0; min-height: 0; }
.protected-image__loading { color: var(--text-muted); font-size: 12px; }
</style>
