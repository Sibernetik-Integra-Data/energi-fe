<template>
  <!-- Tombol bahasa "ID | EN": bendera sebagai penanda visual, kode bahasa tetap
       tertulis (bendera = negara, bukan bahasa). Bendera SVG agar tampil juga di
       Windows, yang tidak merender emoji bendera. -->
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
      <svg v-if="l.code === 'id'" class="lang-switch__flag" viewBox="0 0 3 2" aria-hidden="true" focusable="false">
        <rect width="3" height="1" fill="#CE1126" />
        <rect y="1" width="3" height="1" fill="#FFFFFF" />
      </svg>
      <svg v-else-if="l.code === 'en'" class="lang-switch__flag" viewBox="0 0 60 30" aria-hidden="true" focusable="false">
        <clipPath id="lang-uk-clip"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" stroke-width="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#lang-uk-clip)" stroke="#C8102E" stroke-width="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" stroke-width="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6" />
      </svg>
      <span>{{ l.label }}</span>
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 34px;
  height: 28px;
  padding: 0 9px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.lang-switch__btn:hover { color: var(--text); }

/* Bendera 3:2 dengan garis tepi tipis agar putih bendera ID terlihat di latar terang. */
.lang-switch__flag {
  width: 18px;
  height: 12px;
  flex: 0 0 auto;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.18);
}

/* Tombol yang tidak aktif: bendera sedikit pudar, jadi pilihan aktif lebih jelas. */
.lang-switch__btn[aria-pressed="false"] .lang-switch__flag { opacity: 0.7; }

@media (max-width: 480px) {
  .lang-switch__btn { padding: 0 7px; gap: 4px; }
}

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
