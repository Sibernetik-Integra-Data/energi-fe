<template>
  <div class="profile-shell">
    <BaseSidebar :items="navigation" :user="user" />

    <div class="profile-main">
      <BaseHeader
        eyebrow="Profile"
        title="Profile"
        :notifications="0"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />

      <main class="profile-content">
        <div class="profile-layout">
          <!-- Left panel: identity card + nav -->
          <aside class="profile-sidebar-card">
            <div class="profile-id-card">
              <div class="profile-id-avatar-wrap">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  :alt="fullName"
                  class="profile-id-avatar-img"
                />
                <div v-else class="profile-id-avatar-initials">{{ initials }}</div>
              </div>
              <p class="profile-id-name">{{ fullName }}</p>
              <p v-if="profile?.jobTitle" class="profile-id-job">{{ profile.jobTitle }}</p>
              <p v-if="profile?.id" class="profile-id-uid">ID{{ profile.id }}</p>
            </div>

            <nav class="profile-nav" aria-label="Profile navigation">
              <button
                class="profile-nav-item"
                :class="{ 'is-active': activeSection === 'profile' }"
                type="button"
                @click="activeSection = 'profile'"
              >
                <span class="profile-nav-item-icon">
                  <BaseIcon name="profile" :size="16" />
                </span>
                Profile
              </button>

              <button
                class="profile-nav-item"
                :class="{ 'is-active': activeSection === 'password' }"
                type="button"
                @click="activeSection = 'password'"
              >
                <span class="profile-nav-item-icon">
                  <BaseIcon name="key" :size="16" />
                </span>
                Ubah Kata Sandi
              </button>

              <div class="profile-nav-divider" aria-hidden="true"></div>

              <button class="profile-nav-item profile-nav-item--logout" type="button" @click="handleLogout">
                <span class="profile-nav-item-icon">
                  <BaseIcon name="logout" :size="16" />
                </span>
                Logout
              </button>
            </nav>
          </aside>

          <!-- Right panel: profile detail / change password -->
          <section class="profile-detail-card" aria-label="Profile details">
            <!-- Profile section -->
            <template v-if="activeSection === 'profile'">
              <!-- Photo upload row -->
              <div class="profile-photo-row">
                <div class="profile-photo-preview">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    :alt="fullName"
                    class="profile-photo-preview-img"
                  />
                  <div v-else class="profile-photo-preview-placeholder">
                    <BaseIcon name="profile" :size="32" />
                  </div>
                </div>
                <div class="profile-photo-info">
                  <p class="profile-photo-label">Foto Profil</p>
                  <p class="profile-photo-hint">Optimal size 300 x 300 pixels with file size: Maximum 10 MB.</p>
                  <p class="profile-photo-hint">Allowed file extensions: JPG, JPEG, PNG.</p>
                  <label class="profile-photo-btn" role="button" tabindex="0">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      class="profile-photo-input"
                      @change="handlePhotoChange"
                    />
                    Choose Photo
                  </label>
                </div>
              </div>

              <!-- Fields grid -->
              <div class="profile-fields-grid">
                <div class="profile-field">
                  <label class="profile-field-label">Nama Depan</label>
                  <div class="profile-field-value">{{ profile?.firstName || '-' }}</div>
                </div>

                <div class="profile-field">
                  <label class="profile-field-label">Nama Belakang</label>
                  <div class="profile-field-value">{{ profile?.lastName || '-' }}</div>
                </div>

                <div class="profile-field">
                  <label class="profile-field-label">Tanggal Lahir</label>
                  <div class="profile-field-value">{{ profile?.birthDate || '-' }}</div>
                </div>

                <div class="profile-field">
                  <label class="profile-field-label">Marital Status</label>
                  <div class="profile-field-value">{{ profile?.maritalStatus || '-' }}</div>
                </div>

                <div class="profile-field">
                  <label class="profile-field-label">Email</label>
                  <div class="profile-field-value">{{ profile?.email || '-' }}</div>
                </div>

                <div class="profile-field">
                  <label class="profile-field-label">Gender</label>
                  <div class="profile-field-value">{{ profile?.gender || '-' }}</div>
                </div>

                <div class="profile-field profile-field--full">
                  <label class="profile-field-label">Address 1</label>
                  <div class="profile-field-value">{{ profile?.address1 || '-' }}</div>
                </div>

                <div class="profile-field profile-field--full">
                  <label class="profile-field-label">Address 2</label>
                  <div class="profile-field-value">{{ profile?.address2 || '-' }}</div>
                </div>
              </div>

              <div class="profile-actions">
                <button class="profile-btn-edit" type="button" @click="handleEditProfile">
                  Edit Profile
                </button>
              </div>
            </template>

            <!-- Change password section -->
            <template v-else-if="activeSection === 'password'">
              <div class="profile-section-title">Ubah Kata Sandi</div>
              <div class="profile-fields-grid">
                <div class="profile-field profile-field--full">
                  <label class="profile-field-label" for="cp-current">Kata Sandi Saat Ini</label>
                  <input
                    id="cp-current"
                    v-model="passwordForm.current"
                    type="password"
                    class="profile-field-input"
                    placeholder="Masukkan kata sandi saat ini"
                    autocomplete="current-password"
                  />
                </div>
                <div class="profile-field profile-field--full">
                  <label class="profile-field-label" for="cp-new">Kata Sandi Baru</label>
                  <input
                    id="cp-new"
                    v-model="passwordForm.newPassword"
                    type="password"
                    class="profile-field-input"
                    placeholder="Masukkan kata sandi baru"
                    autocomplete="new-password"
                  />
                </div>
                <div class="profile-field profile-field--full">
                  <label class="profile-field-label" for="cp-confirm">Konfirmasi Kata Sandi Baru</label>
                  <input
                    id="cp-confirm"
                    v-model="passwordForm.confirm"
                    type="password"
                    class="profile-field-input"
                    placeholder="Ulangi kata sandi baru"
                    autocomplete="new-password"
                  />
                </div>
              </div>
              <div class="profile-actions">
                <button class="profile-btn-edit" type="button" @click="handleChangePassword">
                  Simpan
                </button>
              </div>
            </template>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import BaseIcon from '../shared/icon'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import navigation from '../shared/navigation'

