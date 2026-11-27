import { computed } from 'vue'
import { profileToUser, getAuthenticatedUser } from './keycloak'
import { useAppStore } from '../stores'
import { canManageMasterData } from './access'

/** true jika pengguna boleh menambah/mengubah/menghapus data master. */
export function useCanManageMasterData() {
  const appStore = useAppStore()
  return computed(() => canManageMasterData(profileToUser(appStore.profile) || getAuthenticatedUser()))
}
