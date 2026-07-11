Sensus Progress Status — Implementation Summary

Overview

This document summarizes the planned CRUD UI for the Sensus Progress Status entity in the frontend (Vue + Tailwind), the API contract, required security headers (signature), component structure, routing/sidebar integration, validation rules, and recommended implementation steps. The goal is a modern, consistent UI integrated with the existing app theme using Tailwind CSS.

API contract (backend)

Base path: /api/sensus_progress_status

1) GET /api/sensus_progress_status
- Purpose: list all status rows
- Response data: array of objects: { id, name, detail, created_at, created_by, updated_at, updated_by }
- No request body

2) GET /api/sensus_progress_status/:id
- Purpose: retrieve single status by numeric id
- Response data: single object same shape as above

3) POST /api/sensus_progress_status
- Purpose: create new status
- Required headers: signature headers (see below)
- Request body (JSON):
  - name: string (required)
  - detail: string (optional)
  - created_by: string (optional)
- Response: created object

4) PUT /api/sensus_progress_status/:id
- Purpose: update status
- Required headers: signature headers
- Request body (JSON): any of:
  - name: string
  - detail: string
  - updated_by: string
- Response: updated object

5) DELETE /api/sensus_progress_status/:id
- Purpose: delete status by id
- Required headers: signature headers
- Response: success indicator (standard API format)

Signature headers (required for all API calls)

Every API request must include these headers:

- X-Signature: <signature>
- X-Signature-Timestamp: <timestamp>
- X-Signature-UUID: <uuid>
- Authorization: Bearer <token> (optional)

Notes on signature generation
- Signature depends on HTTP method and API path (e.g. `GET /api/sensus_progress_status`).
- The frontend must call a local helper function that, given method and path (and timestamp/uuid), produces the `X-Signature` value. The mechanism for creating the signature (shared secret / HMAC) should be mirrored from existing API client utilities in the project. The summary assumes a helper will be available in `src/utils/apiSignature.js` or in `src/api` code.

Frontend file layout (already created by user)

- src/modules/masterdata/sensus-progress-status/
  - index.js         (module entry / route registration)
  - controller.js    (UI controller / small glue logic)
  - model.js         (API wrapper: fetch/list/create/update/delete)
  - view.vue         (page shell: layout, sidebar, title)
  - components/
    - SensusProgressStatusList.vue (table/list + actions)
    - SensusProgressStatusForm.vue (create/edit form modal or page)

UI and UX guidance

- Styling: use Tailwind CSS (follow the app theme tokens and classes used across the project).
- Layout: page shell with header, breadcrumb, and a responsive card containing the list and an action bar.
- List view: table with columns: `#`, `Name`, `Detail`, `Created At`, `Created By`, `Updated At`, `Updated By`, `Actions`.
- Actions: `Edit` (opens `SensusProgressStatusForm` in modal or page), `Delete` (confirmation dialog), `Create` button (top-right).
- Form: rounded inputs, clear labels, client-side validation (name required, max lengths to mirror backend limits), submit/cancel buttons. Use accessible labels and ARIA attributes.

Client model/API wrapper (in `model.js`)

- Expose functions: list(), get(id), create(payload), update(id, payload), remove(id)
- Each function must attach signature headers. Create a small helper to compute signature headers given `method` and `path` and include `timestamp` and `uuid`.
- Handle JSON responses and unify API error handling (return consistent error messages to UI).

State management

- Use the project store pattern: either Vuex or Pinia depending on project. Keep local state for the page (pagination, selected item). Track loading and error states.

Validation

- Client-side: `name` required, trim spaces, max length (recommend 100 chars), `detail` optional (recommend max 500).
- Show inline errors from backend when available.

Testing

- Unit tests for `model.js` API wrapper (mock fetch/axios) to ensure headers are attached and payload shapes are correct.
- Component tests for `SensusProgressStatusForm.vue` and `SensusProgressStatusList.vue` (rendering, validation, button clicks).
- E2E test (optional) to cover full create -> list -> update -> delete cycle.

Accessibility & internationalization

- Ensure all interactive elements are keyboard accessible and have aria-labels.
- Use translatable strings for labels (follow app i18n system).

Backend considerations

- Ensure backend DAO/table exists with columns: id, name, detail, created_at, created_by, updated_at, updated_by.
- If the system previously used an enum, confirm there are no conflicts between enum usage and the new table-based approach.

Implementation steps (recommended)

1. Implement API wrapper `model.js` with functions and signature helper.
2. Implement `SensusProgressStatusList.vue` to call `list()` and render table.
3. Implement `SensusProgressStatusForm.vue` for create/edit and wire it to model.
4. Add route / menu item: add a sidebar entry and route registration in `index.js` to point to `view.vue`.
5. Add client-side tests and run lint/build. Restart dev server and test manually.

Next actions I can take

- Draft the `model.js` API wrapper and signature helper.
- Implement the Vue components using Tailwind (list + form) and wire to the store.
- Add Postman examples and unit tests.

If you want, I can now scaffold the model and component code (one file at a time). I will not start implementation until you confirm I should proceed.
