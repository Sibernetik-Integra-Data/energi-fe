<template>
    <div class="flex min-h-full flex-col">
        <!-- Filters -->
        <div class="mb-5 flex flex-col gap-3">
            <div
                class="grid grid-cols-1 md:grid-cols-3 gap-2 bg-(--surface-muted) border border-(--border) p-2 rounded-xl items-center">
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Cari blok, jenis pekerjaan, atau sensus ID..."
                    class="md:col-span-1 w-full border border-(--border) bg-(--surface) rounded-lg px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-teal-200" />
                <select
                    v-model="statusFilter"
                    class="w-full border border-(--border) bg-(--surface) rounded-lg px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-teal-200 cursor-pointer">
                    <option value="all">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="wip">WIP</option>
                    <option value="done">Done</option>
                    <option value="submitted">Submitted</option>
                </select>
                <select
                    v-model="sortOrder"
                    class="w-full border border-(--border) bg-(--surface) rounded-lg px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-teal-200 cursor-pointer">
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                </select>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-20 text-sm text-(--text-muted)">
            <span class="animate-pulse">Memuat data panen&hellip;</span>
        </div>

        <!-- Empty state -->
        <div
            v-else-if="!loading && items.length === 0"
            class="flex flex-col items-center justify-center py-20 gap-3 text-(--text-muted) border border-(--border) rounded-2xl bg-(--surface)">
            <img :src="emptyJobIcon" alt="" class="h-16 w-auto" aria-hidden="true" />
            <p class="text-sm font-semibold m-0">Tidak ada penugasan panen ditemukan.</p>
            <p class="text-xs text-(--text-muted) m-0">Pastikan data perencanaan panen sudah diisi.</p>
        </div>

        <!-- Card grid (main page) -->
        <div v-else class="flex flex-1 flex-col">
            <AssignmentTable :items="items" task-type="Panen" @view-detail="$emit('view-detail', $event)" />
            <div v-if="false" class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">
                <div
                    v-for="item in items"
                    :key="`${item.id}-${item.detailId || 'none'}`"
                    class="contents">
                    <AssignmentCard :job-type="item.jobType" :group-of-work="item.groupOfWork" :date="item.startDateFormatted" :sensus-ref="`Sensus ${item.sensusId || '—'}`" :blocks="item.blocks" :photo="item.photo" @view-detail="$emit('view-detail', item)" @add-to-plan="$emit('add-to-plan', item)" />
                    <div v-if="false">
                    <div class="p-5 pb-3 flex justify-between items-start gap-3">
                        <div class="min-w-0 flex flex-col gap-1">
                            <div class="flex items-center gap-2">
                                <span
                                    class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0"
                                    aria-hidden="true"
                                    >🌾</span
                                >
                                <div class="min-w-0">
                                    <h3 class="text-sm font-bold text-(--text) leading-snug truncate">
                                        {{ item.jobType }}
                                    </h3>
                                    <p class="text-xs text-(--text-muted) truncate">Sensus {{ item.sensusId || "—" }}</p>
                                </div>
                            </div>
                        </div>
                        <span
                            :class="statusChipClass(item.status)"
                            class="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {{ statusLabel(item.status) }}
                        </span>
                    </div>

                    <div class="border-t border-(--border) mx-5" />

                    <div class="px-5 pt-3 pb-2 flex gap-4 text-xs text-(--text-muted)">
                        <div class="flex flex-col gap-0.5">
                            <span class="font-semibold uppercase tracking-wide text-[10px]">Mulai</span>
                            <span class="text-(--text) font-medium">{{ item.startDateFormatted || "—" }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <span class="font-semibold uppercase tracking-wide text-[10px]">Selesai</span>
                            <span class="text-(--text) font-medium">{{ item.endDateFormatted || "—" }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5 ml-auto">
                            <span class="font-semibold uppercase tracking-wide text-[10px]">Pekerja</span>
                            <span class="text-(--text) font-medium">{{ item.labors.length }} orang</span>
                        </div>
                    </div>

                    <div v-if="item.blocks.length > 0" class="px-5 pb-3">
                        <p class="text-[10px] font-semibold text-(--text-muted) mb-1.5 tracking-wide uppercase">
                            Nomor Petak
                        </p>
                        <div class="flex flex-wrap gap-1.5">
                            <span
                                v-for="(block, i) in item.blocks.slice(0, 5)"
                                :key="i"
                                class="inline-block bg-(--surface-muted) border border-(--border) text-(--text) py-0.5 px-2.5 rounded-full text-xs font-medium"
                                >{{ block }}</span
                            >
                            <span
                                v-if="item.blocks.length > 5"
                                class="inline-block bg-(--surface-muted) border border-(--border) text-(--text-muted) py-0.5 px-2.5 rounded-full text-xs"
                                >+ {{ item.blocks.length - 5 }} more</span
                            >
                        </div>
                    </div>

                    <div class="px-2 pb-2 mt-auto pt-2 flex flex-nowrap items-center gap-2">
                        <button
                            class="h-8 text-xs font-semibold py-0 px-3 rounded-full border border-(--border) bg-transparent text-(--text) hover:bg-(--surface-muted) transition-colors cursor-pointer whitespace-nowrap"
                            @click="$emit('view-detail', item)">
                            Lihat Detail
                        </button>
                        <button
                            type="button"
                            class="h-8 text-xs font-semibold py-0 px-3 rounded-full border-0 bg-(--text) text-(--surface) hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
                            @click="$emit('add-to-plan', item)">
                            + Tambahkan ke Perencanaan
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            <ListPagination
                :total-items="totalItems"
                :current-page="currentPage"
                :page-size="pageSize"
                :total-pages="totalPages"
                :visible-pages="visiblePages"
                @update:current-page="$emit('update:currentPage', $event)"
                @update:page-size="$emit('update:pageSize', $event)"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { ListPagination } from "../../shared/pagination";
import AssignmentCard from "../../shared/AssignmentCard.vue";
import AssignmentTable from "../../shared/AssignmentTable.vue";
import emptyJobIcon from "@/assets/icons/empty_job.svg";

defineProps({
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    totalItems: { type: Number, default: 0 },
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: 10 },
    totalPages: { type: Number, default: 1 },
    visiblePages: { type: Array, default: () => [] },
});

const emit = defineEmits(["view-detail", "add-to-plan", "update:currentPage", "update:pageSize", "filters-change"]);

const searchQuery = ref("");
const statusFilter = ref("all");
const sortOrder = ref("newest");
let searchDebounceTimer = null;

function emitFiltersChange() {
    emit("filters-change", {
        search: searchQuery.value,
        status: statusFilter.value,
        sort: sortOrder.value,
    });
}

watch([statusFilter, sortOrder], () => {
    emitFiltersChange();
});

watch(searchQuery, () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        emitFiltersChange();
    }, 350);
});

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
</script>
