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
                    <div class="flex flex-wrap items-end justify-between gap-4">
                        <h1 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0">
                            Daftar Pekerja
                        </h1>
                        <button v-if="isOwner" type="button" class="add-user-button" :disabled="openingAdd" @click="openAddUser">
                            <span aria-hidden="true">+</span>{{ openingAdd ? 'Memuat…' : 'Tambah User' }}
                        </button>
                    </div>

                    <!-- Card Section (directive component) -->
                    <PekerjaCards :total="totalPekerja" />

                    <!-- Table Section (directive component) -->
                    <PekerjaTable
                        :rows="rows"
                        :loading="loading"
                        :error="fetchError"
                        :is-owner="isOwner" />
                </div>
            </main>
        </div>
    </div>
    <UserManagementModal
        v-if="addModalOpen"
        mode="add"
        :configuration="configuration"
        :saving="savingAdd"
        :error="modalError"
        @close="addModalOpen = false"
        @save="createUser" />
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
import UserManagementModal from '../../user-management/components/UserManagementModal.vue'
import userManagementService, { userManagementErrorMessage } from '../../user-management/services/userManagementService'
import { getPasswordEncryptionKey } from '../../../auth/accountApi'
import { encryptPassword } from '../../user-management/services/passwordEncryption'
import { useToast } from '../../../utils/toast'

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
const { show: showToast } = useToast()

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const totalPekerja = ref(0)
const isOwner = ref(false)
const addModalOpen = ref(false)
const openingAdd = ref(false)
const savingAdd = ref(false)
const modalError = ref('')
const configuration = ref({ accessOptions: [], client: { clientId: 'mobile', roles: [] } })

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

async function openAddUser() {
    openingAdd.value = true
    modalError.value = ''
    try {
        configuration.value = await userManagementService.getConfiguration()
        addModalOpen.value = true
    } catch (err) {
        showToast(userManagementErrorMessage(err, 'Gagal memuat konfigurasi user.'), 'error')
    } finally {
        openingAdd.value = false
    }
}

async function createUser(form) {
    savingAdd.value = true
    modalError.value = ''
    try {
        const { publicKey } = await getPasswordEncryptionKey()
        const encryptedPassword = await encryptPassword(form.password, publicKey)
        await userManagementService.createUser({
            username: form.username,
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            birthDate: form.birthDate,
            maritalStatus: form.maritalStatus,
            gender: form.gender,
            access: form.access,
            address1: form.address1,
            address2: form.address2,
            directClientRoles: form.directClientRoles,
            encryptedPassword
        })
        addModalOpen.value = false
        showToast('User berhasil dibuat.')
        await loadData()
    } catch (err) {
        modalError.value = userManagementErrorMessage(err, 'Gagal membuat user.')
    } finally {
        savingAdd.value = false
    }
}

onMounted(async () => {
    const [accessResult] = await Promise.allSettled([
        userManagementService.verifyOwnerAccess(),
        loadData()
    ])
    isOwner.value = accessResult.status === 'fulfilled' && accessResult.value?.isOwner === true
})
</script>

<style scoped>
.add-user-button { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; border: 0; border-radius: 999px; background: var(--text); color: var(--surface); padding: 0 20px; font-size: 13px; font-weight: 800; cursor: pointer; }
.add-user-button span { font-size: 20px; line-height: 1; }
.add-user-button:disabled { opacity: .55; cursor: wait; }
</style>
