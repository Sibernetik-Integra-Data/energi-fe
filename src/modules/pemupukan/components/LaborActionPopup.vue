<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/45" aria-hidden="true" @click="$emit('close')" />

        <div
            class="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-(--surface) border border-(--border) rounded-2xl shadow-2xl"
            role="dialog"
            aria-modal="true"
            :aria-label="`Rencana baru untuk ${displayName}`">
            <div class="px-6 py-4 border-b border-(--border) flex items-center">
                <h4 class="text-sm font-bold text-(--text) m-0">Rencana Baru</h4>
                <button
                    type="button"
                    class="ml-auto w-8 h-8 rounded-lg border-0 bg-transparent text-(--text-muted) hover:text-(--text) hover:bg-(--surface-muted) cursor-pointer"
                    aria-label="Tutup modal"
                    @click="$emit('close')">
                    ✕
                </button>
            </div>

            <div class="px-6 py-5">
                <div class="flex items-center gap-3 mb-4">
                    <div
                        class="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-lg shrink-0"
                        aria-hidden="true">
                        <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="w-full h-full object-cover" />
                        <span v-else>👷</span>
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-(--text) m-0">{{ displayName }}</p>
                        <p class="text-xs text-(--text-muted) m-0 mt-0.5">{{ workerIdLabel }}</p>
                    </div>
                </div>

                <div class="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-xs mb-4 items-start">
                    <p class="m-0 text-(--text-muted)">Tanggal Pengerjaan</p>
                    <p class="m-0 text-(--text) font-medium">{{ formattedWorkDate }}</p>

                    <p class="m-0 text-(--text-muted)">Nomor Petak</p>
                    <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="(block, index) in blocks"
                            :key="`${block}-${index}`"
                            class="inline-block px-2 py-0.5 rounded-md bg-(--surface-muted) border border-(--border) text-[10px] text-(--text) font-semibold"
                            >{{ block }}</span
                        >
                    </div>

                    <template v-if="fulfillmentItems.length">
                        <template v-for="item in fulfillmentItems" :key="item.key">
                            <p class="m-0 text-(--text-muted)">{{ item.label }}</p>
                            <p class="m-0 text-(--text) font-medium">{{ item.value }}</p>
                        </template>
                    </template>
                    <template v-else>
                        <p class="m-0 text-(--text-muted)">Jumlah Pokok</p>
                        <p class="m-0 text-(--text) font-medium">—</p>
                    </template>
                </div>

                <div class="grid grid-cols-[110px_1fr] gap-x-4 gap-y-4 text-xs">
                    <p class="m-0 text-(--text-muted)">Foto Sebelum Pengerjaan</p>
                    <div v-if="beforePhotos.length" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <img
                            v-for="(src, index) in beforePhotos"
                            :key="`before-${index}`"
                            :src="src"
                            alt="Foto sebelum pengerjaan"
                            class="w-full h-32 object-cover rounded-lg border border-(--border)" />
                    </div>
                    <p v-else class="m-0 text-(--text)">-</p>

                    <p class="m-0 text-(--text-muted)">Foto Setelah Pengerjaan</p>
                    <div v-if="afterPhotos.length" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <img
                            v-for="(src, index) in afterPhotos"
                            :key="`after-${index}`"
                            :src="src"
                            alt="Foto setelah pengerjaan"
                            class="w-full h-32 object-cover rounded-lg border border-(--border)" />
                    </div>
                    <p v-else class="m-0 text-(--text)">-</p>

                    <p class="m-0 text-(--text-muted)">Status</p>
                    <p class="m-0 text-(--text) leading-relaxed">{{ status }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { signedApiFetchBlob } from "../../../api/fetch";

const props = defineProps({
    labor: { type: Object, required: true },
    planId: { type: [Number, String], default: null },
    plan: { type: Object, default: null },
    workDate: { type: String, default: "" },
});

const emit = defineEmits(["close"]);
const avatarUrl = ref("");
const beforePhotos = ref([]);
const afterPhotos = ref([]);
const photoObjectUrls = ref([]);

const displayName = computed(() => {
    const first = String(props.labor.firstName || "").trim();
    const last = String(props.labor.lastName || "").trim();
    const fullName = [first, last].filter(Boolean).join(" ");
    if (fullName) return fullName;
    return props.labor.userId || `Pekerja #${props.labor.id}`;
});

const workerIdLabel = computed(() => {
    const userId = String(props.labor.userId || "").trim();
    if (userId) return `ID Pekerja ${userId.slice(0, 7)}`;
    return `ID Pekerja ${String(props.labor.id || "").padStart(4, "0")}`;
});

const formattedWorkDate = computed(() => {
    const selectedDate = props.workDate || props.labor.laborImageDate || props.labor.workDate || props.labor.pointDate || "";
    if (selectedDate) return String(selectedDate).slice(0, 10);
    const start = props.labor.planningStartDate || props.labor.planning?.start_date || props.plan?.planningStartDate || props.plan?.startDate || "";
    const end = props.labor.planningEndDate || props.labor.planning?.end_date || props.plan?.planningEndDate || props.plan?.endDate || "";
    const startDate = String(start).slice(0, 10);
    const endDate = String(end).slice(0, 10);
    if (startDate && endDate) return `${startDate} — ${endDate}`;
    return startDate || endDate || "—";
});

const blocks = computed(() => {
    const value = Array.isArray(props.labor?.blocks)
        ? props.labor.blocks
        : Array.isArray(props.plan?.blocks) ? props.plan.blocks : [];
    if (value.length) return value.slice(0, 8);
    return [];
});

const fulfillmentItems = computed(() => {
    const mappings = Array.isArray(props.labor?.fullfilMappings)
        ? props.labor.fullfilMappings
        : Array.isArray(props.plan?.fullfilMappings) ? props.plan.fullfilMappings : [];
    return mappings
        .filter((mapping) => mapping && mapping.is_view !== 0)
        .map((mapping, index) => {
            const need = mapping.type_of_need || {};
            const name = need.name || 'Jumlah';
            const unitName = need.unit_name ? ` (${need.unit_name})` : '';
            return {
                key: `${mapping.id ?? index}-${need.unit_id ?? 'unit'}`,
                label: `${name}${unitName}`,
                value: mapping.volume ?? '—'
            };
        });
});

const status = computed(() => props.labor.status || props.plan?.status || "-");

function photoUris(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((photo) => typeof photo === "string" ? photo : photo?.image_uri || photo?.uri || "")
        .map((uri) => String(uri || "").trim())
        .filter(Boolean)
        .filter((uri) => !/\.(md|txt|json|csv|xml)(?:$|\?)/i.test(decodeStoragePath(uri)))
        .slice(0, 3);
}

function rawLaborImageGroups() {
    const candidates = [
        props.labor?.laborImages,
        props.labor?.labor_images,
        props.labor?.planning?.labor_images,
        props.labor?.planning?.laborImages,
    ];
    return candidates.find((value) => (
        value && typeof value === "object" && !Array.isArray(value) &&
        ["baseline", "before", "current", "after"].some((key) => Array.isArray(value[key]) && value[key].length)
    )) || {};
}

function rawPhotoGroup(groupName) {
    const grouped = rawLaborImageGroups();
    const photos = [];
    Object.entries(grouped && typeof grouped === "object" ? grouped : {}).forEach(([key, images]) => {
        if (!Array.isArray(images)) return;
        const hint = String(key || "").trim().toLowerCase();
        images.forEach((image) => {
            const typeId = Number(image?.type_image_id);
            const isBefore = hint === "1" || hint === "baseline" || hint === "before" || hint.includes("baseline") || hint.includes("before") || hint.includes("sebelum") || typeId === 1;
            const isAfter = hint === "2" || hint === "current" || hint === "after" || hint.includes("current") || hint.includes("after") || hint.includes("setelah") || typeId === 2;
            if ((groupName === "before" && isBefore) || (groupName === "after" && isAfter)) photos.push(image);
        });
    });
    return photos;
}

function decodeStoragePath(rawUri) {
    try {
        return decodeURIComponent(rawUri);
    } catch {
        return rawUri;
    }
}

async function loadPhotoGroup(uris) {
    const loaded = await Promise.all(uris.map(async (rawUri) => {
        const decodedPath = decodeStoragePath(rawUri);
        const candidatePaths = [...new Set([decodedPath, rawUri])];
        let lastError = null;

        for (const path of candidatePaths) {
            try {
                const blob = await signedApiFetchBlob(`/storage?path=${encodeURIComponent(path)}`);
                const objectUrl = URL.createObjectURL(blob);
                photoObjectUrls.value.push(objectUrl);
                return objectUrl;
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError) console.warn("Failed to load labor image", lastError);
        return null;
    }));
    return loaded.filter(Boolean);
}

async function loadPhotos() {
    const [before, after] = await Promise.all([
        loadPhotoGroup(photoUris(props.labor.beforePhotos?.length ? props.labor.beforePhotos : rawPhotoGroup("before"))),
        loadPhotoGroup(photoUris(props.labor.afterPhotos?.length ? props.labor.afterPhotos : rawPhotoGroup("after"))),
    ]);
    beforePhotos.value = before;
    afterPhotos.value = after;
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

function handleKeydown(event) {
    if (event.key === "Escape") emit("close");
}

onMounted(() => {
    loadAvatar();
    loadPhotos();
    document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener("keydown", handleKeydown);
    if (avatarUrl.value.startsWith("blob:")) URL.revokeObjectURL(avatarUrl.value);
    photoObjectUrls.value.forEach((url) => URL.revokeObjectURL(url));
});
</script>

