import { ref } from 'vue'

export const isRouteTransitionVisible = ref(false)

const SHOW_DELAY_MS = 120
const MIN_VISIBLE_MS = 220
let showTimer = null
let hideTimer = null
let visibleSince = 0
let transitionId = 0

export function startRouteTransition() {
  transitionId += 1
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  showTimer = setTimeout(() => {
    isRouteTransitionVisible.value = true
    visibleSince = Date.now()
    showTimer = null
  }, SHOW_DELAY_MS)
}

export function finishRouteTransition() {
  const finishedTransitionId = transitionId
  clearTimeout(showTimer)
  showTimer = null

  if (!isRouteTransitionVisible.value) return

  const remainingVisibleTime = Math.max(0, MIN_VISIBLE_MS - (Date.now() - visibleSince))
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    if (finishedTransitionId === transitionId) {
      isRouteTransitionVisible.value = false
    }
    hideTimer = null
  }, remainingVisibleTime)
}
