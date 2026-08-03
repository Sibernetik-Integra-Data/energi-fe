<template>
    <div class="h-screen flex bg-transparent max-[920px]:flex-col">
        <BaseSidebar :items="navigation" :user="user" />
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <BaseHeader
                eyebrow="Master Data"
                title="Pekerja"
                :notifications="0"
                :user="user"
                :on-logout="logoutFromKeycloak" />
            <main class="flex-1 min-w-0 overflow-y-auto bg-(--surface-muted)">
                <div class="flex flex-col gap-6 p-6 max-[920px]:p-4">
                    <!-- Page Heading -->
                    <div>
                        <h1 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0">
                            Daftar Pekerja
                        </h1>
                    </div>

                    <!-- Card Section (directive component) -->
                    <PekerjaCards :total="totalPekerja" />

                    <!-- Table Section (directive component) -->
                    <PekerjaTable
                        :rows="rows"
                        :loading="loading"
                        :error="fetchError" />
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseHeader from '../../shared/header'
import BaseSidebar from '../../shared/sidebar'
import PekerjaCards from './components/PekerjaCards.vue'
import PekerjaTable from './components/PekerjaTable.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../../auth/keycloak'
import { useAppStore } from '../../../stores'
import { navigation as sharedNavigation } from '../../shared/navigation'
import { listPekerja } from './model'

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const totalPekerja = ref(0)

async function loadData() {
    loading.value = true
    fetchError.value = null
    try {
        const result = await listPekerja()
        rows.value = result.data
        totalPekerja.value = result.total
    } catch (err) {
        console.error('[Pekerja] Failed to load:', err)
        fetchError.value = err?.message || 'Gagal memuat data pekerja.'
    } finally {
        loading.value = false
    }
}

onMounted(loadData)
</script>
