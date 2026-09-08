<template>
    <div class="relative">
        <button
            type="button"
            class="w-full h-16 text-left bg-(--surface) border border-[#bababa] rounded-2xl p-3 flex items-center gap-4 cursor-pointer hover:bg-(--surface-muted) hover:border-teal-300 transition-all focus:outline-none focus:ring-2 focus:ring-teal-300"
            :class="{ 'border-teal-400 ring-2 ring-teal-200': popupOpen }"
            @click="togglePopup">
            <!-- Avatar -->
            <div
                class="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-base overflow-hidden"
                aria-hidden="true">
                <img v-if="avatarUrl" :src="avatarUrl" :alt="fullName" class="w-full h-full object-cover" />
                <span v-else>👷</span>
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-(--text) truncate m-0">
                    {{ fullName }}
                </p>
                <p class="text-[10px] text-(--text-muted) truncate mt-0.5 m-0">ID Pekerja {{ shortUserId }}</p>
            </div>

            <span class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" aria-hidden="true">
                <img :src="clipboardIcon" alt="" class="w-4 h-4" />
            </span>
        </button>

        <LaborActionPopup
            v-if="popupOpen"
            :labor="labor"
            :plan-id="planId"
            :plan="plan"
            :work-date="workDate"
            @close="popupOpen = false" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import LaborActionPopup from "./LaborActionPopup.vue";
import { signedApiFetchBlob } from "../../../api/fetch";
import clipboardIcon from "@/assets/icons/figma/clipboard-text.svg";

const props = defineProps({
    labor: { type: Object, required: true },
    planId: { type: [Number, String], default: null },
    plan: { type: Object, default: null },
    workDate: { type: String, default: "" },
});

const popupOpen = ref(false);
const avatarUrl = ref("");

const shortUserId = computed(() => {
    const value = String(props.labor.userId || "").trim();
    if (!value) return `Pekerja #${props.labor.id}`;
    return value.slice(0, 7);
});

const fullName = computed(() => {
    const first = String(props.labor.firstName || "").trim();
    const last = String(props.labor.lastName || "").trim();
    const combined = [first, last].filter(Boolean).join(" ");
    return combined || "-";
});

function togglePopup() {
    popupOpen.value = !popupOpen.value;
}

async function loadAvatar() {
    const rawUri = String(props.labor.avatar_uri || "").trim();
    if (!rawUri) return;

    let avatarPath = rawUri;
    try {
        avatarPath = decodeURIComponent(avatarPath);
    } catch {
        // Keep the original path if it contains malformed escape sequences.
    }

    try {
        const blob = await signedApiFetchBlob(`/storage?path=${encodeURIComponent(avatarPath)}`);
        avatarUrl.value = URL.createObjectURL(blob);
    } catch (error) {
        console.warn("Failed to load labor avatar", error);
    }
}

onMounted(loadAvatar);
onBeforeUnmount(() => {
    if (avatarUrl.value.startsWith("blob:")) URL.revokeObjectURL(avatarUrl.value);
});
</script>
