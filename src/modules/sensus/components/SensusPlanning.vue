<template>
    <div class="flex flex-col gap-4">
        <!-- Toolbar -->
        <div class="flex items-center gap-3">
            <PlanningDateRangePicker v-model="dateRange" />
        </div>

        <!-- Main panel -->
        <div class="bg-(--surface) border border-(--border) rounded-xl overflow-hidden shadow-sm">
            <div class="flex min-h-105">

                <!-- Left: Job Types list (220px) -->
                <div class="shrink-0 border-r border-(--border)" style="width: 220px">
                    <div class="flex items-center justify-between px-4 border-b border-(--border)" style="height: 68px">
                        <span class="text-xs font-extrabold text-(--text-muted) uppercase tracking-widest">Job Types</span>
                    </div>

                    <div class="px-4 py-3 border-b border-(--border) flex items-center" style="height: 70px">
                        <button
                            @click="$emit('add-plan')"
                            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-(--text) text-(--surface) text-sm font-semibold hover:opacity-80 transition-opacity cursor-pointer border-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Rencana
                        </button>
                    </div>

                    <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-16 px-4 gap-2 text-(--text-muted)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p class="text-xs text-center font-medium">Belum ada rencana.<br>Tekan "+ Tambah Rencana"</p>
                    </div>

                    <div v-else class="divide-y divide-(--border)">
                        <div
                            v-for="plan in items"
                            :key="plan.id"
                            class="flex items-center px-4 gap-3 group cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            style="height: 70px"
                            @click="$emit('view-plan', plan)"
                            @mouseenter="handlePlanHoverStart($event, plan)"
                            @mouseleave="handlePlanHoverEnd"
                        >
                            <div class="shrink-0 w-1 rounded-full self-stretch my-3" :style="{ backgroundColor: jobColor(plan.jobType).bar }"></div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold text-(--text) truncate">{{ plan.jobType }}</div>
                                <div class="text-xs text-(--text-muted) truncate mt-0.5">{{ plan.sensusId || '-' }}</div>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    <template v-if="plan.blocks.slice(0,3).length">
                                        <span
                                            v-for="b in plan.blocks.slice(0,3)"
                                            :key="b"
                                            class="inline-block text-xs rounded px-1.5 py-0.5 font-medium"
                                            :style="{ backgroundColor: jobColor(plan.jobType).chipBg, color: jobColor(plan.jobType).chipText }"
                                        >{{ b }}</span>
                                        <span v-if="plan.blocks.length > 3" class="inline-block text-xs rounded px-1.5 py-0.5 font-medium text-(--text-muted) bg-(--surface-muted)">+{{ plan.blocks.length - 3 }} more</span>
                                    </template>
                                </div>
                            </div>
                            <button
                                @click.stop="openDeleteConfirm(plan)"
                                class="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-(--text-muted) hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-0 bg-transparent"
                                aria-label="Hapus rencana"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right: Gantt calendar -->
                    <div class="flex-1 min-w-0 overflow-x-auto" ref="ganttRef">
                        <div :style="{ width: '100%', minWidth: innerWidth + 'px' }">

                        <!-- Date header -->
                        <div class="flex border-b border-(--border) sticky top-0 z-10 bg-(--surface)" style="height: 68px">
                            <div
                                    v-for="day in days"
                                    :key="day.iso"
                                    class="shrink-0 flex flex-col items-center justify-center text-xs font-semibold gap-0.5 border-r border-(--border)"
                                    :class="day.isToday ? 'text-blue-500' : 'text-(--text-muted)'"
                                    :style="{ width: dayWidthComputed + 'px', boxSizing: 'border-box' }"
                                >
                                <span class="text-sm font-bold" :class="day.isToday ? 'text-blue-600' : 'text-(--text)'">{{ day.num }}</span>
                                <span class="text-[10px] uppercase tracking-wide">{{ day.abbr }}</span>
                            </div>
                        </div>

                        <!-- Empty spacer row aligned with the add button row -->
                        <div class="relative border-b border-(--border)" style="height: 70px">
                            <div class="absolute inset-0 pointer-events-none flex">
                                <div
                                    v-for="day in days"
                                    :key="'spacer-col-' + day.iso"
                                    class="shrink-0 border-r border-(--border)"
                                    :class="day.isWeekend ? 'bg-(--surface-muted) opacity-60' : ''"
                                    :style="{ width: dayWidthComputed + 'px', boxSizing: 'border-box' }"
                                ></div>
                            </div>
                        </div>

                        <!-- Gantt content area -->
                        <div class="relative">

                            <!-- Column separators (Sensus-style repeated divs) -->
                            <div class="absolute inset-0 pointer-events-none flex" style="top:0;">
                                <div
                                    v-for="day in days"
                                    :key="'col-' + day.iso"
                                    class="shrink-0 border-r border-(--border)"
                                    :class="day.isWeekend ? 'bg-(--surface-muted) opacity-60' : ''"
                                    :style="{ width: dayWidthComputed + 'px', boxSizing: 'border-box' }"
                                ></div>
                            </div>

                            <div v-if="todayIndex >= 0" class="absolute top-0 bottom-0 z-10 pointer-events-none" :style="todayColStyle"></div>
                            <div v-if="todayIndex >= 0" class="absolute top-0 bottom-0 z-10 pointer-events-none" :style="todayLineStyle"></div>

                            <!-- Empty state -->
                            <div v-if="items.length === 0" class="relative flex items-center justify-center z-20" style="height: 200px">
                                <p class="text-xs text-(--text-muted)">Belum ada rencana.</p>
                            </div>

                            <!-- Bars -->
                            <template v-else>
                                <div v-for="(item, idx) in items" :key="'bar-' + item.id" class="relative z-20" style="height: 70px">
                                    <div v-if="barVisible(item)" class="absolute top-1/2 -translate-y-1/2 rounded-lg flex items-center px-3 text-xs font-semibold truncate shadow-sm" style="height:38px" :style="[barStyle(item), { backgroundColor: jobColor(item.jobType).bar, color: '#fff' }]">
                                        {{ item.jobType }} · {{ item.blocks.length }} block{{ item.blocks.length !== 1 ? 's' : '' }}
                                    </div>
                                </div>
                            </template>

                        </div>
                    </div>
                </div>

            </div>
        </div>

        <Teleport to="body">
            <div
                v-if="showDeleteConfirm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-plan-title"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                @mousedown.self="cancelDelete"
            >
                <div class="bg-(--surface) border border-(--border) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
                    <h3 id="delete-plan-title" class="text-base font-bold text-(--text) m-0">Hapus Rencana</h3>
                    <p class="text-sm text-(--text-muted) m-0">
                        Apakah Anda yakin ingin menghapus rencana
                        <strong class="text-(--text)">{{ deletingPlan?.jobType || 'ini' }}</strong>?
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div class="flex justify-end gap-3">
                        <button
                            type="button"
                            class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            @click="cancelDelete"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            class="border-0 bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-red-700 transition-colors"
                            @click="confirmDelete"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <Teleport to="body">
            <Transition name="hover-info-fade">
                <div
                    v-if="hoverInfoVisible && hoverInfoPlan"
                    class="fixed z-40 pointer-events-none"
                    :style="hoverInfoStyle"
                >
                    <div class="w-80 max-w-[85vw] border border-(--border) rounded-xl bg-(--surface) shadow-xl p-4">
                        <div class="text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">Job Type</div>
                        <div class="text-sm font-semibold text-(--text) mt-1" style="overflow-wrap:anywhere">{{ hoverInfoPlan.jobType || '-' }}</div>

                        <div class="text-[11px] font-semibold uppercase tracking-wide text-(--text-muted) mt-3">ID Sensus</div>
                        <div class="text-sm text-(--text) mt-1 break-all">{{ hoverInfoPlan.sensusId || '-' }}</div>

                        <div class="text-[11px] font-semibold uppercase tracking-wide text-(--text-muted) mt-3">Type Blocks</div>
                        <div class="text-sm text-(--text) mt-1" style="overflow-wrap:anywhere">{{ hoverInfoBlocks }}</div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import PlanningDateRangePicker from '../../planning/components/PlanningDateRangePicker.vue';

