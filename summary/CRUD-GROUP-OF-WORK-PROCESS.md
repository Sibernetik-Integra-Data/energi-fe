Group of Work — CRUD & UI Summary

Purpose
- Describe required CRUD operations and UI behavior for `GroupOfWork` (endpoint: `/api/group_of_work`).

API Endpoints (backend)
- List: GET /api/group_of_work
  - Response body (example):
    {
      "code": 0,
      "message": "group_of_work list",
      "data": [ { "id": "1", "name": "Pembersihan" }, ... ],
      "meta": ""
    }
- Create: POST /api/group_of_work
  - Body: JSON with at least `name` (string). Backend will add `created_by` from auth and use server time for timestamps.
- Get by ID: GET /api/group_of_work/{id}
- Update: PUT /api/group_of_work/{id}
  - Body: JSON with `name`; backend will add `updated_by` and perform server-side timestamping.
- Delete: DELETE /api/group_of_work/{id}
  - Backend performs logical delete (clears references) due to Postgres enum constraints.

Signature & Authentication
- All requests require signature headers:
  - `X-Signature`: <signature>
  - `X-Signature-Timestamp`: <timestamp>
  - `X-Signature-UUID`: <uuid>
  - `Authorization`: Bearer <token> (optional)
- Signature must be generated using HTTP method and API path (e.g., `GET /api/group_of_work`).
- Implement a single centralized client helper `apiClient` that:
  - Accepts `method`, `path`, `body` and returns fetch promise.
  - Obtains/generates the signature (use project's existing signature helper or call backend signature endpoint if available) and sets the headers.
  - Adds `Content-Type: application/json` when body present.

Server timestamps
- The UI must NOT set `created_at` or `updated_at`. Backend uses server time — client must rely on returned resource values after create/update.

Folder & Component Structure (use existing modular layout)
- Module root: `src/modules/masterdata/group-of-work/`
  - `controller.js` — front-controller for the module (wires actions to components)
  - `index.js` — module entry (routes, store registration)
  - `model.js` — lightweight client-side model/validation helpers
  - `view.vue` — module container view
  - `components/`
    - `GroupOfWorkList.vue` — list view (table), features:
      - Server-backed list (fetch via `GET /api/group_of_work`).
      - Search/filter box (client-side text filter or server query param if supported).
      - Pagination placeholder (if backend supports it later).
      - Row actions: Edit (open form), Delete (confirmation modal).
      - Visuals: use existing app theme classes (Tailwind) and existing layout components for consistency.
    - `GroupOfWorkForm.vue` — create/edit form, features:
      - Fields: `name` (required), optional `detail` if supported by API.
      - Use client validation (required, max length) before submitting.
      - Submit flow: show loading state, call POST (create) or PUT (update), then refresh list from server.
      - Ensure created_by/updated_by handled by backend; do not include client timestamps.

UX / Visual Design Notes
- Keep style consistent with app theme (use project's Tailwind config and shared UI classes/components).
- Use a modal dialog for create/edit or a slide-over panel for modern feel.
- Use accessible labels, keyboard focus trap in modal, and ARIA attributes for forms and confirm dialogs.
- Provide toast notifications for success/failure and inline form error messages.

Error handling & confirmations
- Confirm destructive actions (Delete confirmation modal).
- Surface server validation errors returned by the API.
- Fall back to a full list refetch after create/update/delete to ensure canonical server state.

Integration & Utilities
- Add/extend a shared `apiClient` helper in `src/utils` or module-local `model.js` to centralize signature generation.
- Reuse global auth/token source for `Authorization` header.
- Consider caching signatures per-request window if the signature process supports it.

Testing & QA
- Manual test cases:
  1. List loads and shows enum entries.
  2. Create adds a new label and list updates (server-provided ID/name).
  3. Update renames an entry; confirm references updated where applicable.
  4. Delete clears references (logical delete) and list no longer shows the entry.
- Edge cases:
  - Backend may not remove enum labels physically; document this behavior in UI help text.
  - Race conditions when renaming—ensure UI shows loader and disables duplicate submits.

Next steps (implementation plan)
1. Scaffold UI components (`GroupOfWorkList.vue`, `GroupOfWorkForm.vue`) and module `view.vue`.
2. Implement `apiClient` signature helper and small `model.js` wrapper for GroupOfWork calls.
3. Wire form to POST/PUT and list to GET; add confirmation for DELETE.
4. Add unit / integration tests for the UI flows.

Notes
- This is a design summary only; no code was implemented per request.
- Summary created for the module at: energi-fe/summary/CRUD-GROUP-OF-WORK-PROCESS.md
