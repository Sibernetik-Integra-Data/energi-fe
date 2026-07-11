**Dark / Light Mode — Implementation Summary**

- **Goal:** Add a persistent, accessible, and theme-aware dark / light mode toggle to the application and expose it as a modern UI control inside the profile dropdown (the `BaseHeader.vue` user menu).

**High-level steps**

1. Add CSS theme variables and a dark-theme class in `src/index.css` so all colors derive from variables.
2. Create a small theme utility `src/utils/theme.js` to initialize theme on startup, toggle theme, and persist user preference in `localStorage`.
3. Call the theme initializer from the app entry (e.g., `src/main.js`) before mounting the app.
4. Add a themed toggle button to the profile dropdown in `src/modules/shared/header/BaseHeader.vue` that calls the theme toggle utility and updates its icon/label.

**File-by-file summary and examples**

- `src/index.css` (or global CSS):
  - Define base variables under `:root` (e.g., `--surface`, `--text`, `--border`, `--surface-muted`, `--text-muted`).
  - Define `.theme-dark` with the same variable names overridden for dark appearance.
  - Apply transitions for `background-color` and `color` so switches feel smooth.

- `src/utils/theme.js` (example):
  - Exports `initTheme()`, `toggleTheme()`, and `isDark()`.
  - `initTheme()` reads `localStorage` (fallback to `prefers-color-scheme`) and sets `document.documentElement.classList.toggle('theme-dark', ...)`.
  - `toggleTheme()` toggles the class and writes the chosen value to `localStorage`.
  - Keep the utility small and side-effect limited so it’s easy to test.

- `src/main.js` (or equivalent):
  - Import and call `initTheme()` before `createApp(...).mount(...)` so initial paint uses the correct theme.

- `src/modules/shared/header/BaseHeader.vue`:
  - Add a new menu item alongside Logout in the user menu panel.
  - Use an icon that communicates state (`moon` for dark, `sun` for light) and a label that toggles between “Dark mode” / “Light mode”.
  - Use the existing `.header__user-menu-item` styles to maintain visual consistency but you can add a modifier class if you want a slightly different treatment.
  - Implement a `handleToggleTheme()` method that calls `toggleTheme()` and updates a local reactive `isDarkMode` value.
  - Include `aria-pressed` (true/false) or `aria-label` for better accessibility.

**Accessibility & UX notes**

- Keep the control keyboard-focusable and expose `role="menuitem"` (matching existing Logout button). Set `aria-pressed` to indicate on/off state.
- Persist preference in `localStorage` so the user’s choice survives reloads.
- Respect OS-level preference on first load by checking `window.matchMedia('(prefers-color-scheme: dark)')` when no stored preference exists.
- Use clear icons (sun / moon) and concise labels.
- Add smooth color transitions to avoid jarring flashes.

**Testing & verification**

- Verify initial theme on a cold load with no `localStorage` entry matches OS preference.
- Toggle the control and reload — verify the chosen theme persists.
- Inspect various pages/components to ensure all colors come from variables and look correct in both modes.
- Check keyboard-only navigation and screen-reader announcements for the toggle.

**Example code snippets**

- CSS variables (minimal):

  :root { /* light */
    --surface: #ffffff;
    --surface-muted: #f8fafc;
    --text: #0f172a;
    --text-muted: #6b7280;
    --border: #e6e9ee;
    transition: background-color 240ms ease, color 240ms ease;
  }

  .theme-dark { /* dark overrides */
    --surface: #0f172a;
    --surface-muted: #0b1220;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --border: #152033;
  }

- `src/utils/theme.js` (minimal):

  const THEME_KEY = 'theme-preference';

  export function initTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored || (prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    } catch (e) { /* noop */ }
  }

  export function toggleTheme() {
    const isNowDark = document.documentElement.classList.toggle('theme-dark');
    try { localStorage.setItem(THEME_KEY, isNowDark ? 'dark' : 'light'); } catch (e) {}
    return isNowDark;
  }

  export function isDark() { return document.documentElement.classList.contains('theme-dark'); }

- `BaseHeader.vue` (menu item example):

  <button class="header__user-menu-item" type="button" role="menuitem" @click="handleToggleTheme" :aria-pressed="isDarkMode">
    <span class="header__user-menu-item-icon">
      <BaseIcon :name="isDarkMode ? 'sun' : 'moon'" :size="16" />
    </span>
    <span>{{ isDarkMode ? 'Light mode' : 'Dark mode' }}</span>
  </button>

**Next steps I can take for you**

- Implement the exact files and edits (create `src/utils/theme.js`, patch `src/index.css`, call `initTheme()` in `src/main.js`, and update `BaseHeader.vue`).
- Or, just implement the `BaseHeader.vue` change so you can test the UI first.

If you want, I can now implement these changes directly in the repo. Which option do you prefer?