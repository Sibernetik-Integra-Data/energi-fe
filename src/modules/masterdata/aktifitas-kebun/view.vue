<template>
    <div class="h-screen flex bg-transparent max-[920px]:flex-col">
        <BaseSidebar :items="navigation" :user="user" />
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <BaseHeader
                eyebrow="Master Data"
                :title="pageTitle"
                :notifications="0"
                :user="user"
                :on-logout="logoutFromKeycloak" />
            <main class="flex-1 min-w-0 p-6 overflow-y-auto max-[920px]:p-4.5">
                <KebunList />
            </main>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseHeader from '../../shared/header'
import BaseSidebar from '../../shared/sidebar'
import KebunList from './components/KebunList.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../../auth/keycloak'
import { useAppStore } from '../../../stores'
import { navigation as sharedNavigation } from '../../shared/navigation'
import { loadStrapiSidebarNavigation } from '../../shared/sidebar/strapiNavigation'

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
const pageTitle = ref('Aktifitas Kebun')
const targetPath = '/master-data/aktifitas-kebun'
let refreshTimerId = null

function findNavigationItem(items, routePath) {
    for (const item of items) {
        if (item?.to === routePath || item?.key === 'aktifitas-kebun') {
            return item
        }

        if (Array.isArray(item?.children) && item.children.length > 0) {
            const childMatch = findNavigationItem(item.children, routePath)
            if (childMatch) {
                return childMatch
            }
        }
    }

    return null
}

async function hydratePageTitle() {
    try {
        const items = await loadStrapiSidebarNavigation()
        const match = findNavigationItem(items, targetPath)
        if (match?.label) {
            pageTitle.value = match.label
        }
    } catch (error) {
        console.warn('[Aktifitas Kebun] Failed to load Strapi title, using fallback title.', error)
    }
}

function refreshPageTitle() {
    void hydratePageTitle()
}

function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        refreshPageTitle()
    }
}

onMounted(() => {
    hydratePageTitle()
    window.addEventListener('focus', refreshPageTitle)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    refreshTimerId = globalThis.setInterval(() => {
        if (!document.hidden) {
            refreshPageTitle()
        }
    }, 15000)
})

onBeforeUnmount(() => {
    window.removeEventListener('focus', refreshPageTitle)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (refreshTimerId !== null) {
        globalThis.clearInterval(refreshTimerId)
        refreshTimerId = null
    }
})
</script>
