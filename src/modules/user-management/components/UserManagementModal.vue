<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-60 flex items-center justify-center bg-black/55 p-4" @click.self="requestClose">
      <form
        ref="dialogRef"
        class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-(--border) bg-(--surface) text-(--text) shadow-2xl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @submit.prevent="submit"
        @keydown.esc.prevent="requestClose"
        @keydown.tab="trapFocus"
      >
        <header class="sticky top-0 z-1 flex items-center justify-between border-b border-(--border) bg-(--surface) px-6 py-4">
          <div>
            <h2 :id="titleId" class="m-0 text-lg font-bold">{{ mode === 'add' ? 'Tambah User' : 'Edit User' }}</h2>
            <p class="m-0 mt-1 text-xs text-(--text-muted)">Kelola profil Keycloak, User Access, dan role client mobile.</p>
          </div>
          <button type="button" class="icon-button" aria-label="Tutup" :disabled="saving" @click="requestClose">
            <BaseIcon name="x" :size="18" />
          </button>
        </header>

        <div class="flex flex-col gap-6 p-6">
          <p v-if="visibleError" class="m-0 rounded-xl bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)" role="alert">{{ visibleError }}</p>

          <section class="form-section">
            <h3>Informasi akun</h3>
            <div class="form-grid">
              <label class="field"><span>Username *</span><input v-model.trim="form.username" required :readonly="mode === 'edit'" autocomplete="username" /></label>
              <label class="field"><span>Email *</span><input v-model.trim="form.email" required type="email" autocomplete="email" /></label>
              <label class="field"><span>Nama Depan *</span><input v-model.trim="form.firstName" required /></label>
              <label class="field"><span>Nama Belakang</span><input v-model.trim="form.lastName" /></label>
            </div>
          </section>

          <section class="form-section">
            <h3>Profil Energi</h3>
            <div class="form-grid">
              <label class="field"><span>Tanggal Lahir</span><input v-model="form.birthDate" type="date" /></label>
              <label class="field"><span>Marital Status</span>
                <select v-model="form.maritalStatus"><option value="">Pilih status</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select>
              </label>
              <label class="field"><span>Gender</span>
                <select v-model="form.gender"><option value="">Pilih gender</option><option value="Laki-Laki">Laki-Laki</option><option value="Perempuan">Perempuan</option></select>
              </label>
              <label class="field"><span>User Access *</span>
                <select v-model="form.access" required :disabled="isProtectedSelf">
                  <option value="" disabled>Pilih akses</option>
                  <option v-for="option in configuration.accessOptions || []" :key="option" :value="option">{{ option }}</option>
                </select>
              </label>
              <label class="field col-span-2 max-[640px]:col-span-1"><span>Address 1</span><textarea v-model.trim="form.address1" rows="2"></textarea></label>
              <label class="field col-span-2 max-[640px]:col-span-1"><span>Address 2</span><textarea v-model.trim="form.address2" rows="2"></textarea></label>
            </div>
            <p v-if="isProtectedSelf" class="m-0 text-xs text-(--text-soft)">User Access akun Owner yang sedang digunakan tidak dapat diturunkan.</p>
          </section>

          <section class="form-section">
            <h3>Direct role mapping — {{ configuration.client?.clientId || 'mobile' }}</h3>
            <div class="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
              <label v-for="role in configuration.client?.roles || []" :key="role.id || role.name" class="flex items-start gap-2 rounded-xl border border-(--border) bg-(--surface-muted) p-3 text-sm">
                <input v-model="form.directClientRoles" type="checkbox" :value="role.name" class="mt-0.5 accent-(--brand)" />
                <span><strong class="block">{{ role.name }}</strong><small v-if="role.description" class="text-(--text-soft)">{{ role.description }}</small></span>
              </label>
            </div>
            <p v-if="inheritedRoles.length" class="m-0 mt-3 text-xs text-(--text-muted)">Inherited roles (read-only): {{ inheritedRoles.join(', ') }}</p>
          </section>

          <section class="form-section">
            <h3>{{ mode === 'add' ? 'Password awal' : 'Reset password (opsional)' }}</h3>
            <div class="form-grid">
              <label class="field"><span>Password{{ mode === 'add' ? ' *' : '' }}</span><input v-model="form.password" :required="mode === 'add'" minlength="8" type="password" autocomplete="new-password" :placeholder="mode === 'edit' ? 'Kosongkan jika tidak diubah' : ''" /></label>
              <label class="field"><span>Konfirmasi Password{{ mode === 'add' || form.password ? ' *' : '' }}</span><input v-model="form.confirmPassword" :required="mode === 'add' || Boolean(form.password)" type="password" autocomplete="new-password" /></label>
            </div>
          </section>

          <footer class="flex justify-end gap-3 border-t border-(--border) pt-5">
            <button type="button" class="secondary-button" :disabled="saving" @click="requestClose">Batal</button>
            <button type="submit" class="primary-button" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          </footer>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import BaseIcon from '../../shared/icon'

const props = defineProps({
  user: { type: Object, default: null },
  mode: { type: String, default: 'edit' },
  configuration: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['close', 'save'])
const dialogRef = ref(null)
const localError = ref('')
const titleId = `user-modal-${Math.random().toString(36).slice(2)}`
const inheritedRoles = computed(() => props.user?.inheritedClientRoles || [])
const isProtectedSelf = computed(() => props.user?.permissions?.manageAccess === false)
const visibleError = computed(() => localError.value || props.error)
const form = reactive({
  username: props.user?.username || '', email: props.user?.email || '', firstName: props.user?.firstName || '', lastName: props.user?.lastName || '',
  birthDate: props.user?.birthDate || '', maritalStatus: props.user?.maritalStatus || '', gender: props.user?.gender || '',
  access: props.user?.access || '', address1: props.user?.address1 || '', address2: props.user?.address2 || '',
  directClientRoles: [...(props.user?.directClientRoles || [])], password: '', confirmPassword: ''
})

function requestClose() { if (!props.saving) emit('close') }
function trapFocus(event) {
  const elements = [...(dialogRef.value?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])') || [])]
  if (!elements.length) return
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
function submit() {
  localError.value = ''
  if (form.password && form.password.length < 8) { localError.value = 'Password minimal 8 karakter.'; return }
  if (form.password !== form.confirmPassword) { localError.value = 'Konfirmasi password tidak sama.'; return }
  emit('save', { ...form, directClientRoles: [...form.directClientRoles] })
}
onMounted(() => nextTick(() => dialogRef.value?.querySelector('input:not([readonly])')?.focus()))
</script>

<style scoped>
.form-section { display: flex; flex-direction: column; gap: 14px; }
.form-section h3 { margin: 0; font-size: 14px; font-weight: 800; color: var(--text); }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; }
.field { display: flex; flex-direction: column; gap: 6px; color: var(--text-muted); font-size: 12px; font-weight: 700; }
.field input, .field select, .field textarea { width: 100%; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-muted); color: var(--text); padding: 10px 12px; font-size: 14px; font-weight: 400; outline: none; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--brand); background: var(--surface); }
.field input[readonly], .field select:disabled { cursor: not-allowed; opacity: .65; }
.icon-button { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-muted); color: var(--text-muted); cursor: pointer; }
.primary-button, .secondary-button { border-radius: 999px; padding: 10px 22px; font-size: 13px; font-weight: 800; cursor: pointer; }
.primary-button { border: 0; background: var(--text); color: var(--surface); }
.secondary-button { border: 1px solid var(--border); background: var(--surface); color: var(--text); }
button:disabled { opacity: .5; cursor: not-allowed; }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
</style>
