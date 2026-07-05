import { reactive } from 'vue'

let _nextId = 1
const _toasts = reactive([])

export function useToast() {
  function show(message, type = 'success', duration = 3500) {
    const id = _nextId++
    _toasts.push({ id, message, type })
    setTimeout(() => {
      const idx = _toasts.findIndex(t => t.id === id)
      if (idx !== -1) _toasts.splice(idx, 1)
    }, duration)
  }

  function dismiss(id) {
    const idx = _toasts.findIndex(t => t.id === id)
    if (idx !== -1) _toasts.splice(idx, 1)
  }

  return { toasts: _toasts, show, dismiss }
}
