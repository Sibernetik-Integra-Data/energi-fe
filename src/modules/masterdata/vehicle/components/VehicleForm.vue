<template>
    <MdModal
        :open="visible"
        :title="isEdit ? `Ubah Kendaraan ${vehicle.name}` : 'Tambah Kendaraan'"
        subtitle="Lengkapi data kendaraan. Kolom bertanda * wajib diisi."
        as-form
        @close="onCancel"
        @submit="onSubmit">
        <MdField label="Nama" for-id="vehicle-name" required :error="errors.name">
            <input id="vehicle-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" placeholder="mis. Truck A" autocomplete="off" />
        </MdField>

        <MdField label="Nomor polisi" for-id="vehicle-plate" required hint="Otomatis huruf besar, mis. KT 1234 AB." :error="errors.plate_number">
            <input id="vehicle-plate" v-model="form.plate_number" class="md-input" :class="{ 'is-invalid': errors.plate_number }" maxlength="30" placeholder="mis. KT 1234 AB" style="text-transform: uppercase" autocomplete="off" />
        </MdField>

        <MdField label="Judul" for-id="vehicle-title" hint="Opsional.">
            <input id="vehicle-title" v-model.trim="form.title" class="md-input" placeholder="mis. Heavy Truck" autocomplete="off" />
        </MdField>

        <MdField label="Tipe" for-id="vehicle-type" hint="Opsional.">
            <input id="vehicle-type" v-model.trim="form.type" class="md-input" placeholder="mis. Dump Truck" autocomplete="off" :list="typeSuggestions.length ? 'vehicle-type-list' : undefined" />
            <datalist id="vehicle-type-list">
                <option v-for="t in typeSuggestions" :key="t" :value="t" />
            </datalist>
        </MdField>

        <MdField label="Catatan" for-id="vehicle-notes" full hint="Opsional.">
            <textarea id="vehicle-notes" v-model.trim="form.notes" class="md-input" rows="3" placeholder="Catatan tambahan" style="resize: vertical; height: auto" />
        </MdField>

        <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

        <template #footer>
            <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">Batal</button>
            <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
                <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : 'Simpan' }}
            </button>
        </template>
    </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { MdModal, MdField, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
    visible: { type: Boolean, default: false },
    vehicle: { type: Object, default: null },
    submitting: { type: Boolean, default: false },
    error: { type: String, default: '' },
    // Tipe yang sudah ada, untuk saran isian.
    typeSuggestions: { type: Array, default: () => [] }
})

const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.vehicle?.id))

const emptyForm = () => ({
    name: '',
    title: '',
    type: '',
    plate_number: '',
    notes: ''
})

// "kt  1234ab " → "KT 1234AB". Kolom DB char(30) menambah spasi di belakang.
const normalizePlate = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').toUpperCase()

const form = ref(emptyForm())
const errors = ref({})

watch(
    () => props.visible,
    (val) => {
        if (val) {
            errors.value = {}
            if (props.vehicle) {
                form.value = {
                    name: props.vehicle.name || '',
                    title: props.vehicle.title || '',
                    type: props.vehicle.type || '',
                    plate_number: normalizePlate(props.vehicle.plate_number),
                    notes: props.vehicle.notes || ''
                }
            } else {
                form.value = emptyForm()
            }
        }
    }
)

function validate() {
    const errs = {}
    if (!form.value.name) errs.name = 'Nama wajib diisi.'
    if (!normalizePlate(form.value.plate_number)) errs.plate_number = 'Nomor polisi wajib diisi.'
    errors.value = errs
    return Object.keys(errs).length === 0
}

function onSubmit() {
    if (!validate()) return
    const payload = {
        name: form.value.name
    }
    if (form.value.title) payload.title = form.value.title
    if (form.value.type) payload.type = form.value.type
    payload.plate_number = normalizePlate(form.value.plate_number)
    if (form.value.notes) payload.notes = form.value.notes
    emit('submit', payload)
}

function onCancel() {
    emit('cancel')
}
</script>
