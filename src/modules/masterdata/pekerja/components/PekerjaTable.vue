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
                        <th v-if="canViewProfiles" class="pekerja-th">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="rows.length === 0">
                        <td :colspan="canViewProfiles ? 5 : 4" class="py-10 px-3 text-center text-sm text-(--text-muted)">
                            Tidak ada data.
                        </td>
                    </tr>
                    <tr
                        v-for="row in paginatedRows"
                        :key="row.user_id"
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
                        <td v-if="canViewProfiles" class="pekerja-td">
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
            <div class="pekerja-pagination">
                <MasterDataPagination id="pekerja" :total-items="totalItems" :current-page="currentPage" :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages" @update:current-page="currentPage = $event" @update:page-size="pageSize = $event" />
            </div>
        </template>
    </div>

</template>

<script setup>
import { computed } from 'vue'
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
    },
    canViewProfiles: {
        type: Boolean,
        default: false
    }
})

const rowsForPagination = computed(() => props.rows)
const { currentPage, pageSize, totalItems, totalPages, paginatedItems: paginatedRows, visiblePages } = useListPagination(rowsForPagination)

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

.pekerja-pagination {
    padding: 0 16px 16px;
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

</style>
