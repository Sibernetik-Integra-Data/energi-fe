<template>
    <div class="h-screen flex bg-transparent max-[920px]:flex-col">
        <BaseSidebar :items="navigation" :user="user" />

        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <BaseHeader :eyebrow="t('nav.pengirimanPenerimaan')" :title="header.title" :notifications="header.notifications"
                :user="user" :on-logout="logoutFromKeycloak" />

            <main class="flex-1 min-w-0 p-6 max-[920px]:p-4.5 overflow-y-auto flex flex-col gap-5">
                <div v-if="fetchError" role="alert"
                    class="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                    {{ fetchError }}
                </div>
                <div v-if="successMessage" role="status"
                    class="px-4 py-3 rounded-lg bg-[#e6f3ea] text-[#00642a] text-sm border border-[#b9dcc4]">
                    {{ successMessage }}
                </div>

                <template v-if="!selectedDetail">
                    <PengirimanPenerimaanOverview :intro="intro" :summary="summary" :items="items"
                        :loading="loading" :total-items="totalItems" :current-page="currentPage"
                        :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages"
                        :status-filters="statusFilters" :status="statusFilter"
                        @view="onView" @update:status="statusFilter = $event"
                        @update:current-page="currentPage = $event"
                        @update:page-size="pageSize = $event" />
                </template>

                <template v-else>
                    <PengirimanPenerimaanDetail :detail="selectedDetail" :can-receive="canReceive" :units="units"
                        :harvest-types="harvestTypes" :saving="saving" :action-error="actionError"
                        @back="onBack" @receive="onReceive" @cancel-receipt="onCancelReceipt" />
                </template>
            </main>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import PengirimanPenerimaanOverview from './components/PengirimanPenerimaanOverview.vue'
import PengirimanPenerimaanDetail from './components/PengirimanPenerimaanDetail.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { canReceiveHarvest } from '../../auth/access'
import { useAppStore } from '../../stores'
import { useServerPagination } from '../shared/pagination'

const props = defineProps({
    controller: { type: Object, required: true }
})

const { t, locale } = useI18n()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const canReceive = computed(() => canReceiveHarvest(user.value))
const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => props.controller.getIntro())
const statusFilters = computed(() => props.controller.getStatusFilters())
const harvestTypes = computed(() => props.controller.getHarvestTypes())

const items = ref([])
const loading = ref(false)
const fetchError = ref(null)
const successMessage = ref('')
const selectedDetail = ref(null)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const statusFilter = ref('')
const summary = ref({ totalTrips: 0, shippedLabel: '-', receivedLabel: '-' })
const units = ref([])
const saving = ref(false)
const actionError = ref('')

const { totalPages, visiblePages } = useServerPagination(totalItems, currentPage, pageSize)

onMounted(async () => {
    await loadList()
})

// Only the answer to the latest request is shown, so a slow earlier page
// cannot overwrite a newer one.
let listRequest = 0

async function loadList() {
    const request = ++listRequest
    loading.value = true
    fetchError.value = null
    try {
        const result = await props.controller.fetchList({
            page: currentPage.value,
            limit: pageSize.value,
            status: statusFilter.value
        })
        if (request !== listRequest) return
        items.value = result.items || []
        totalItems.value = result.total || 0
        summary.value = result.summary
    } catch (err) {
        if (request !== listRequest) return
        fetchError.value = err?.message || t('shipping.errors.loadList')
        items.value = []
        totalItems.value = 0
    } finally {
        if (request === listRequest) loading.value = false
    }
}

function reloadFromFirstPage() {
    if (currentPage.value !== 1) {
        currentPage.value = 1
        return
    }
    loadList()
}

watch(pageSize, reloadFromFirstPage)
watch(statusFilter, reloadFromFirstPage)
watch(currentPage, loadList)
// Labels and dates in the loaded rows are formatted for the active language.
watch(locale, () => {
    loadList()
    if (selectedDetail.value) loadDetail(selectedDetail.value.id).catch(() => {})
})

async function loadUnitsOnce() {
    if (units.value.length) return
    try {
        units.value = await props.controller.fetchUnits()
    } catch {
        // The form falls back to the shipment's own unit.
        units.value = []
    }
}

async function loadDetail(tripId) {
    const detail = await props.controller.fetchDetail(tripId)
    if (!detail) {
        fetchError.value = t('shipping.errors.detailNotFound')
        return false
    }
    selectedDetail.value = detail
    return true
}

async function onView(item) {
    fetchError.value = null
    successMessage.value = ''
    actionError.value = ''
    try {
        if (await loadDetail(item.id)) loadUnitsOnce()
    } catch (err) {
        fetchError.value = err?.message || t('shipping.errors.loadDetail')
    }
}

function onBack() {
    selectedDetail.value = null
    actionError.value = ''
    successMessage.value = ''
}

async function runAction(action, successText) {
    if (saving.value) return
    saving.value = true
    actionError.value = ''
    successMessage.value = ''
    const tripId = selectedDetail.value.id
    try {
        const receipt = await action()
        successMessage.value = successText(receipt)
    } catch (err) {
        actionError.value = err?.message || t('shipping.errors.requestFailed')
    }
    // Reload in both cases: after a refusal the screen may be out of date
    // (for example, someone else has just received the same trip).
    try {
        await loadDetail(tripId)
        await loadList()
    } catch (err) {
        fetchError.value = err?.message || t('shipping.errors.reload')
    } finally {
        saving.value = false
    }
}

function onReceive(payload) {
    const detail = selectedDetail.value
    const body = { ...payload, trip_id: detail.id }
    if (detail.replacesReceiptId) body.replaces_receipt_id = detail.replacesReceiptId
    return runAction(
        () => props.controller.receive(body),
        (receipt) => t('shipping.messages.saved', { no: receipt?.receiptNo || '' })
    )
}

function onCancelReceipt({ receiptId, reason }) {
    return runAction(
        () => props.controller.cancel(receiptId, reason),
        (receipt) => t('shipping.messages.cancelled', { no: receipt?.receiptNo || '' })
    )
}
</script>
