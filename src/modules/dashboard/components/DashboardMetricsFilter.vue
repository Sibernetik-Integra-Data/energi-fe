<template>
    <div class="metrics-filter">
        <!-- Mode toggle -->
        <div class="metrics-filter__toggle" role="group" aria-label="Mode tampilan">
            <button
                type="button"
                class="metrics-filter__mode-btn"
                :class="{ 'metrics-filter__mode-btn--active': mode === 'monthly' }"
                @click="setMode('monthly')">
                Per Bulan
            </button>
            <button
                type="button"
                class="metrics-filter__mode-btn"
                :class="{ 'metrics-filter__mode-btn--active': mode === 'yearly' }"
                @click="setMode('yearly')">
                1 Tahun Penuh
            </button>
        </div>

        <!-- Year select (always visible) -->
        <div class="metrics-filter__selects">
            <div class="metrics-filter__select-wrap">
                <label class="metrics-filter__label">Tahun</label>
                <select
                    v-model="selectedYear"
                    class="metrics-filter__select"
                    @change="emitFilter">
                    <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
            </div>

            <!-- Month select (only in monthly mode) -->
            <Transition name="metrics-filter-slide">
                <div v-if="mode === 'monthly'" class="metrics-filter__select-wrap">
                    <label class="metrics-filter__label">Bulan</label>
                    <select
                        v-model="selectedMonth"
                        class="metrics-filter__select"
                        @change="emitFilter">
                        <option v-for="(name, idx) in monthNames" :key="idx + 1" :value="idx + 1">
                            {{ name }}
                        </option>
                    </select>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['change'])

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const now = new Date()
const mode = ref('monthly')
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)
const monthNames = MONTH_NAMES

const yearOptions = computed(() => {
    const current = now.getFullYear()
    return Array.from({ length: 5 }, (_, i) => current - i)
})

function setMode(newMode) {
    mode.value = newMode
    emitFilter()
}

function emitFilter() {
    emit('change', {
        mode: mode.value,
        year: selectedYear.value,
        month: selectedMonth.value
    })
}

// Emit initial filter on mount
emitFilter()
</script>

<style scoped>
.metrics-filter {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.metrics-filter__toggle {
    display: flex;
    background: var(--surface-muted);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
}

.metrics-filter__mode-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
}

.metrics-filter__mode-btn--active {
    background: var(--surface);
    color: var(--brand);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.metrics-filter__selects {
    display: flex;
    align-items: center;
    gap: 8px;
}

.metrics-filter__select-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
}

.metrics-filter__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap;
}

.metrics-filter__select {
    appearance: none;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 28px 6px 10px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
}

.metrics-filter__select:hover,
.metrics-filter__select:focus {
    border-color: var(--brand);
}

/* Slide transition for month select */
.metrics-filter-slide-enter-active,
.metrics-filter-slide-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.metrics-filter-slide-enter-from,
.metrics-filter-slide-leave-to {
    opacity: 0;
    transform: translateX(-8px);
    max-width: 0;
}

.metrics-filter-slide-enter-to,
.metrics-filter-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
    max-width: 200px;
}
</style>