const props = defineProps({
    plans: { type: Array, default: () => [] },
    startDate: { type: String, default: null },
    daysCount: { type: Number, default: 28 },
});

const emit = defineEmits(["add-plan", "remove-plan", "view-plan"]);

// ─── Date range filter ─────────────────────────────────────────────────────
const dateRange = ref({ start: null, end: null });
const showDeleteConfirm = ref(false);
const deletingPlan = ref(null);
const hoverInfoVisible = ref(false);
const hoverInfoPlan = ref(null);
const hoverInfoStyle = ref({ top: '0px', left: '0px', transform: 'translateY(-50%)' });
let hoverInfoTimer = null;

// ─── Constants ─────────────────────────────────────────────────────────────
const COL_WIDTH = 48; // px per day column (match Sensus)
const LEFT_COL_WIDTH = 220; // px for left sticky column

// ─── Date helpers ──────────────────────────────────────────────────────────
function toDateOnly(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

function isoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// expose items alias for compatibility with Planning template
const items = computed(() => props.plans || []);

// ─── Effective days count (overridden by dateRange picker) ─────────────────
const effectiveDaysCount = computed(() => {
    if (dateRange.value.start && dateRange.value.end) {
        const diff = Math.round((toDateOnly(dateRange.value.end) - toDateOnly(dateRange.value.start)) / 86400000);
        return Math.max(1, diff + 1);
    }
    return props.daysCount;
});

// ─── Range start ───────────────────────────────────────────────────────────
const rangeStart = computed(() => {
    if (dateRange.value.start) return toDateOnly(dateRange.value.start);
    if (props.startDate) return toDateOnly(props.startDate);
    const today = new Date();
    today.setDate(today.getDate() - 10);
    today.setHours(0, 0, 0, 0);
    return today;
});

// ─── Days array ────────────────────────────────────────────────────────────
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const days = computed(() => {
    const today = isoDate(new Date());
    return Array.from({ length: effectiveDaysCount.value }, (_, i) => {
        const d = addDays(rangeStart.value, i);
        return {
            iso: isoDate(d),
            num: d.getDate(),
            abbr: DAY_ABBR[d.getDay()],
            isToday: isoDate(d) === today,
            isWeekend: d.getDay() === 0 || d.getDay() === 6,
        };
    });
});

// ─── Gantt sizing (fixed base width but expand to fill container when available)
const ganttRef = ref(null)
const containerWidth = ref(0)

function measureContainer() {
    if (!ganttRef.value) return
    containerWidth.value = Math.floor(ganttRef.value.clientWidth || 0)
}

onMounted(() => {
    nextTick(measureContainer)
    window.addEventListener('resize', measureContainer)
})
onUnmounted(() => window.removeEventListener('resize', measureContainer))
onUnmounted(() => {
    if (hoverInfoTimer) {
        clearTimeout(hoverInfoTimer);
        hoverInfoTimer = null;
    }
})

watch(days, () => nextTick(measureContainer))

const timelineWidth = computed(() => effectiveDaysCount.value * COL_WIDTH)
const dayWidthComputed = computed(() => {
    const avail = containerWidth.value || 0
    if (avail > timelineWidth.value) return Math.max(COL_WIDTH, avail / Math.max(1, days.value.length))
    return COL_WIDTH
})

const innerWidth = computed(() => Math.max(timelineWidth.value, (days.value.length * dayWidthComputed.value)))

// ─── Today helpers ─────────────────────────────────────────────────────────
const todayIndex = computed(() => days.value.findIndex((d) => d.isToday));

const todayColStyle = computed(() => {
    if (todayIndex.value < 0) return { left: '-9999px', width: `${dayWidthComputed.value}px` }
    return { left: `${todayIndex.value * dayWidthComputed.value}px`, width: `${dayWidthComputed.value}px` }
})

const todayLineStyle = computed(() => {
    if (todayIndex.value < 0) return { left: '-9999px' }
    return { left: `${todayIndex.value * dayWidthComputed.value + Math.floor(dayWidthComputed.value / 2)}px` }
})

// ─── Bar helpers ───────────────────────────────────────────────────────────
function dayOffset(dateStr) {
    return Math.floor((toDateOnly(dateStr) - rangeStart.value) / 86_400_000);
}

function barVisible(item) {
    const s = dayOffset(item.startDate);
    const e = dayOffset(item.endDate);
    return e >= 0 && s < effectiveDaysCount.value;
}

function barStyle(item) {
    const PAD = 6;
    const startOff = Math.max(dayOffset(item.startDate), 0);
    const endOff = Math.min(dayOffset(item.endDate), effectiveDaysCount.value - 1);
    const left = startOff * dayWidthComputed.value + PAD;
    const width = Math.max((endOff - startOff + 1) * dayWidthComputed.value - PAD * 2, 24);
    return { left: `${left}px`, width: `${width}px`, position: 'absolute' };
}

const hoverInfoBlocks = computed(() => {
    const blocks = hoverInfoPlan.value?.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) return '-';
    return blocks.join(', ');
});

