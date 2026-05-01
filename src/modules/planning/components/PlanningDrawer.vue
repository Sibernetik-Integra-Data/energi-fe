<template>
  <!-- Backdrop -->
  <Transition name="backdrop-fade">
    <div v-if="modelValue" class="drawer-backdrop" @click="close" aria-hidden="true"></div>
  </Transition>

  <!-- Drawer panel -->
  <Transition name="drawer-slide">
    <aside v-if="modelValue" class="drawer-panel" role="dialog" aria-modal="true" :aria-label="title">
      <!-- Header -->
      <div class="drawer-header">
        <h2 class="drawer-title">{{ title }}</h2>
        <button type="button" class="drawer-close" aria-label="Tutup" @click="close">
          <BaseIcon name="x" :size="18" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="drawer-tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          role="tab"
          :class="['drawer-tab', { 'drawer-tab--active': activeTab === tab.value }]"
          :aria-selected="activeTab === tab.value"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Form -->
      <form class="drawer-form" @submit.prevent="handleSave">
        <!-- ID Sensus -->
        <div class="drawer-field">
          <label class="drawer-label" for="planning-sensus-id">ID Sensus</label>
          <select id="planning-sensus-id" v-model="form.sensusId" class="drawer-select">
            <option value="" disabled>Pilih Sensus...</option>
            <option v-for="opt in sensusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Aktivitas Kebun -->
        <div class="drawer-field">
          <label class="drawer-label" for="planning-aktivitas">Aktivitas Kebun</label>
          <select id="planning-aktivitas" v-model="form.aktivitas" class="drawer-select">
            <option value="" disabled>Pilih Aktivitas...</option>
            <option v-for="opt in aktifitasOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>

        <!-- Tanggal Mulai & Akhir (side by side) -->
        <div class="drawer-field-row">
          <div class="drawer-field">
            <label class="drawer-label" for="planning-tgl-mulai">Tanggal Mulai</label>
            <input
              id="planning-tgl-mulai"
              type="date"
              v-model="form.startDate"
              class="drawer-input"
            />
          </div>
          <div class="drawer-field">
            <label class="drawer-label" for="planning-tgl-akhir">Tanggal Akhir</label>
            <input
              id="planning-tgl-akhir"
              type="date"
              v-model="form.endDate"
              class="drawer-input"
            />
          </div>
        </div>

        <!-- Alokasi Blok -->
        <div class="drawer-field">
          <label class="drawer-label">Alokasi Blok</label>
          <div class="drawer-block-grid">
            <button
              v-for="blok in blockOptions"
              :key="blok"
              type="button"
              :class="['drawer-block-btn', { 'drawer-block-btn--active': isBlockSelected(blok) }]"
              @click="toggleBlock(blok)"
            >
              {{ blok }}
            </button>
          </div>
          <p v-if="form.selectedBlocks.length > 0" class="drawer-block-count">
            {{ form.selectedBlocks.length }} blok dipilih
          </p>
        </div>

        <!-- Footer -->
        <div class="drawer-footer">
          <button type="submit" class="drawer-save-btn" :disabled="!isFormValid">
            Simpan
          </button>
        </div>
      </form>
    </aside>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import BaseIcon from '../../shared/icon'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Rencana Baru' },
  sensusOptions: { type: Array, default: () => [] },
  aktifitasOptions: { type: Array, default: () => [] },
  blockOptions: { type: Array, default: () => [] },
  editItem: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'save'])

const tabs = [
  { label: 'Sensus Tersedia', value: 'tersedia' },
  { label: 'Sensus Baru', value: 'baru' }
]

const activeTab = ref('tersedia')

const form = ref(createEmptyForm())

function createEmptyForm() {
  return {
    sensusId: '',
    aktivitas: '',
    startDate: '',
    endDate: '',
    selectedBlocks: []
  }
}

// Populate form when editing an item
watch(
  () => props.editItem,
  (item) => {
    if (item) {
      form.value = {
        sensusId: item.sensusId ?? '',
        aktivitas: item.jobType ?? '',
        startDate: item.startDate ?? '',
        endDate: item.endDate ?? '',
        selectedBlocks: Array.isArray(item.blocks)
          ? item.blocks.map(b => `Blok ${b}`)
          : []
      }
    } else {
      form.value = createEmptyForm()
    }
  },
  { immediate: true }
)

// Reset form when drawer closes
watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      activeTab.value = 'tersedia'
      if (!props.editItem) {
        form.value = createEmptyForm()
      }
    }
  }
)

const isFormValid = computed(
  () => form.value.sensusId && form.value.aktivitas && form.value.startDate && form.value.endDate
)

function isBlockSelected(blok) {
  return form.value.selectedBlocks.includes(blok)
}

function toggleBlock(blok) {
  const idx = form.value.selectedBlocks.indexOf(blok)
  if (idx === -1) {
    form.value.selectedBlocks.push(blok)
  } else {
    form.value.selectedBlocks.splice(idx, 1)
  }
}

function close() {
  emit('update:modelValue', false)
}

function handleSave() {
  if (!isFormValid.value) return
  emit('save', { ...form.value })
  close()
}
</script>

<style scoped>
/* ── Backdrop ────────────────────────────────────────────────────────────── */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 40;
}

/* ── Panel ───────────────────────────────────────────────────────────────── */
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -8px 0 32px rgba(2, 6, 23, 0.12);
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.drawer-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-muted);
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.drawer-close:hover {
  color: var(--text);
  background: var(--surface);
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */
.drawer-tabs {
  display: flex;
  padding: 12px 20px 0;
  gap: 4px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.drawer-tab {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  background: none;
  color: var(--text-muted);
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  position: relative;
  bottom: -1px;
  border-bottom: 2px solid transparent;
}

.drawer-tab--active {
  color: var(--brand);
  border-bottom-color: var(--brand);
  background: var(--surface);
}

.drawer-tab:hover:not(.drawer-tab--active) {
  color: var(--text);
  background: var(--surface-muted);
}

/* ── Form ────────────────────────────────────────────────────────────────── */
.drawer-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.drawer-field-row {
  display: flex;
  gap: 12px;
}

.drawer-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.drawer-input,
.drawer-select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}

.drawer-input:focus,
.drawer-select:focus {
  border-color: var(--brand);
}

/* ── Block selection ─────────────────────────────────────────────────────── */
.drawer-block-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.drawer-block-btn {
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface-muted);
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.drawer-block-btn--active {
  background: rgba(251, 140, 0, 0.12);
  color: var(--brand);
  border-color: var(--brand);
}

.drawer-block-btn:hover:not(.drawer-block-btn--active) {
  background: var(--surface);
  color: var(--text);
}

.drawer-block-count {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--brand);
  font-weight: 600;
}

/* ── Footer / Save button ────────────────────────────────────────────────── */
.drawer-footer {
  padding-top: 4px;
}

.drawer-save-btn {
  width: 100%;
  height: 42px;
  background: var(--text);
  color: var(--surface);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.drawer-save-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.drawer-save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Transitions ─────────────────────────────────────────────────────────── */
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
