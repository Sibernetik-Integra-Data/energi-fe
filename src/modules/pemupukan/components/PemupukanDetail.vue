<template>
    <div class="flex flex-col gap-5">
        <button
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer w-fit bg-transparent border-0 p-0"
            @click="$emit('back')">
            <span aria-hidden="true">←</span>
            Kembali ke Daftar Pemupukan
        </button>

        <div v-if="loading" class="flex justify-center items-center py-20 text-sm text-(--text-muted)">
            <span class="animate-pulse">Memuat detail&hellip;</span>
        </div>

        <div v-else-if="error" class="flex flex-col items-center justify-center py-16 gap-3 text-sm text-red-600">
            <span class="text-3xl">⚠️</span>
            {{ error }}
        </div>

        <template v-else-if="plan">
            <div class="bg-(--surface) border border-(--border) rounded-2xl p-6 shadow-sm">
                <div class="flex items-start justify-between gap-4 mb-5">
                    <div class="flex items-center gap-3">
                        <span
                            class="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl shrink-0"
                            aria-hidden="true"
                            >🧹</span
                        >
                        <div>
                            <h2 class="text-lg font-extrabold text-(--text) leading-tight m-0">{{ plan.jobType }}</h2>
                            <p class="text-sm text-(--text-muted) mt-0.5 m-0">Sensus {{ plan.sensusId || "—" }}</p>
                        </div>
                    </div>
                    <span
                        :class="statusChipClass(plan.status)"
                        class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full">
                        {{ statusLabel(plan.status) }}
                    </span>
                </div>

                <div class="mb-4" v-if="plan.sensusDateFormatted || plan.sensusDate">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-(--text-muted)"
                        >Tanggal Sensus</span
                    >
                    <span class="text-sm font-semibold text-(--text) ml-2">{{
                        plan.sensusDateFormatted || plan.sensusDate || "—"
                    }}</span>
                </div>

                <div v-if="plan.blocks && plan.blocks.length > 0">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) mb-2">Nomor Petak</p>
                    <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="(block, i) in plan.blocks"
                            :key="i"
                            class="inline-block bg-(--surface-muted) border border-(--border) text-(--text) py-0.5 px-2.5 rounded-full text-xs font-medium"
                            >{{ block }}</span
                        >
                    </div>
                </div>

                <div
                    v-if="plan.startDate || plan.endDate"
                    class="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200">
                    <span class="text-base shrink-0" aria-hidden="true">ℹ️</span>
                    <p class="text-sm font-semibold text-sky-800 m-0">
                        Rencana Pengerjaan :
                        <span class="font-bold">{{ plan.startDate || "—" }}</span>
                        s.d.
                        <span class="font-bold">{{ plan.endDate || "—" }}</span>
                    </p>
                </div>
            </div>

            <div>
                <div class="mb-3">
                    <h3 class="text-base font-extrabold text-(--text) m-0">Realisasi</h3>
                    <p class="text-sm text-(--text-muted) mt-0.5 m-0">
                        Absensi dan laporan dari pekerja untuk setiap kerja.
                    </p>
                </div>

                <div class="mb-4 w-fit min-w-50 bg-(--surface) border border-(--border) rounded-xl px-4 py-3">
                    <p class="text-[10px] uppercase tracking-wide text-(--text-muted) m-0">Total Pekerja Terdaftar</p>
                    <p class="text-2xl font-extrabold text-(--text) m-0 mt-1">{{ effectiveLabors.length }}</p>
                </div>

                <div
                    v-if="laborGroups.length === 0"
                    class="flex flex-col items-center justify-center py-16 gap-3 text-(--text-muted) border border-(--border) rounded-2xl bg-(--surface)">
                    <span class="text-4xl">👷</span>
                    <p class="text-sm font-semibold m-0">Belum ada pekerja ditugaskan.</p>
                </div>

                <div v-else class="flex flex-col gap-3">
                    <div
                        v-for="group in laborGroups"
                        :key="group.key"
                        class="bg-(--surface) border border-(--border) rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            class="w-full px-4 py-3 flex items-center gap-3 text-left bg-transparent border-0 cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            @click="toggleGroup(group.key)">
                            <div class="min-w-0">
                                <p class="text-base font-extrabold text-(--text) m-0">{{ group.label }}</p>
                                <p class="text-xs text-(--text-muted) m-0 mt-0.5">Sensus {{ plan.sensusId || "—" }}</p>
                            </div>

                            <div class="ml-auto flex items-center gap-2 shrink-0">
                                <span
                                    v-if="group.labors.length > 0"
                                    class="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700"
                                    >{{ group.labors.length }} Labors</span
                                >
                                <span
                                    class="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-(--border) text-(--text-muted)"
                                    :class="{ 'rotate-180': expandedGroupKey === group.key }"
                                    aria-hidden="true"
                                    >⌃</span
                                >
                            </div>
                        </button>

                        <div v-if="expandedGroupKey === group.key" class="px-4 pb-4 pt-1 border-t border-(--border)">
                            <div
                                class="grid gap-2"
                                style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
                                <LaborCard
                                    v-for="labor in group.labors"
                                    :key="`${group.key}-${labor.id}`"
                                    :labor="labor"
                                    :plan-id="labor.planId || group.planId"
                                    :plan="plan"
                                    :work-date="group.rawDate" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import LaborCard from "./LaborCard.vue";

