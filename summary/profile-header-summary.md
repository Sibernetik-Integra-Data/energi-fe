Profile Header & Dropdown — Implementation Summary

Overview
- Add a user-profile menu in the global header with a compact avatar button.
- Clicking the avatar opens a dropdown menu containing: a compact profile card (avatar + name + job + id), separators, and action links including `Profile`, `Change Password`, and `Logout`.
- Clicking `Profile` navigates to the profile page under the existing modular area: `src/modules/profile`.
- The UI must support both Light and Dark themes and follow the provided design reference images.

UX & Layout Details
- Avatar button: circular, 40–56px diameter depending on header density.
- Dropdown: a white card in light mode, a dark-surface card in dark mode, with a subtle drop shadow and rounded corners.
- Top area of the dropdown: large circular avatar thumbnail (96px) centered, directly to the right area (as in design) include the upload helper block in the full profile page only. In the header dropdown, show a compact column:
  - Combined name: `firstName + " " + lastName` (bold)
  - Job title (small, muted)
  - User ID (small, muted)
- Below the compact profile area: action list with icons and labels:
  - Profile (navigates to `/profile`)
  - Change Password (opens a password change flow/modal)
  - Logout (triggers logout flow)

Data to Display
- The dropdown compact profile and the profile page must display user fields obtained from Keycloak via backend token/session:
  - `firstName` (displayed in bold)  — required
  - `lastName` — required
  - `email` — required
  - `gender` — optional, if available from user attributes
  - `maritalStatus` — optional, read from user attributes
  - `address1` — optional, read from user attributes
  - `address2` — optional, read from user attributes
  - `jobTitle` — optional, read from attributes or local profile data
  - `userId` — unique Keycloak id (shown as small text in the compact card)

Data Source & Security
- The frontend will not call Keycloak directly. The frontend will use the authenticated backend which returns profile/userinfo derived from the Keycloak token.
- Backend endpoints expected:
  - `GET /api/auth/me` — returns the current user summary extracted from Keycloak token/session. Example response:
    {
      "id": "uuid-or-keycloak-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "gender": "male",
      "maritalStatus": "single",
      "address1": "Cityname, Region",
      "address2": "Street address",
      "jobTitle": "Kepala Kebun"
    }
- All requests must send the existing session cookie / authorization header used by your app; do not expose the raw Keycloak token to third-party scripts. Follow the same auth pattern your app already uses.

Routing & Navigation
- The `Profile` button in the dropdown navigates to route `/profile` (or the existing route used by `src/modules/profile`).
- Implement an accessible link element for navigation; use router `push` rather than full page reload.

Accessibility
- Avatar button must have `aria-haspopup="menu"` and `aria-expanded` toggled.
- The dropdown must be keyboard-focusable, close on Escape, and trap focus while open if it contains interactive controls. Menu items should be reachable with Up/Down arrow keys.
- Provide `alt` text for avatar images and icons.

Theme Guidance (Light / Dark)
- Light mode: white card with 8–12px drop shadow, border radius 12px, text colors: title `#111827`, muted `#6B7280`, background `#FFFFFF`.
- Dark mode: dark-surface card (e.g. `#0F172A` or your project token), muted text `#9CA3AF`, primary text `#E6EEF8`.
- Use existing Tailwind tokens/config from `energi-fe` where possible; add component-level CSS classes that respect `dark:` variants.

Visual Details (per provided design)
- Left side (profile panel): a vertical card with avatar (circular), name, job title, and small user ID. Under that a small vertical menu with `Profile`, `Change Password`, `Logout`.
- Right side (profile page): large form-like card with avatar preview, `Choose Photo` button, and greyed read-only fields for the listed user attributes. The `Edit Profile` button shown at the bottom-right.
- Dropdown (header) should mirror the compact left-side card in the design: avatar, full name, job title, and user id.

Implementation Notes (for frontend dev)
- Component location suggestion:
  - Header avatar button: `src/modules/shared/header/BaseHeader.vue` (already present)
  - Dropdown component: `src/components/ui/UserDropdown.vue` or `src/modules/shared/header/UserMenu.vue`
  - Profile page: `src/modules/profile/views/ProfileView.vue` and store/actions: `src/modules/profile/store.js` (or adapt to existing store pattern)
- Use composition API (Vue 3) or project convention. Keep logic modular and testable.
- Use existing design tokens, Tailwind classes, and project icons.

Edge Cases & Fallbacks
- When `address1`/`address2`/`gender`/`maritalStatus` missing, hide the corresponding field or show `-` placeholder.
- If avatar URL not available, show initials avatar derived from `firstName` + `lastName`.

Testing & QA
- Manual tests:
  - Verify dropdown opens and closes via click and keyboard.
  - Verify `Profile` navigation goes to `/profile`.
  - Verify user data maps correctly from `GET /api/auth/me`.
  - Verify light/dark theming matches app theme.

Next Steps (suggested)
- Implement `UserDropdown` component and wire it to `BaseHeader.vue`.
- Implement `GET /api/auth/me` on backend to expose safe user info.
- Implement `ProfileView.vue` inside `src/modules/profile` and connect to existing store/router.

Created: 2026-04-23
Author: (summary by developer)
