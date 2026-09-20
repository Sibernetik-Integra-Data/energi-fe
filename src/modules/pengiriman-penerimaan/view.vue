<template>
    <div class="h-screen flex bg-transparent max-[920px]:flex-col">
        <BaseSidebar :items="navigation" :user="user" />

        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <BaseHeader eyebrow="Pengiriman & Penerimaan" :title="header.title" :notifications="header.notifications"
                :user="user" :on-logout="logoutFromKeycloak" />

            <main class="flex-1 min-w-0 p-6 max-[920px]:p-4.5 overflow-y-auto flex flex-col gap-5">
                <div v-if="fetchError" class="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                    {{ fetchError }}
                </div>

                <template v-if="!selectedDetail">
                    <PengirimanPenerimaanOverview :intro="intro" :summary="summary" :items="items"
                        :loading="loading" :total-items="totalItems" :current-page="currentPage"
                        :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages"
                        @view="onView" @update:current-page="currentPage = $event"
                        @update:page-size="pageSize = $event" />
                </template>

                <template v-else>
                    <PengirimanPenerimaanDetail :detail="selectedDetail" @back="onBack" />
                </template>
            </main>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import PengirimanPenerimaanOverview from './components/PengirimanPenerimaanOverview.vue'
import PengirimanPenerimaanDetail from './components/PengirimanPenerimaanDetail.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { useServerPagination } from '../shared/pagination'

const props = defineProps({
    controller: { type: Object, required: true }
})

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => props.controller.getIntro())

const items = ref([])
const loading = ref(false)
const fetchError = ref(null)
const selectedDetail = ref(null)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const { totalPages, visiblePages } = useServerPagination(totalItems, currentPage, pageSize)

const summary = computed(() => {
    const totalVolume = items.value.reduce((sum, item) => sum + (item.volumeValue || 0), 0)
    return {
        totalTrips: items.value.length,
        totalVolume,
        volumeUnit: items.value[0]?.unitName || ''
    }
})

onMounted(async () => {
    await loadList()
})

async function loadList() {
    loading.value = true
    fetchError.value = null
    try {
        const result = await props.controller.fetchList({
            page: currentPage.value,
            limit: pageSize.value
        })
        items.value = result.items || []
        totalItems.value = result.total || 0
    } catch (err) {
        fetchError.value = err?.message || 'Gagal memuat data pengiriman dan penerimaan.'
        items.value = []
        totalItems.value = 0
    } finally {
        loading.value = false
    }
}

watch(pageSize, () => {
    if (currentPage.value !== 1) {
        currentPage.value = 1
        return
    }
    loadList()
})

watch(currentPage, loadList)

async function onView(item) {
    try {
        const detail = await props.controller.fetchDetail(item.id)
        if (!detail) {
            fetchError.value = 'Detail pengiriman tidak ditemukan.'
            return
        }
        selectedDetail.value = detail
    } catch (err) {
        fetchError.value = err?.message || 'Gagal memuat detail pengiriman.'
    }
}

function onBack() {
    selectedDetail.value = null
}
</script>
