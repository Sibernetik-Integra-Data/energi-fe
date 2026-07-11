Vehicle CRUD UI - Summary

Purpose
- Add a modern, theme-consistent CRUD interface for `vehicle` (master data) in `modules/masterdata/vehicle`.
- The UI will consume the backend endpoint mounted at `/api/vehicle` and respect the app theme and layout.

Backend API (overview)
- Base path: `/api/vehicle`
- Response wrapper (example - list):
  {
    "code": 0,
    "message": "vehicle list",
    "data": [ /* array of vehicle objects */ ],
    "meta": ""
  }

Endpoints and payloads
- List: GET `/api/vehicle`
  - Response `data`: array of vehicle objects with fields: `id, name, title, type, notes, created_at, updated_at`.
- Get: GET `/api/vehicle/:id`
  - Response `data`: single vehicle object.
- Create: POST `/api/vehicle`
  - Request body (JSON): { name, title, type, notes }
  - Server will set `created_at` and `updated_at` (do not send timestamps from client).
  - Response `data`: created object (includes server timestamps and `id`).
- Update: PUT `/api/vehicle/:id`
  - Request body (JSON): partial or full { name, title, type, notes }
  - Server will set `updated_at`.
  - Response `data`: updated object.
- Delete: DELETE `/api/vehicle/:id`
  - Response: success code; no `data` expected (backend returns standard wrapper).

Signature & security headers (required)
- Every request must include these headers:
  - `X-Signature`: <signature>
  - `X-Signature-Timestamp`: <timestamp>
  - `X-Signature-UUID`: <uuid>
  - `Authorization`: `Bearer <token>` (optional depending on route)
- Important: signature generation requires the HTTP method + API path (e.g. `GET /api/vehicle`) and the timestamp/uuid. The frontend must call the same signing routine/secret used by the backend or request a signing service from the backend. Do not hard-code the signature.
- The frontend should compute signature immediately before sending the request so `X-Signature-Timestamp` is fresh.

UI structure and components (already scaffolded)
- Files (already created):
  - `modules/masterdata/vehicle/controller.js` — client-side API wrapper / controller.
  - `modules/masterdata/vehicle/index.js` — module entry (routes, store integration).
  - `modules/masterdata/vehicle/model.js` — optional client model / validation rules.
  - `modules/masterdata/vehicle/view.vue` — page container.
  - `modules/masterdata/vehicle/components/VehicleList.vue` — list view (table/grid) with actions.
  - `modules/masterdata/vehicle/components/VehicleForm.vue` — create/edit form (modal or drawer).

UI behavior and UX notes
- `VehicleList.vue`:
  - Table with columns `name`, `title`, `type`, `notes`, `created_at`, `updated_at`.
  - Controls: search (filter by name/type), sort, pagination (server side if dataset grows).
  - Actions per row: Edit (open `VehicleForm`), Delete (confirm modal).
  - Global action: "New Vehicle" button opens `VehicleForm`.
- `VehicleForm.vue`:
  - Use form validation: `name` required, `title` optional, `type` optional, `notes` optional.
  - On submit: call controller to POST or PUT; show loading indicator and disable submit.
  - Do not include `created_at`/`updated_at` in requests.
- Error handling: show API error message from response `message` and handle 401/403 separately (auth/signature problems).

Integration notes
- Signature helper: place a single helper in `src/utils/signature.js` (or reuse existing) that returns headers object for any (method, path, body).
- Time source: rely on server to set `created_at` and `updated_at` — do not set these timestamps on client.
- Optimistic UI: optional; prefer to refresh list from server after create/update/delete to guarantee timestamps and consistency.
- Concurrency: use `updated_at` for conflict detection if needed later.

Next steps (after confirmation)
- Implement the controller API wrapper with signature header injection.
- Implement `VehicleList.vue` and `VehicleForm.vue` UI and wire them into `view.vue`.
- Add unit/e2e tests for API integration (mock signature) and form validation.

If you confirm, I will implement the controller and components next and run the app to test requests against `/api/vehicle`.