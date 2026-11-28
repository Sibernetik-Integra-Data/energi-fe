<template>
  <!-- Tombol bahasa "ID | EN": kode bahasa, bukan bendera; selalu terlihat. -->
  <div class="lang-switch" role="group" :aria-label="t('language.label')">
    <button
      v-for="l in SUPPORTED_LOCALES"
      :key="l.code"
      type="button"
      class="lang-switch__btn"
      :lang="l.code"
      :aria-pressed="locale === l.code"
      :aria-label="locale === l.code ? t('language.current', { name: l.name }) : t('language.switchTo', { name: l.name })"
      :title="l.name"
      @click="setLocale(l.code)">
      {{ l.label }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'

const { t, locale } = useI18n()
</script>

<style scoped>
.lang-switch {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-muted);
}

.lang-switch__btn {
  min-width: 34px;
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font: 700 12px/1 inherit;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.lang-switch__btn:hover { color: var(--text); }

.lang-switch__btn[aria-pressed="true"] {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}

.lang-switch__btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

@media (forced-colors: active) {
  .lang-switch__btn[aria-pressed="true"] { border: 1px solid CanvasText; }
}
</style>
