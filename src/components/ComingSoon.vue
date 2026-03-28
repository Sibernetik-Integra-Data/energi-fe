<template>
  <div class="coming-soon-shell">
    <BaseSidebar :items="navigation" />
    <div class="coming-soon-main">
      <BaseHeader :title="title" eyebrow="" :notifications="0" :user="user" />
      <main class="coming-soon-content">
        <div class="coming-soon-card">
          <h2>{{ title }}</h2>
          <p class="muted">This page is not available yet — coming soon.</p>
          <p>If you need this area now, contact the product team to prioritise implementation.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import BaseSidebar from '../modules/shared/sidebar'
import BaseHeader from '../modules/shared/header'
import { navigation as defaultNavigation } from '../modules/shared/navigation'

const props = defineProps({ title: { type: String, default: 'Coming Soon' } })

const navigation = defaultNavigation
const user = { name: 'User Name', role: 'Role Title', initials: 'UN' }
</script>

<style scoped>
.coming-soon-shell { display:flex; min-height:100vh }
.coming-soon-main { flex:1; display:flex; flex-direction:column }
.coming-soon-content { padding:24px }
.coming-soon-card { max-width:760px; width:100%; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:28px }
.coming-soon-card h2 { margin:0 0 8px; font-size:22px }
.coming-soon-card .muted { color:var(--text-muted); margin-bottom:12px }
</style>
