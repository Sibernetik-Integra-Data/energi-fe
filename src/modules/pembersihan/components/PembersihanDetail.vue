<template>
    <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1">
            <h1 class="m-0 text-2xl font-semibold leading-8 tracking-tight text-(--text)">Detail Penugasan</h1>
            <button
                class="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 transition-colors cursor-pointer w-fit bg-transparent border-0 p-0"
                @click="$emit('back')">
                <span aria-hidden="true">←</span>
                Kembali ke halaman sebelumnya
            </button>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20 text-sm text-(--text-muted)">
            <span class="animate-pulse">Memuat detail&hellip;</span>
        </div>

        <div v-else-if="error" class="flex flex-col items-center justify-center py-16 gap-3 text-sm text-red-600">
            <span class="text-3xl">⚠️</span>
            {{ error }}
        </div>

        <template v-else-if="plan">
            <div class="bg-(--surface) rounded-xl p-6 flex flex-col gap-6">
                <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0">
                        <div>
                        <h2 class="text-xl font-bold text-(--text) leading-5 m-0 truncate">{{ plan.jobType }}</h2>
                            <p class="text-sm text-(--text-muted) mt-1 m-0">Sensus {{ plan.sensusId || "—" }}</p>
                        </div>
                    </div>
                    <img :src="taskIcon" alt="Ikon pembersihan" class="w-14 h-14 shrink-0" />
                </div>

                <div class="flex items-start gap-2 font-inter" v-if="plan.sensusDateFormatted || plan.sensusDate">
                    <span class="w-25 shrink-0 text-xs leading-5 text-(--text-muted)">Tanggal Sensus</span>
                    <span class="text-sm leading-5 text-(--text)">{{
                        plan.sensusDateFormatted || plan.sensusDate || "—"
                    }}</span>
                </div>

                <div v-if="plan.blocks && plan.blocks.length > 0" class="flex items-start gap-2">
                    <p class="w-25 shrink-0 text-xs leading-4 text-(--text-muted) m-0 pt-1">Nomor Petak</p>
                    <div class="flex flex-wrap gap-2">
                        <span
                            v-for="(block, i) in plan.blocks"
                            :key="i"
                            class="inline-flex items-center bg-(--surface-muted) text-(--text) py-1 px-2 rounded-xl text-xs font-medium leading-4"
                            >{{ block }}</span
                        >
                    </div>
                </div>

                <ProtectedImage v-if="plan.photo" :src="plan.photo" alt="Foto pembersihan" container-class="mt-4 rounded-xl overflow-hidden bg-(--surface-muted)" image-class="w-full max-h-72 object-cover" />

                <div class="flex items-start gap-3 px-4 py-4 rounded-xl bg-[#caeaff] border border-[#18a0fb] text-[#121314]">
                    <img :src="infoIcon" alt="" aria-hidden="true" class="w-6 h-6 shrink-0" />
                    <p v-if="plan.planningStartDate || plan.planningEndDate" class="text-sm leading-5 m-0">
                        Rencana Pengerjaan :
                        <span class="font-bold">{{ plan.planningStartDate || "—" }}</span>
                        s.d.
                        <span class="font-bold">{{ plan.planningEndDate || "—" }}</span>
                    </p>
                    <p v-else class="text-sm leading-5 m-0">Rencana Pengerjaan : <span class="font-bold">Belum Ada Planning</span></p>
                </div>
            </div>

            <div>
                <div class="mb-3">
                    <h3 class="text-base font-extrabold text-(--text) m-0">Realisasi</h3>
                    <p class="text-sm text-(--text-muted) mt-0.5 m-0">
                        Absensi dan laporan dari pekerja untuk setiap kerja.
                    </p>
                </div>

                <div class="mb-4 w-full max-w-[272px] h-[142px] bg-(--surface) border border-(--border) rounded-[14px] p-[25px] flex items-start justify-between">
                    <div class="h-[92px] flex flex-col justify-between min-w-0">
                        <p class="text-sm leading-5 text-(--text-muted) m-0 max-w-[146px]">Total Pekerja Terdaftar</p>
                        <p class="text-[30px] leading-9 font-semibold tracking-[0.4px] text-(--text) m-0">{{ effectiveLabors.length }}</p>
                    </div>
                    <span class="w-14 h-14 rounded-[24px] bg-[#b8a44c] p-[10px] flex items-center justify-center shrink-0">
                        <img :src="metricUsersIcon" alt="" class="w-[34px] h-[34px]" />
                    </span>
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
                        class="bg-(--surface) rounded-xl p-6">
                        <button
                            type="button"
                            class="w-full mb-6 flex items-center gap-3 text-left bg-transparent border-0 p-0 cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            @click="toggleGroup(group.key)">
                            <div class="min-w-0">
                                <p class="text-xl font-bold text-(--text) m-0">{{ group.label }}</p>
                                <p class="text-sm text-(--text-muted) m-0 mt-1">Sensus {{ plan.sensusId || "—" }}</p>
                            </div>

                            <div class="ml-auto flex items-center gap-2 shrink-0">
                                <span
                                    v-if="group.labors.length > 0"
                                    class="inline-flex items-center text-sm px-2 py-1 rounded-full bg-[#e6f3ea] text-[#00842a]"
                                    >{{ group.labors.length }} Labors</span
                                >
                                <span
                                    class="inline-flex items-center justify-center w-10 h-10 rounded-lg text-(--text-muted)"
                                    :class="{ 'rotate-180': expandedGroupKeys.has(group.key) }"
                                    aria-hidden="true"
                                    ><img :src="chevronUpIcon" alt="" class="w-5 h-5" /></span
                                >
                            </div>
                        </button>

                        <div v-if="expandedGroupKeys.has(group.key)">
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
import ProtectedImage from "../../shared/ProtectedImage.vue";
import infoIcon from "@/assets/icons/info-square-rounded-filled.svg";
import taskIcon from "@/assets/icons/figma/detail-task.svg";
import metricUsersIcon from "@/assets/icons/figma/metric-users-detail.svg";
import chevronUpIcon from "@/assets/icons/figma/chevron-up.svg";

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

const expandedGroupKeys = ref(new Set());

watch(
    laborGroups,
    (groups) => {
        if (!groups.length) {
            expandedGroupKeys.value = new Set();
            return;
        }

        const validKeys = new Set(
            [...expandedGroupKeys.value].filter((key) => groups.some((group) => group.key === key)),
        );
        if (validKeys.size === 0) validKeys.add(groups[0].key);
        expandedGroupKeys.value = validKeys;
    },
    { immediate: true },
);

function toggleGroup(key) {
    const nextKeys = new Set(expandedGroupKeys.value);
    if (nextKeys.has(key)) nextKeys.delete(key);
    else nextKeys.add(key);
    expandedGroupKeys.value = nextKeys;
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