const appStore = useAppStore()

const activeSection = ref('profile')
const localAvatarUrl = ref('')

// Initialize local avatar from store profile when it loads
watch(
  () => appStore.profile?.avatarUrl,
  (val) => { if (val && !localAvatarUrl.value) localAvatarUrl.value = val },
  { immediate: true }
)

const avatarUrl = computed(() => localAvatarUrl.value || user.value?.avatarUrl || '')

const passwordForm = ref({
  current: '',
  newPassword: '',
  confirm: ''
})

const profile = computed(() => appStore.profile)

const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())

const fullName = computed(() => {
  const p = profile.value
  if (!p) return user.value?.name || ''
  const first = p.firstName || ''
  const last = p.lastName || ''
  return [first, last].filter(Boolean).join(' ') || user.value?.name || ''
})

const initials = computed(() => {
  const name = fullName.value
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
})

function handlePhotoChange(event) {
  const file = event.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    localAvatarUrl.value = e.target?.result || ''
  }
  reader.readAsDataURL(file)
}

function handleEditProfile() {
  // Future: open edit mode or navigate to edit form
}

function handleChangePassword() {
  // Future: call API to change password
  passwordForm.value = { current: '', newPassword: '', confirm: '' }
}

function handleLogout() {
  void logoutFromKeycloak()
}
</script>

<style scoped>
.profile-shell {
  height: 100vh;
  display: flex;
  background: transparent;
}

.profile-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.profile-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 28px 40px;
}

/* Two-column layout */
.profile-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── Left sidebar card ─────────────────────────────────────── */
.profile-sidebar-card {
  width: 220px;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  overflow: hidden;
}

.profile-id-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 28px 16px 20px;
  border-bottom: 1px solid var(--border);
}

.profile-id-avatar-wrap {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
}

.profile-id-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-id-avatar-initials {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: #15803d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
}

.profile-id-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  text-align: center;
}

.profile-id-job {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.profile-id-uid {
  margin: 0;
  font-size: 11px;
  color: var(--text-soft);
  text-align: center;
  word-break: break-all;
}

/* Nav menu inside sidebar card */
.profile-nav {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.profile-nav-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 0;
}

.profile-nav-item {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text);
  border-radius: 12px;
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  width: 100%;
}

.profile-nav-item:hover {
  background: var(--surface-muted);
}

.profile-nav-item.is-active {
  background: var(--brand-soft);
  color: var(--brand);
}

.profile-nav-item--logout {
  color: var(--text-muted);
}

.profile-nav-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  flex-shrink: 0;
}

/* ── Right detail card ─────────────────────────────────────── */
.profile-detail-card {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

/* Photo upload row */
.profile-photo-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.profile-photo-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--brand-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  color: var(--brand);
}

.profile-photo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-photo-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.profile-photo-label {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.profile-photo-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-soft);
  line-height: 1.5;
}

.profile-photo-btn {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  padding: 7px 16px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  user-select: none;
  transition: background 140ms;
}

.profile-photo-btn:hover {
  background: var(--surface-muted);
}

.profile-photo-input {
  display: none;
}

/* Fields grid */
.profile-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.profile-field--full {
  grid-column: 1 / -1;
}

.profile-field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.profile-field-value {
  padding: 10px 14px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text);
  min-height: 40px;
}

/* Password form */
.profile-field-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color 150ms;
}

.profile-field-input:focus {
  border-color: var(--brand);
  background: var(--surface);
}

/* Actions bar */
.profile-actions {
  display: flex;
  justify-content: flex-end;
}

.profile-btn-edit {
  appearance: none;
  border: 0;
  padding: 10px 28px;
  border-radius: 999px;
  background: var(--text);
  color: var(--surface);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 150ms;
}

.profile-btn-edit:hover {
  opacity: 0.88;
}

/* Responsive */
@media (max-width: 860px) {
  .profile-layout {
    flex-direction: column;
  }

  .profile-sidebar-card {
    width: 100%;
  }
}
</style>
