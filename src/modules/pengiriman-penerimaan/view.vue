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
                        @tambah-penerimaan="onTambahPenerimaan" @terima="onTerima" @view="onView" />
                </template>

                <template v-else>
                    <PengirimanPenerimaanDetail :detail="selectedDetail" @back="onBack"
                        @publish-receipt="onPublishReceipt" />
                </template>
            </main>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import PengirimanPenerimaanOverview from './components/PengirimanPenerimaanOverview.vue'
import PengirimanPenerimaanDetail from './components/PengirimanPenerimaanDetail.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'

const props = defineProps({
    controller: { type: Object, required: true }
})

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => props.controller.getIntro())

const items = ref([])
const fetchError = ref(null)
const selectedDetail = ref(null)

const summary = computed(() => {
    const totalPengiriman = items.value.reduce((sum, item) => sum + (item.qtyPengirimanValue || 0), 0)
    const totalPenerimaan = items.value.reduce((sum, item) => sum + (item.qtyPenerimaanValue || 0), 0)
    return { totalPengiriman, totalPenerimaan }
})

onMounted(async () => {
    await loadList()
})

async function loadList() {
    fetchError.value = null
    try {
        items.value = await props.controller.fetchList()
    } catch (err) {
        fetchError.value = err?.message || 'Gagal memuat data pengiriman dan penerimaan.'
    }
}

async function onView(item) {
    try {
        const detail = await props.controller.fetchDetail(item.idPengiriman)
        if (!detail) {
            fetchError.value = 'Detail pengiriman tidak ditemukan.'
            return
        }
        selectedDetail.value = detail
    } catch (err) {
        fetchError.value = err?.message || 'Gagal memuat detail pengiriman.'
    }
}

async function onTerima(item) {
    await onView(item)
}

async function onTambahPenerimaan() {
    const pendingItem = items.value.find((item) => !item.idPenerimaan) || items.value[0]
    if (!pendingItem) return
    await onTerima(pendingItem)
}

function onBack() {
    selectedDetail.value = null
}

function onPublishReceipt(receipt) {
    if (!selectedDetail.value) {
        return
    }

    selectedDetail.value = {
        ...selectedDetail.value,
        receipt
    }

    items.value = items.value.map((item) => {
        if (item.idPengiriman !== selectedDetail.value.idPengiriman) return item
        return {
            ...item,
            idPenerimaan: receipt.idPenerimaan,
            datePenerimaan: receipt.datePenerimaanLabel,
            qtyPenerimaan: `${receipt.qtyPenerimaanValue.toLocaleString('id-ID')} Kg`,
            qtyPenerimaanValue: receipt.qtyPenerimaanValue
        }
    })
}
</script>