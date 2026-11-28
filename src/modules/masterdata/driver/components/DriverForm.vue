<template>
    <MdModal
        :open="visible"
        :title="isEdit ? t('driver.form.titleEdit', { name: driver.name }) : t('driver.add')"
        :subtitle="t('driver.form.subtitle')"
        as-form
        @close="onCancel"
        @submit="onSubmit">
        <MdField :label="t('driver.ui.name')" for-id="driver-name" required full :error="errors.name">
            <input id="driver-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" :placeholder="t('driver.form.namePlaceholder')" autocomplete="off" />
        </MdField>

        <MdField :label="t('driver.address')" for-id="driver-address" full :hint="t('driver.ui.optional')">
            <textarea id="driver-address" v-model.trim="form.address" class="md-input" rows="2" :placeholder="t('driver.form.addressPlaceholder')" style="resize: vertical; height: auto" />
        </MdField>

        <MdField :label="t('driver.location')" for-id="driver-location" full :hint="locationLoadError || t('driver.form.locationHint')">
            <MdDropdown
                id="driver-location"
                v-model="form.location"
                field
                :disabled="locationsLoading"
                :placeholder="locationsLoading ? t('driver.form.locationLoading') : t('driver.ui.none')"
                :options="locationDropdown" />
        </MdField>

        <MdField :label="t('driver.vehicle')" for-id="driver-vehicle" :hint="vehicleLoadError || t('driver.form.vehicleHint')">
            <MdDropdown
                id="driver-vehicle"
                v-model="form.vehicle_id"
                field
                :disabled="vehiclesLoading"
                :placeholder="vehiclesLoading ? t('driver.form.vehicleLoading') : t('driver.ui.none')"
                :options="vehicleDropdown" />
        </MdField>

        <MdField :label="t('driver.plate')" for-id="driver-vehicle-number" :hint="t('driver.form.plateHint')">
            <input id="driver-vehicle-number" :value="form.vehicle_number" class="md-input" :placeholder="t('driver.form.platePlaceholder')" readonly aria-readonly="true" style="cursor: not-allowed" />
        </MdField>

        <MdField :label="t('driver.ui.notes')" for-id="driver-notes" full :hint="t('driver.ui.optional')">
            <textarea id="driver-notes" v-model.trim="form.notes" class="md-input" rows="2" :placeholder="t('driver.ui.notesExtra')" style="resize: vertical; height: auto" />
        </MdField>

        <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

        <template #footer>
            <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('driver.ui.cancel') }}</button>
            <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
                <MdIcon name="check" />{{ submitting ? t('driver.ui.saving') : t('driver.ui.save') }}
            </button>
        </template>
    </MdModal>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { listVehicles } from "../model";
import { listLocations } from "../../destination/model";
import { MdModal, MdField, MdDropdown, MdIcon } from "../../../shared/masterdata-ui";

const props = defineProps({
    visible: { type: Boolean, default: false },
    driver: { type: Object, default: null },
    submitting: { type: Boolean, default: false },
    error: { type: String, default: "" },
});

const emit = defineEmits(["submit", "cancel"]);
const { t } = useI18n();

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

// Opsi dropdown; nilai kosong = tidak ada.
const locationDropdown = computed(() => [
    { value: "", label: t("driver.ui.none") },
    ...(legacyLocation.value ? [{ value: legacyLocation.value, label: t("driver.form.legacyLocation", { name: legacyLocation.value }) }] : []),
    ...locationOptions.value.map((l) => ({ value: l.name, label: l.label })),
]);
const vehicleDropdown = computed(() => [
    { value: null, label: t("driver.ui.none") },
    ...vehicles.value.map((v) => ({ value: v.id, label: vehicleLabel(v) })),
]);

async function loadLocations() {
    if (locations.value.length > 0) return;
    locationsLoading.value = true;
    locationLoadError.value = null;
    try {
        locations.value = await listLocations();
    } catch (err) {
        console.error("[DriverForm] Failed to load locations:", err);
        locationLoadError.value = err?.message || t("driver.form.locationLoadFailed");
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
        vehicleLoadError.value = err?.message || t("driver.form.vehicleLoadFailed");
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
    if (!form.value.name) errs.name = t("driver.ui.nameRequired");
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
