<template>
  <div class="h-screen flex bg-transparent max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <BaseHeader
        :eyebrow="t('nav.masterData')"
        :title="t('nav.typeOfUnit')"
        :notifications="0"
        :user="user"
        :on-logout="logoutFromKeycloak" />
      <main class="flex-1 min-w-0 p-6 overflow-y-auto max-[920px]:p-4.5">
        <TypeOfUnitList />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseHeader from '../../shared/header'
import BaseSidebar from '../../shared/sidebar'
import TypeOfUnitList from './components/TypeOfUnitList.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../../auth/keycloak'
import { useAppStore } from '../../../stores'
import { navigation as sharedNavigation } from '../../shared/navigation'

const { t } = useI18n()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
</script>
