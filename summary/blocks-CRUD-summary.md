Blocks UI and API Integration — Summary

Objective
- Implement a frontend UI for "Blocks" under the existing "Master Data" sidebar dropdown.
- Provide full CRUD (Create, Read, Update, Delete) support against the backend endpoints.

Backend endpoints (routes)
- GET /api/block            — List blocks
- POST /api/block           — Create block
- GET /api/block/:id        — Get block by id
- PUT /api/block/:id        — Update block
- DELETE /api/block/:id     — Delete block

Request signature and headers
- Each request must include signature headers:
  - `X-Signature`: computed signature string
  - `X-Signature-Timestamp`: timestamp (string)
  - `X-Signature-UUID`: uuid
  - `Authorization`: optional `Bearer <token>` (if token exists)
- Signature calculation requires the HTTP method and request path (e.g., `GET /api/block`).
- Frontend will use existing authentication utilities (Keycloak token) to obtain `token`, and user info will be read from the token when storing `created_by` / `updated_by`.

API response example (GET /api/block)
- The server returns JSON like:
  {
    "code": 0,
    "message": "block list",
    "data": [ { id, name, plants_count, wide, created_at, created_by, updated_at, updated_by }, ... ],
    "meta": ""
  }
- Some fields may be `null`; UI must show empty fields for those values.

Frontend behavior and UI design
- Follow the application theme and component styles already used in the project.
- Blocks list view:
  - Table or card list showing `name`, `plants_count`, `wide`, `created_at`, `created_by`, `updated_at`, `updated_by`.
  - Empty/null values displayed as blank.
  - Add a filter/search input (text) to filter blocks by `name` and optional numeric filters for `plants_count`.
  - Paging is optional; initial implementation will fetch and show all items from GET /api/block.
- CRUD interactions:
  - Create: modal or dedicated page with `name` (required), optional `plants_count` (integer), `wide` (number). On create, set `created_at` and `created_by` (WIB timestamp and username from Keycloak token).
  - Update: similar form to edit fields. On update, set `updated_at` and `updated_by` (WIB timestamp and username).
  - Delete: confirmation modal before calling DELETE.
- Validation: `name` required; show inline errors.

Timezone and user attribution
- Use Indonesia WIB timezone for `created_at` and `updated_at` values when sending create/update requests. Convert client time to WIB or request backend to accept timezone-aware timestamps — prefer sending an ISO string in WIB.
- Determine `created_by` and `updated_by` from Keycloak token claims (e.g., `preferred_username` or `email`), reusing existing auth utilities.

Files and implementation plan (front-end)
- Add API client: `src/api/block.js` or extend existing API utils to build signature headers and helper methods for `list`, `create`, `getById`, `update`, `delete`.
- Components:
  - `src/modules/masterdata/BlocksList.vue` — main list and filter UI
  - `src/modules/masterdata/BlockForm.vue` — modal/form for create/edit
- Routing & Sidebar:
  - Add a route for `/master-data/blocks` and add entry to Master Data dropdown to navigate to Blocks UI.
- Utils:
  - Reuse an existing signature generation helper; if missing, implement a small helper that takes method + path + body to compute `X-Signature` (details depend on backend algorithm; document integration points).
  - Use existing Keycloak auth plugin to get token and user info.

Validation & Testing
- Manually verify each endpoint with the frontend using a local backend or staging instance.
- Verify signatures are included and accepted by backend.
- Confirm `created_by`/`updated_by` match current user from token.

Notes & Open questions
- Signature algorithm details: frontend must use the same algorithm as backend. If the algorithm requires a secret unavailable to frontend, we must call a backend helper endpoint to obtain a signature or use a JS client key. Clarify if signature can be generated in-browser or requires server-side assistance.
- Time format: confirm backend expects WIB ISO string or UTC with timezone offset. Current plan: convert to WIB ISO string on client before sending.

Next steps
1. Inspect existing auth and API utilities to find signature helper and Keycloak token extraction.
2. Implement `src/api/block.js` with signature header injection.
3. Implement `BlocksList.vue` and `BlockForm.vue`, wire routes and sidebar.
4. Test CRUD flows and adjust per backend requirements.

Created by: front-end implementation plan
Date: 2026-04-20
