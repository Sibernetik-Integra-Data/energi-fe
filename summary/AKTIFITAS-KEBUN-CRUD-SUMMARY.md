## Activity (Type of Work) — Module Summary

This document describes the API contract and UI requirements for the "Aktifitas Kebun" (Type of Work) CRUD screen. Implementation is not performed here — this is a specification for frontend and backend wiring.

API Endpoints
- Base paths used by the module:
  - GET /api/type_of_work          -> list all type_of_work
  - GET /api/type_of_work/{id}     -> get single type_of_work by id
  - POST /api/type_of_work         -> create new type_of_work (body required)
  - PUT /api/type_of_work/{id}     -> update existing type_of_work (body required)
  - DELETE /api/type_of_work/{id}  -> delete type_of_work

- Auxiliary endpoint for groups:
  - GET /api/group_of_work         -> list of group_of_work (id/name)

Response Format
- Standard API envelope used across the app, example for list:

```
{
  "code": 0,
  "message": "type_of_work list",
  "data": [ /* array of type_of_work objects */ ],
  "meta": ""
}
```

Type_of_work object fields (returned by backend):
- `id`, `name`, `detail`, `group_of_work`, `group_of_work_name`, `is_upload`, `created_at`, `created_by`, `updated_at`, `updated_by`

Signature & Auth
- All requests must include the signature headers required by the API gateway:
  - `X-Signature`: <signature>
  - `X-Signature-Timestamp`: <timestamp>
  - `X-Signature-UUID`: <uuid>
  - `Authorization`: `Bearer <token>` (optional but used to derive username)

- Note: signature generation depends on the request path and HTTP method (for example: `GET /api/type_of_work`). The frontend should use the existing `signedApiFetch` helper to build requests.

UI Requirements
- Create a modern CRUD interface consistent with the app theme (use existing styles/components):
  - `KebunList.vue` — list view with table/grid of `type_of_work` entries, pagination controls (if needed), search/filter by `group_of_work`.
  - `KebunForm.vue` — modal or page form for Create/Edit containing:
    - `name` (text, required)
    - `detail` (text area)
    - `group_of_work` (select dropdown populated from `GET /api/group_of_work` showing `group_of_work_name`)
    - Submit and Cancel actions

- On create: POST request body should include `name`, `detail`, `group_of_work`, and the backend will populate `created_at` (server time) and `created_by` (from Keycloak token username).
- On update: PUT request body should include fields to change; backend sets `updated_at` server-side. `updated_by` may be provided (from Keycloak) but does not need to be shown in UI.

Data Consistency & Server-side Rules
- Timestamps: rely on server-provided `created_at` and `updated_at`; do not set timestamps client-side.
- `created_by` should be derived from authenticated user (Keycloak). The frontend should send the auth token; backend extracts the username when assigning `created_by`.

UX Notes
- Match the application's existing visual language (buttons, colors, spacing).
- Use form validation for required `name` and valid selection for `group_of_work`.
- Display server validation errors returned in API envelope to the user.

Implementation Notes (next steps)
1. Implement frontend `model.js` functions using `signedApiFetch` for /api/type_of_work endpoints.
2. Wire controller.js to call model functions and manage state between `KebunList.vue` and `KebunForm.vue`.
3. Implement UI in `view.vue` to host list and form components.
4. Add loading and error states and ensure Keycloak token is attached to requests.

This summary is intentionally brief and focused on the contract and UI behavior. Proceed to implementation when ready.
