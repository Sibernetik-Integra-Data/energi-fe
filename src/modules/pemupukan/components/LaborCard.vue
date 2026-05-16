<template>
    <div class="relative">
        <button
            type="button"
            class="w-full text-left bg-(--surface) border border-(--border) rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-(--surface-muted) hover:border-teal-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            :class="{ 'border-teal-400 ring-2 ring-teal-200': popupOpen }"
            @click="togglePopup">
            <!-- Avatar -->
            <div
                class="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-xl"
                aria-hidden="true">
                👷
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-(--text) truncate m-0">
                    {{ displayName }}
                </p>
                <p v-if="labor.notes" class="text-xs text-(--text-muted) truncate mt-0.5 m-0">{{ labor.notes }}</p>
                <p v-else class="text-xs text-(--text-muted) mt-0.5 m-0">Labor ID: {{ labor.id }}</p>
            </div>
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
import { ref, computed } from "vue";
import LaborActionPopup from "./LaborActionPopup.vue";

const props = defineProps({
    labor: { type: Object, required: true },
    planId: { type: [Number, String], default: null },
    plan: { type: Object, default: null },
    workDate: { type: String, default: "" },
});

const popupOpen = ref(false);

const displayName = computed(() => {
    if (props.labor.username && props.labor.username !== props.labor.userId) {
        return props.labor.username;
    }
    return props.labor.userId || `Pekerja #${props.labor.id}`;
});

function togglePopup() {
    popupOpen.value = !popupOpen.value;
}
</script>