function handlePlanHoverStart(event, plan) {
    if (hoverInfoTimer) clearTimeout(hoverInfoTimer);
    hoverInfoVisible.value = false;
    hoverInfoPlan.value = null;

    const rowRect = event.currentTarget?.getBoundingClientRect?.();
    hoverInfoTimer = setTimeout(() => {
        if (!rowRect) return;
        const panelWidth = Math.min(320, Math.floor(window.innerWidth * 0.85));
        let left = rowRect.right + 12;
        if (left + panelWidth > window.innerWidth - 12) {
            left = Math.max(12, rowRect.left - panelWidth - 12);
        }
        const top = Math.min(window.innerHeight - 12, Math.max(12, rowRect.top + rowRect.height / 2));
        hoverInfoStyle.value = {
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translateY(-50%)'
        };
        hoverInfoPlan.value = plan;
        hoverInfoVisible.value = true;
        hoverInfoTimer = null;
    }, 1000);
}

function handlePlanHoverEnd() {
    if (hoverInfoTimer) {
        clearTimeout(hoverInfoTimer);
        hoverInfoTimer = null;
    }
    hoverInfoVisible.value = false;
    hoverInfoPlan.value = null;
}

function openDeleteConfirm(plan) {
    deletingPlan.value = plan;
    showDeleteConfirm.value = true;
}

