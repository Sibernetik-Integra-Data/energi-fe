<template>
    <!-- Table Section: Pekerja data table -->
    <div class="pekerja-table-wrap">

        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">
            Memuat data&hellip;
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex justify-center items-center py-16 text-sm text-red-500">
            {{ error }}
        </div>

        <!-- Table -->
        <template v-else>
            <table class="pekerja-table">
                <thead>
                    <tr>
                        <th class="pekerja-th whitespace-nowrap">ID Pekerja</th>
                        <th class="pekerja-th">Nama</th>
                        <th class="pekerja-th">Email</th>
                        <th class="pekerja-th whitespace-nowrap">Jabatan</th>
                        <th class="pekerja-th">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="rows.length === 0">
                        <td colspan="5" class="py-10 px-3 text-center text-sm text-(--text-muted)">
                            Tidak ada data.
                        </td>
                    </tr>
                    <tr
                        v-for="row in paginatedRows"
                        :key="row.id"
                        class="pekerja-row">

                        <!-- ID Pekerja: user_id (truncated) -->
                        <td class="pekerja-td whitespace-nowrap">
                            {{ row.user_id ? row.user_id.substring(0, 8) + '…' : '-' }}
                        </td>

                        <!-- Nama: first_name + last_name -->
                        <td class="pekerja-td whitespace-nowrap">
                            {{ row.first_name }} {{ row.last_name }}
                        </td>

                        <!-- Email -->
                        <td class="pekerja-td">
                            {{ row.email || '-' }}
                        </td>

                        <!-- Jabatan: Keycloak role resolved from user_id by the labor API -->
                        <td class="pekerja-td whitespace-nowrap">
                            {{ row.jabatan || '-' }}
                        </td>

                        <!-- Aksi: View button -->
                        <td class="pekerja-td">
                            <button
                                type="button"
                                class="pekerja-btn-view"
                                @click="onView(row)">
                                View
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <MasterDataPagination id="pekerja" :total-items="totalItems" :current-page="currentPage" :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages" @update:current-page="currentPage = $event" @update:page-size="pageSize = $event" />
        </template>
    </div>

    <!-- View Alert Modal (Teleport to body) -->
    <Teleport to="body">
        <div
            v-if="showViewAlert"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @mousedown.self="showViewAlert = false">
            <div class="pekerja-modal">
                <div class="flex items-center gap-3">
                    <div class="bg-orange-100 dark:bg-orange-900/30 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="#fb8c00" stroke-width="2"/>
                            <path d="M12 8v4M12 16h.01" stroke="#fb8c00" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h3 class="text-base font-bold text-(--text) m-0">Informasi</h3>
                </div>
                <p class="text-sm text-(--text-muted) m-0">button view clicked</p>
                <div class="flex justify-end">
                    <button
                        type="button"
                        class="border-0 bg-[#fb8c00] text-white font-semibold text-sm py-2.5 px-6 rounded-lg cursor-pointer hover:bg-[#e67e00] transition-colors"
                        @click="showViewAlert = false">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useListPagination } from '../../../shared/pagination/useListPagination.js'
import MasterDataPagination from '../../../shared/pagination/MasterDataPagination.vue'

const props = defineProps({
    rows: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: null
    }
})

const rowsForPagination = computed(() => props.rows)
const { currentPage, pageSize, totalItems, totalPages, paginatedItems: paginatedRows, visiblePages } = useListPagination(rowsForPagination)

const showViewAlert = ref(false)
const router = useRouter()

function onView(row) {
    if (!row?.user_id) return
    router.push({ path: `/master-data/pekerja/${encodeURIComponent(row.user_id)}` })
}
</script>

<style scoped>
.pekerja-table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
}

.pekerja-table {
    width: 100%;
    border-collapse: collapse;
}

.pekerja-th {
    background: var(--surface-muted);
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.6px;
    text-transform: uppercase;
    padding: 12px 24px 12px 12px;
}

.pekerja-row {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
}

.pekerja-row:last-child {
    border-bottom: none;
}

.pekerja-row:hover {
    background: var(--surface-muted);
}

.pekerja-td {
    padding: 10px 12px;
    vertical-align: middle;
    font-size: 14px;
    font-weight: 500;
    color: var(--table-row-text);
    font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.pekerja-btn-view {
    font-size: 13px;
    font-weight: 600;
    padding: 6px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s;
}

.pekerja-btn-view:hover {
    background: var(--surface-muted);
}

.pekerja-modal {
    background: var(--surface);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    width: 100%;
    max-width: 360px;
    margin: 0 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
