<template>
  <section v-if="items.length" class="announcements" :aria-label="t('announcement.region')">
    <div v-for="item in items" :key="item.id" :class="['announcement', `announcement--${item.level}`]"
      :role="item.level === 'danger' ? 'alert' : 'status'">
      <span class="announcement__mark" aria-hidden="true">{{ item.level === 'info' ? 'i' : '!' }}</span>

      <div class="announcement__body">
        <strong class="announcement__title">{{ item.title }}</strong>
        <span v-if="item.message" class="announcement__message">{{ item.message }}</span>
        <template v-if="item.linkUrl">
          <RouterLink v-if="item.isInternalLink" :to="item.linkUrl" class="announcement__link">{{ item.linkLabel }}</RouterLink>
          <a v-else :href="item.linkUrl" target="_blank" rel="noopener noreferrer" class="announcement__link">{{ item.linkLabel }}</a>
        </template>
      </div>

      <button v-if="item.dismissible" type="button" class="announcement__close" :aria-label="t('announcement.close')"
        @click="dismissAnnouncement(item)">×</button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { dismissAnnouncement, useAnnouncements } from './announcements'

const items = useAnnouncements()
</script>

<style scoped>
.announcements {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 20px 0 24px;
  background: var(--bg);
}

.announcement {
  --tone: var(--info);
  --tone-soft: var(--info-soft);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px 10px 14px;
  border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent);
  border-left: 4px solid var(--tone);
  border-radius: var(--radius-sm);
  background: var(--tone-soft);
  color: var(--text);
  font-size: 14px;
  line-height: 20px;
}

.announcement--warning {
  --tone: var(--warning);
  --tone-soft: var(--warning-soft);
}

.announcement--danger {
  --tone: var(--danger);
  --tone-soft: var(--danger-soft);
}

.announcement__mark {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--tone);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.announcement__body {
  flex: 1;
  min-width: 0;
}

.announcement__title {
  font-weight: 700;
  margin-right: 6px;
}

.announcement__message {
  white-space: pre-line;
  color: var(--text-muted);
}

.announcement__link {
  margin-left: 6px;
  color: var(--tone);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.announcement__close {
  flex: none;
  width: 28px;
  height: 28px;
  margin: -4px -4px 0 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.announcement__close:hover {
  background: color-mix(in srgb, var(--tone) 15%, transparent);
  color: var(--text);
}

@media (max-width: 920px) {
  .announcements {
    padding: 8px 16px 0;
  }
}
</style>