const props = defineProps({
    plan: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
});

defineEmits(["back"]);

const effectiveLabors = computed(() => {
    return Array.isArray(props.plan?.labors) ? props.plan.labors : [];
});

const laborGroups = computed(() => {
    const grouped = new Map();

    for (const labor of effectiveLabors.value) {
        const dateValue = getLaborDate(labor, props.plan);
        const planId = labor?.planId || labor?.plan_id || null;
        const key = `${planId || "no-plan"}::${dateValue || "unknown"}`;

        if (!grouped.has(key)) {
            grouped.set(key, {
                key,
                planId,
                rawDate: dateValue,
                label: formatGroupLabel(dateValue, planId),
                sortKey: dateValue || "0000-00-00",
                labors: [],
            });
        }

        const group = grouped.get(key);
        group.labors.push(labor);
    }

    return Array.from(grouped.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
});

const expandedGroupKey = ref("");

watch(
    laborGroups,
    (groups) => {
        if (!groups.length) {
            expandedGroupKey.value = "";
            return;
        }

        const stillExists = groups.some((g) => g.key === expandedGroupKey.value);
        if (!stillExists) expandedGroupKey.value = groups[0].key;
    },
    { immediate: true },
);

function toggleGroup(key) {
    expandedGroupKey.value = expandedGroupKey.value === key ? "" : key;
}

function statusLabel(status) {
    const map = { draft: "Draft", wip: "WIP", done: "Done", submitted: "Submitted", in_progress: "In Progress" };
    return map[status] || status || "—";
}

function statusChipClass(status) {
    const map = {
        draft: "bg-gray-100 text-gray-600",
        wip: "bg-blue-100 text-blue-700",
        done: "bg-green-100 text-green-700",
        submitted: "bg-teal-100 text-teal-700",
        in_progress: "bg-indigo-100 text-indigo-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
}

function getLaborDate(labor, plan) {
    if (!labor) return plan?.startDate || "";

    return (
        labor.workDate ||
        labor.work_date ||
        labor.date ||
        labor.plannedDate ||
        labor.planned_date ||
        labor.targetDate ||
        labor.target_date ||
        plan?.startDate ||
        ""
    );
}

function formatGroupLabel(rawDate, planId) {
    if (!rawDate) return "Tanggal belum ditentukan";

    const dateOnly = String(rawDate).slice(0, 10);
    const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        // return planId ? `Plan #${planId} - ${String(rawDate)}` : String(rawDate);
        return planId ? `${String(rawDate)}` : String(rawDate);
    }

    const dateLabel = `${match[1]} - ${match[2]} - ${match[3]}`;
    return planId ? `${dateLabel}` : dateLabel;
}
</script>

