<template>
    <Teleport to="body">
        <div
            v-if="visible"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="dialogTitleId"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @mousedown.self="onCancel">
            <div
                class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between">
                    <h3 :id="dialogTitleId" class="text-lg font-bold text-(--text) m-0">
                        {{ isEdit ? 'Ubah Kelompok Pekerjaan' : 'Tambah Kelompok Pekerjaan' }}
                    </h3>
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
                        <label class="text-sm font-semibold text-(--text)" for="gow-name">
                            Nama <span class="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <input
                            id="gow-name"
                            ref="nameInput"
                            v-model.trim="form.name"
                            type="text"
                            placeholder="mis. Pembersihan"
                            maxlength="100"
                            autocomplete="off"
                            :aria-invalid="!!errors.name"
                            :aria-describedby="errors.name ? 'gow-name-error' : undefined"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                            :class="
                                errors.name
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
                            " />
                        <span v-if="errors.name" id="gow-name-error" role="alert" class="text-xs text-red-500">{{ errors.name }}</span>
                    </div>

                    <!-- Detail -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="gow-detail">Keterangan</label>
                        <textarea
                            id="gow-detail"
                            v-model="form.detail"
                            rows="4"
                            placeholder="Keterangan (opsional)"
                            maxlength="2000"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                        ></textarea>
                    </div>

                    <!-- Jenis TPH: menentukan TPH mana yang boleh dipilih di sensus/penugasan -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="gow-tph-type">
                            Jenis TPH <span class="text-red-500">*</span>
                        </label>
                        <select
                            id="gow-tph-type"
                            v-model="form.tph_type"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500">
                            <option value="PERAWATAN">Perawatan</option>
                            <option value="PANEN">Panen</option>
                        </select>
                        <span class="text-xs text-(--text-soft)">
                            Pekerjaan di kelompok ini hanya bisa memakai TPH berjenis ini.
                        </span>
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
                            <span v-else>{{ isEdit ? 'Simpan Perubahan' : 'Tambah Kelompok' }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    group: { type: Object, default: null },
    submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const dialogTitleId = 'gow-dialog-title'
const nameInput = ref(null)

const isEdit = computed(() => Boolean(props.group?.id))

const emptyForm = () => ({ name: '', detail: '', tph_type: 'PERAWATAN' })

const form = ref(emptyForm())
const errors = ref({})

watch(
    () => [props.visible, props.group],
    ([visible, group]) => {
            if (visible) {
                form.value = group
                    ? { name: group.name || '', detail: group.detail || '', tph_type: group.tph_type || 'PERAWATAN' }
                    : emptyForm()
            errors.value = {}
            nextTick(() => nameInput.value?.focus())
        }
    },
    { immediate: true }
)

function validate() {
    const errs = {}
    if (!form.value.name) {
        errs.name = 'Nama wajib diisi.'
    } else if (form.value.name.length > 100) {
        errs.name = 'Nama maksimal 100 karakter.'
    }
    errors.value = errs
    return Object.keys(errs).length === 0
}

function onSubmit() {
    if (!validate()) return
    emit('submit', { name: form.value.name, detail: form.value.detail, tph_type: form.value.tph_type })
}

function onCancel() {
    emit('cancel')
}
</script>
