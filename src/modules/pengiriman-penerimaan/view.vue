<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-semibold text-gray-900">
                Pengiriman dan Penerimaan Panen
            </h1>
            <button type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                @click="onTambahPenerimaan">
                <PlusIcon class="h-4 w-4" />
                Tambah Penerimaan
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PengirimanPenerimanCard label="Total Pengiriman" :value="summary.totalPengiriman" unit="Kg"
                icon-bg-class="bg-blue-600">
                <template #icon>
                    <TruckIcon class="h-5 w-5 text-white" />
                </template>
            </PengirimanPenerimanCard>

            <PengirimanPenerimanCard label="Total Penerimaan" :value="summary.totalPenerimaan" unit="Kg"
                icon-bg-class="bg-yellow-700/80">
                <template #icon>
                    <ScaleIcon class="h-5 w-5 text-white" />
                </template>
            </PengirimanPenerimanCard>
        </div>

        <!-- Table -->
        <PengirimanPenerimaanList :items="items" @terima="onTerima" @view="onView" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import PengirimanPenerimanCard from './components/PengirimanPenerimanCard.vue'
import PengirimanPenerimaanList from './components/PengirimanPenerimaanList.vue'
// Contoh pakai @heroicons/vue — ganti sesuai icon library yang Anda pakai
import { PlusIcon, TruckIcon, ScaleIcon } from '@heroicons/vue/24/solid'

const summary = ref({
    totalPengiriman: 1000,
    totalPenerimaan: 980,
})

const items = ref([
    {
        idPengiriman: '0001',
        datePengiriman: 'dd/mm/yyyy',
        qtyPengiriman: 'XX Kg',
        sensudId: '[sensusID]',
        idPenerimaan: null,
        datePenerimaan: null,
        qtyPenerimaan: null,
    },
    {
        idPengiriman: '0002',
        datePengiriman: 'dd/mm/yyyy',
        qtyPengiriman: 'XX Kg',
        sensudId: '[sensusID]',
        idPenerimaan: 'ACC0001',
        datePenerimaan: 'dd/mm/yyyy',
        qtyPenerimaan: 'XX Kg',
    },
    // ... lanjutkan 0003 - 0010 sesuai data asli, atau fetch dari API
])

function onTambahPenerimaan() {
    // TODO: navigasi ke form tambah penerimaan
}

function onTerima(item) {
    // TODO: panggil API terima penerimaan untuk item ini
    console.log('Terima:', item)
}

function onView(item) {
    // TODO: navigasi ke halaman detail / buka modal
    console.log('View:', item)
}
</script>