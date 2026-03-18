<template>
  <div>
    <h2 class="text-xl font-semibold">Example Module</h2>
    <div class="mt-4">
      <button class="inline-block px-3 py-1 bg-blue-600 text-white rounded" @click="refresh">Load from API</button>
    </div>
    <ul class="mt-4 list-disc pl-5">
      <li v-for="(it, idx) in items" :key="idx">{{ it }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ controller: { type: Object, required: true } })
const items = ref([])

async function refresh() {
  try {
    const data = await props.controller.load()
    items.value = data
  } catch (err) {
    // minimal error handling
    console.error('Failed to load', err)
  }
}

// Try load once on mount
refresh()
</script>

<!-- no scoped styles needed -->
