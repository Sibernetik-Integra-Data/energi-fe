<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @mousedown.self="onCancel">
            <div
                class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? "Ubah Pengemudi" : "Tambah Pengemudi" }}</h3>
                    <button
                        type="button"
                        class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none transition-colors"
                        aria-label="Tutup"
                        @click="onCancel">
                        &times;
                    </button>
                </div>

                <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
                    <!-- Name -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-name">
                            Nama <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="driver-name"
                            v-model.trim="form.name"
                            type="text"
                            placeholder="mis. John Doe"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                            :class="
                                errors.name
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
                            "
                            autocomplete="off" />
                        <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
                    </div>

                    <!-- Address -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-address">Alamat</label>
                        <textarea
                            id="driver-address"
                            v-model.trim="form.address"
                            rows="2"
                            placeholder="Alamat jalan"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
                    </div>

                    <!-- Location -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-location">Lokasi</label>
                        <select
                            id="driver-location"
                            v-model="form.location"
                            :disabled="locationsLoading"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors">
                            <option value="">{{ locationsLoading ? "Loading locations…" : "— None —" }}</option>
                            <option v-if="legacyLocation" :value="legacyLocation">
                                {{ legacyLocation }} (nilai lama, belum ada di Destination)
                            </option>
                            <option v-for="l in locationOptions" :key="l.id" :value="l.name">
                                {{ l.label }}
                            </option>
                        </select>
                        <span v-if="locationLoadError" class="text-xs text-red-500">{{ locationLoadError }}</span>
                        <span v-else class="text-xs text-(--text-soft)">Sumber: Data Master → Tujuan</span>
                    </div>

                    <!-- Vehicle Select -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-vehicle">Kendaraan</label>
                        <select
                            id="driver-vehicle"
                            v-model="form.vehicle_id"
                            :disabled="vehiclesLoading"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors">
                            <option :value="null">{{ vehiclesLoading ? "Loading vehicles…" : "— None —" }}</option>
                            <option v-for="v in vehicles" :key="v.id" :value="v.id">
                                {{ vehicleLabel(v) }}
                            </option>
                        </select>
                        <span v-if="vehicleLoadError" class="text-xs text-red-500">{{ vehicleLoadError }}</span>
                        <span v-else class="text-xs text-(--text-soft)">Sumber: Data Master → Kendaraan</span>
                    </div>

                    <!-- Plate Number -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-vehicle-number"
                            >Nomor Polisi</label
                        >
                        <input
                            id="driver-vehicle-number"
                            :value="form.vehicle_number"
                            type="text"
                            placeholder="Pilih kendaraan dulu"
                            readonly
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none transition-colors cursor-not-allowed"
                            autocomplete="off"
                            aria-readonly="true" />
                    </div>

                    <!-- Notes -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-notes">Catatan</label>
                        <textarea
                            id="driver-notes"
                            v-model.trim="form.notes"
                            rows="2"
                            placeholder="Catatan tambahan"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            :disabled="submitting"
                            @click="onCancel">
                            Batal
                        </button>
                        <button
                            type="submit"
                            class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-60"
                            :disabled="submitting">
                            <span v-if="submitting">Menyimpan&hellip;</span>
                            <span v-else>{{ isEdit ? "Simpan Perubahan" : "Tambah Pengemudi" }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { listVehicles } from "../model";
import { listLocations } from "../../destination/model";

const props = defineProps({
    visible: { type: Boolean, default: false },
    driver: { type: Object, default: null },
    submitting: { type: Boolean, default: false },
});

const emit = defineEmits(["submit", "cancel"]);

const isEdit = computed(() => Boolean(props.driver?.id));

const emptyForm = () => ({
    name: "",
    address: "",
    location: "",
    vehicle_id: null,
    vehicle_number: "",
    notes: "",
});

const form = ref(emptyForm());
const errors = ref({});

// Vehicle select state
const vehicles = ref([]);
const vehiclesLoading = ref(false);
const vehicleLoadError = ref(null);
// "Truck · Fuso · B 2222 BBB"
const vehicleLabel = (v) => [v.name, v.type, v.plate_number?.trim()].filter(Boolean).join(" · ");

// Location select state (Master Data → Destination). Titik "GPS sensus"
// dibuat otomatis oleh sensus mobile, bukan lokasi untuk pengemudi.
const locations = ref([]);
const locationsLoading = ref(false);
const locationLoadError = ref(null);

const locationOptions = computed(() => {
    const seen = new Set();
    return locations.value
        .filter((l) => l.name && l.name !== "GPS sensus")
        .filter((l) => (seen.has(l.name) ? false : seen.add(l.name)))
        .map((l) => ({
            id: l.id,
            name: l.name,
            label: [l.name, l.location, l.location_type?.name].filter(Boolean).join(" · "),
        }));
});

// Nilai lama (teks bebas) yang tidak ada di Destination tetap ditampilkan
// agar tidak hilang diam-diam saat Edit.
const legacyLocation = computed(() => {
    const cur = form.value.location;
    if (!cur || locationsLoading.value) return "";
    return locationOptions.value.some((l) => l.name === cur) ? "" : cur;
});

async function loadLocations() {
    if (locations.value.length > 0) return;
    locationsLoading.value = true;
    locationLoadError.value = null;
    try {
        locations.value = await listLocations();
    } catch (err) {
        console.error("[DriverForm] Failed to load locations:", err);
        locationLoadError.value = err?.message || "Gagal memuat lokasi.";
    } finally {
        locationsLoading.value = false;
    }
}

async function loadVehicles() {
    if (vehicles.value.length > 0) return;
    vehiclesLoading.value = true;
    vehicleLoadError.value = null;
    try {
        vehicles.value = await listVehicles();
    } catch (err) {
        console.error("[DriverForm] Failed to load vehicles:", err);
        vehicleLoadError.value = err?.message || "Gagal memuat kendaraan.";
    } finally {
        vehiclesLoading.value = false;
    }
}

watch(
    () => [props.visible, props.driver],
    ([visible, driver]) => {
        if (visible) {
            form.value = driver
                ? {
                      name: driver.name || "",
                      address: driver.address || "",
                      location: driver.location || "",
                      vehicle_id: driver.vehicle_id ?? null,
                      vehicle_number: driver.vehicle_number || "",
                      notes: driver.notes || "",
                  }
                : emptyForm();
            errors.value = {};
            loadVehicles();
            loadLocations();
        }
    },
    { immediate: true },
);

// Keep the plate number authoritative from the selected vehicle, including
// when the vehicle list finishes loading after an edit form is opened.
watch(
    [vehicles, () => form.value.vehicle_id],
    ([vehicleList, vehicleId]) => {
        const vehicle = vehicleList.find((v) => v.id === vehicleId);
        form.value.vehicle_number = vehicle?.plate_number?.trim() || "";
    },
);

function validate() {
    const errs = {};
    if (!form.value.name) errs.name = "Nama wajib diisi.";
    errors.value = errs;
    return Object.keys(errs).length === 0;
}

function onSubmit() {
    if (!validate()) return;
    // vehicle_number hanya tampilan (diambil dari Vehicle), bukan kolom driver.
    const { vehicle_number: _plate, ...payload } = form.value;
    emit("submit", { ...payload, location: payload.location || null, vehicle_id: payload.vehicle_id ?? null });
}

function onCancel() {
    emit("cancel");
}
</script>
