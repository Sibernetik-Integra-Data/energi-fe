<template>
    <div class="h-screen flex bg-transparent max-[920px]:flex-col">
        <BaseSidebar :items="navigation" :user="user" />

        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <BaseHeader
                eyebrow="Pemupukan"
                :title="header.title"
                :notifications="header.notifications"
                :user="user"
                :on-logout="logoutFromKeycloak" />

            <main class="flex-1 min-w-0 p-6 max-[920px]:p-4.5 overflow-y-auto flex flex-col gap-5">
                <!-- Page intro -->
                <section
                    class="flex justify-between gap-6 items-end max-[920px]:flex-col max-[920px]:items-start shrink-0">
                    <div>
                        <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-(--brand) mb-2">
                            Operasional Kebun
                        </p>
                        <h1 class="m-0 text-[clamp(24px,2.5vw,36px)] font-extrabold leading-tight tracking-[-0.04em]">
                            {{ intro.title }}
                        </h1>
                    </div>
                    <p class="max-w-130 m-0 text-(--text-muted) text-sm leading-relaxed">{{ intro.description }}</p>
                </section>

                <!-- Error banner -->
                <div
                    v-if="fetchError"
                    class="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                    {{ fetchError }}
                </div>

                <!-- Detail view -->
                <PemupukanDetail
                    v-if="selectedPlan"
                    :plan="selectedPlan"
                    :loading="detailLoading"
                    :error="detailError"
                    @back="handleBack" />

                <!-- List view -->
                <PemupukanList
                    v-else
                    :items="items"
                    :loading="loading"
                    :error="null"
                    @view-detail="handleViewDetail" />
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import BaseHeader from "../shared/header";
import BaseSidebar from "../shared/sidebar";
import PemupukanList from "./components/PemupukanList.vue";
import PemupukanDetail from "./components/PemupukanDetail.vue";
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from "../../auth/keycloak";
import { useAppStore } from "../../stores";

const props = defineProps({
    controller: { type: Object, required: true },
});

const appStore = useAppStore();
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser());
const navigation = computed(() => props.controller.getNavigation());
const header = computed(() => props.controller.getHeader());
const intro = computed(() => props.controller.getIntro());

const items = ref([]);
const loading = ref(false);
const fetchError = ref(null);

const selectedPlan = ref(null);
const detailLoading = ref(false);
const detailError = ref(null);

onMounted(async () => {
    loading.value = true;
    fetchError.value = null;
    try {
        items.value = await props.controller.fetchList();
    } catch (err) {
        console.error("[Pemupukan] Failed to load list:", err);
        fetchError.value = err?.message || "Gagal memuat data pemupukan.";
    } finally {
        loading.value = false;
    }
});

async function handleViewDetail(item) {
    selectedPlan.value = item;
    detailLoading.value = true;
    detailError.value = null;
    try {
        const detail = await props.controller.fetchDetail(item.id);
        if (detail) selectedPlan.value = detail;
    } catch (err) {
        console.error("[Pemupukan] Failed to load detail:", err);
        detailError.value = err?.message || "Gagal memuat detail penugasan.";
    } finally {
        detailLoading.value = false;
    }
}

function handleBack() {
    selectedPlan.value = null;
    detailError.value = null;
}
</script>

