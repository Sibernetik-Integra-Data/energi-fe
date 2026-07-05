<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @mousedown.self="onCancel">
            <div
                class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? "Edit Driver" : "Add Driver" }}</h3>
                    <button
                        type="button"
                        class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none transition-colors"
                        aria-label="Close"
                        @click="onCancel">
                        &times;
                    </button>
                </div>

                <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
                    <!-- Name -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-name">
                            Name <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="driver-name"
                            v-model.trim="form.name"
                            type="text"
                            placeholder="e.g. John Doe"
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
                        <label class="text-sm font-semibold text-(--text)" for="driver-address">Address</label>
                        <textarea
                            id="driver-address"
                            v-model.trim="form.address"
                            rows="2"
                            placeholder="Street address"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
                    </div>

                    <!-- Location -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-location">Location</label>
                        <input
                            id="driver-location"
                            v-model.trim="form.location"
                            type="text"
                            placeholder="e.g. Depot A"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors"
                            autocomplete="off" />
                    </div>

                    <!-- Vehicle Select -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-vehicle">Vehicle</label>
                        <div class="relative">
                            <input
                                id="driver-vehicle-search"
                                v-model="vehicleSearch"
                                type="text"
                                placeholder="Search vehicle…"
                                class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors w-full"
                                autocomplete="off"
                                @focus="vehicleDropdownOpen = true"
                                @blur="onVehicleBlur" />
                            <div
                                v-if="vehicleDropdownOpen && filteredVehicles.length > 0"
                                class="absolute z-10 mt-1 w-full bg-(--surface) border border-(--border) rounded-lg shadow-lg max-h-44 overflow-y-auto">
                                <button
                                    v-for="v in filteredVehicles"
                                    :key="v.id"
                                    type="button"
                                    class="w-full text-left px-3.5 py-2 text-sm text-(--text) hover:bg-(--surface-muted) transition-colors"
                                    @mousedown.prevent="selectVehicle(v)">
                                    <span class="font-medium">{{ v.name }}</span>
                                    <span v-if="v.type" class="ml-2 text-xs text-slate-400">{{ v.type }}</span>
                                </button>
                            </div>
                            <div
                                v-if="vehicleDropdownOpen && vehiclesLoading"
                                class="absolute z-10 mt-1 w-full bg-(--surface) border border-(--border) rounded-lg shadow-lg px-3.5 py-2 text-sm text-(--text-soft)">
                                Loading vehicles&hellip;
                            </div>
                            <div
                                v-if="vehicleDropdownOpen && !vehiclesLoading && vehicleLoadError"
                                class="absolute z-10 mt-1 w-full bg-(--surface) border border-red-300 rounded-lg shadow-lg px-3.5 py-2 text-sm text-red-500">
                                {{ vehicleLoadError }}
                            </div>
                            <div
                                v-if="
                                    vehicleDropdownOpen &&
                                    !vehiclesLoading &&
                                    !vehicleLoadError &&
                                    filteredVehicles.length === 0
                                "
                                class="absolute z-10 mt-1 w-full bg-(--surface) border border-(--border) rounded-lg shadow-lg px-3.5 py-2 text-sm text-(--text-soft)">
                                No vehicles found.
                            </div>
                        </div>
                        <span v-if="form.vehicle_id" class="text-xs text-green-600">
                            Selected: {{ selectedVehicleName }}
                        </span>
                    </div>

                    <!-- Vehicle Number -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-vehicle-number"
                            >Vehicle Number</label
                        >
                        <input
                            id="driver-vehicle-number"
                            v-model.trim="form.vehicle_number"
                            type="text"
                            placeholder="e.g. B 1234 XYZ"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors"
                            autocomplete="off" />
                    </div>

                    <!-- Notes -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="driver-notes">Notes</label>
                        <textarea
                            id="driver-notes"
                            v-model.trim="form.notes"
                            rows="2"
                            placeholder="Additional notes"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            :disabled="submitting"
                            @click="onCancel">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-60"
                            :disabled="submitting">
                            <span v-if="submitting">Saving&hellip;</span>
                            <span v-else>{{ isEdit ? "Save Changes" : "Add Driver" }}</span>
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
const vehicleSearch = ref("");
const vehicleDropdownOpen = ref(false);

const filteredVehicles = computed(() => {
    const q = vehicleSearch.value.trim().toLowerCase();
    if (!q) return vehicles.value;
    return vehicles.value.filter((v) => v.name?.toLowerCase().includes(q));
});

const selectedVehicleName = computed(() => {
    if (!form.value.vehicle_id) return "";
    const v = vehicles.value.find((v) => v.id === form.value.vehicle_id);
    return v?.name || String(form.value.vehicle_id);
});

async function loadVehicles() {
    if (vehicles.value.length > 0) return;
    vehiclesLoading.value = true;
    vehicleLoadError.value = null;
    try {
        vehicles.value = await listVehicles();
    } catch (err) {
        console.error("[DriverForm] Failed to load vehicles:", err);
        vehicleLoadError.value = err?.message || "Failed to load vehicles.";
    } finally {
        vehiclesLoading.value = false;
    }
}

function selectVehicle(v) {
    form.value.vehicle_id = v.id;
    vehicleSearch.value = v.name;
    vehicleDropdownOpen.value = false;
}

function onVehicleBlur() {
    setTimeout(() => {
        vehicleDropdownOpen.value = false;
    }, 150);
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
            // Preset vehicle search label when editing
            if (driver?.vehicle_id) {
                const v = vehicles.value.find((v) => v.id === driver.vehicle_id);
                vehicleSearch.value = v?.name || driver.vehicle_name || "";
            } else {
                vehicleSearch.value = "";
            }
            loadVehicles();
        }
    },
    { immediate: true },
);

function validate() {
    const errs = {};
    if (!form.value.name) errs.name = "Name is required.";
    errors.value = errs;
    return Object.keys(errs).length === 0;
}

function onSubmit() {
    if (!validate()) return;
    emit("submit", { ...form.value });
}

function onCancel() {
    emit("cancel");
}
</script>
