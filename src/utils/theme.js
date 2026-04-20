const THEME_KEY = 'energi-theme'

/**
 * Call once on app startup (before mount).
 * Reads localStorage, falls back to OS preference.
 */
export function initTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    // Default to light mode when no stored preference exists.
    // This intentionally ignores the OS `prefers-color-scheme` so first
    // visits open in light mode per product preference.
    const theme = stored ?? 'light'
    applyTheme(theme === 'dark')
  } catch {
    // silently ignore (e.g. storage blocked)
  }
}

/**
 * Toggle between dark and light. Returns true if now dark.
 */
export function toggleTheme() {
  const isNowDark = !isDark()
  applyTheme(isNowDark)
  try {
    localStorage.setItem(THEME_KEY, isNowDark ? 'dark' : 'light')
  } catch {
    // silently ignore
  }
  return isNowDark
}

/** Returns true if dark theme is currently active. */
export function isDark() {
  return document.documentElement.classList.contains('theme-dark')
}

function applyTheme(dark) {
  document.documentElement.classList.toggle('theme-dark', dark)
  document.documentElement.style.setProperty('color-scheme', dark ? 'dark' : 'light')
}
