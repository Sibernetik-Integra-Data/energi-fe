<template>
  <div class="sensus-shell">
    <BaseSidebar :items="navigation" />
    <div class="sensus-main">
      <BaseHeader eyebrow="Sensus" :title="header.title" :notifications="header.notifications" :user="header.user" />
      <main class="sensus-content">
        <SensusList :rows="list.rows" :title="list.title" :subtitle="list.subtitle" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import SensusList from './components/SensusList.vue'

const props = defineProps({ controller: { type: Object, required: true } })

const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const list = computed(() => props.controller.getList())
</script>

<style scoped>
.sensus-shell { display:flex; min-height:100vh }
.sensus-main { flex:1; display:flex; flex-direction:column }
.sensus-content { padding:24px }
</style>