function cancelDelete() {
    showDeleteConfirm.value = false;
    deletingPlan.value = null;
}

function confirmDelete() {
    if (!deletingPlan.value?.id) {
        cancelDelete();
        return;
    }
    emit('remove-plan', deletingPlan.value.id);
    cancelDelete();
}

// ─── Job type color palette ────────────────────────────────────────────────
const PALETTE = [
    { bar: "#5b7fa6", chipBg: "rgba(91,127,166,0.15)", chipText: "#3a5a80" },
    { bar: "#5f9e72", chipBg: "rgba(95,158,114,0.15)", chipText: "#2e6641" },
    { bar: "#c97c44", chipBg: "rgba(201,124,68,0.15)", chipText: "#8b4a15" },
    { bar: "#8b6bca", chipBg: "rgba(139,107,202,0.15)", chipText: "#5a2d90" },
    { bar: "#ca9a3a", chipBg: "rgba(202,154,58,0.15)", chipText: "#8a5e10" },
    { bar: "#4fa8a0", chipBg: "rgba(79,168,160,0.15)", chipText: "#1e5e5a" },
];

function jobColor(jobType) {
    if (!jobType) return PALETTE[0];
    let hash = 0;
    for (const ch of jobType) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
    return PALETTE[Math.abs(hash) % PALETTE.length];
}
</script>

<style scoped>
.hover-info-fade-enter-active,
.hover-info-fade-leave-active {
    transition: opacity 0.2s ease;
}

.hover-info-fade-enter-from,
.hover-info-fade-leave-to {
    opacity: 0;
}
</style>
