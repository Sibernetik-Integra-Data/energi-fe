<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @mousedown.self="onCancel">
            <div
                class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Ubah Tujuan' : 'Tambah Tujuan' }}</h3>
                    <button
                        type="button"
                        class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none transition-colors"
                        aria-label="Tutup"
                        @click="onCancel">
                        &times;
                    </button>
                </div>

                <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="loc-name">
                            Nama <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="loc-name"
                            v-model.trim="form.name"
                            type="text"
                            placeholder="mis. PKS Utara"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                            :class="
                                errors.name
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
                            "
                            autocomplete="off" />
                        <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="loc-location">Tujuan</label>
                        <input
                            id="loc-location"
                            v-model.trim="form.location"
                            type="text"
                            placeholder="mis. Pabrik Utara"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors"
                            autocomplete="off" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="loc-type">
                            Tipe Tujuan <span class="text-red-500">*</span>
                        </label>
                        <div v-if="typeOfLocationsLoading" class="text-xs text-(--text-muted)">Memuat tipe&hellip;</div>
                        <select
                            v-else
                            id="loc-type"
                            v-model="form.tol_id"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                            :class="
                                errors.tol_id
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
                            ">
                            <option value="">Pilih tipe tujuan</option>
                            <option v-for="t in typeOfLocations" :key="t.id" :value="String(t.id)">{{ t.name }}</option>
                        </select>
                        <span v-if="errors.tol_id" class="text-xs text-red-500">{{ errors.tol_id }}</span>
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="loc-lat">Latitude</label>
                        <input
                            id="loc-lat"
                            v-model.trim="form.latitude"
                            type="text"
                            placeholder="mis. -1.234567"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors"
                            autocomplete="off" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="loc-lng">Longitude</label>
                        <input
                            id="loc-lng"
                            v-model.trim="form.longitude"
                            type="text"
                            placeholder="mis. 103.123456"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors"
                            autocomplete="off" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="loc-notes">Catatan</label>
                        <textarea
                            id="loc-notes"
                            v-model.trim="form.notes"
                            rows="2"
                            placeholder="Catatan tambahan"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
                    </div>

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
                            <span v-else>{{ isEdit ? 'Simpan Perubahan' : 'Tambah Tujuan' }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { listTypeOfLocations } from '../model'

const props = defineProps({
    visible: { type: Boolean, default: false },
    location: { type: Object, default: null },
    submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.location?.id))

const emptyForm = () => ({
    name: '',
    location: '',
    tol_id: '',
    latitude: '',
    longitude: '',
    notes: ''
})

const form = ref(emptyForm())
const errors = ref({})

const typeOfLocations = ref([])
const typeOfLocationsLoading = ref(false)

async function loadTypeOfLocations() {
    typeOfLocationsLoading.value = true
    try {
        typeOfLocations.value = await listTypeOfLocations()
    } catch (err) {
        console.error('[DestinationForm] Failed to load type_of_location:', err)
    } finally {
        typeOfLocationsLoading.value = false
    }
}

watch(
    () => props.visible,
    (val) => {
        if (val) {
            errors.value = {}
            if (props.location) {
                form.value = {
                    name: props.location.name || '',
                    location: props.location.location || '',
                    tol_id: String(props.location.tol_id ?? props.location.location_type?.id ?? ''),
                    latitude: props.location.latitude || '',
                    longitude: props.location.longitude || '',
                    notes: props.location.notes || ''
                }
            } else {
                form.value = emptyForm()
            }
            if (typeOfLocations.value.length === 0) {
                loadTypeOfLocations()
            }
        }
    }
)

onMounted(() => {
    if (props.visible) loadTypeOfLocations()
})

function validate() {
    const errs = {}
    if (!form.value.name) errs.name = 'Nama wajib diisi.'
    // The database requires a type; without this check the server answered 500.
    if (!form.value.tol_id) errs.tol_id = 'Pilih tipe tujuan.'
    errors.value = errs
    return Object.keys(errs).length === 0
}

function onSubmit() {
    if (!validate()) return

    const payload = {
        name: form.value.name,
        location: form.value.location,
        tol_id: Number(form.value.tol_id),
        latitude: form.value.latitude,
        longitude: form.value.longitude,
        notes: form.value.notes
    }


    const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined && v !== '')
    )

    emit('submit', cleaned)
}

function onCancel() {
    emit('cancel')
}
</script>
