# Location ("/location") API - CRUD Summary

This document summarizes the `/api/location` endpoint behavior, request/response shapes, frontend requirements, and integration notes for the `masterdata/locations` module. Do not implement code yet — this is a design / integration summary (English).

## Endpoints
- GET /api/location
  - Returns: list of location objects wrapped by API response structure.
- GET /api/location/:id
  - Returns single location by numeric `id`.
- POST /api/location
  - Create a new location record. Requires signature headers (see below).
- PUT /api/location/:id
  - Update existing location (partial updates allowed). Requires signature headers.
- DELETE /api/location/:id
  - Delete record. Requires signature headers.

All endpoints are mounted under `/api` (the frontend should call paths like `/location` using the FE API helper which resolves the `/api` prefix).

## Response envelope
The backend uses a standard envelope: `{ code, message, data, meta }`.

Example GET /api/location response (body.data is the array):

```json
{
  "code": 0,
  "message": "location list",
  "data": [
    {
      "id": 1,
      "name": "Sample Petak 1",
      "nomor": 1,
      "location": "Block 1",
      "latitude": "48.300828",
      "longitude": "2.907879",
      "notes": "Inserted by insert-petak-sample.js",
      "created_at": "2026-02-18T08:06:14.163Z",
      "updated_at": "2026-02-18T08:06:14.163Z",
      "type_of_location": null
    }
  ],
  "meta": ""
}
```

Fields returned per location object (from `locationDao`):
- `id` (int)
- `name` (string)
- `nomor` (int)
- `location` (string)
- `latitude` (string|numeric)
- `longitude` (string|numeric)
- `notes` (string|null)
- `created_at` (ISO timestamp) — set by server
- `updated_at` (ISO timestamp) — set by server
- `type_of_location` (enum value or null)

## Create (POST) / Update (PUT) payloads
- Backend DAO accepts the following fields (create/update):
  - `name`
  - `nomor` (integer)
  - `location` (string)
  - `latitude` (string or number)
  - `longitude` (string or number)
  - `notes` (string)
  - `type_of_location` (string or enum value)

Notes:
- `POST /api/location` will insert values as provided; missing fields become `NULL` in DB unless handled on FE.
- `PUT /api/location/:id` supports partial updates: only provided allowed fields are updated.
- Server assigns `created_at` and `updated_at` — the frontend must NOT set these timestamps.

### UI-specific requirement: `nomor` fallback and disabled input
- The current requirement: disable the `nomor` input in the create form. If the form's `nomor` field is empty on submit, frontend must send `nomor: 1` (fallback). This is a temporary behavioral rule; implement in the UI layer (model/controller) before calling the POST.

### `type_of_location` dropdown
- The dropdown options are obtained from `/api/type_of_location` (entity router). Example response shape:

```json
{
  "code": 0,
  "message": "type_of_location list",
  "data": [
    { "id": 1, "name": "petak" },
    { "id": 2, "name": "jalan" },
    { "id": 3, "name": "tph" },
    { "id": 4, "name": "pks" }
  ],
  "meta": ""
}
```

- The UI should map the selected dropdown item to `type_of_location` when sending create/update requests.

## Signature & Authentication (important)
- Non-GET methods require signature validation (`signatureMiddleware`) and authentication (`authMiddleware`). The FE must send these headers for POST/PUT/DELETE:

```
X-Signature: <signature>
X-Signature-Timestamp: <timestamp>
X-Signature-UUID: <uuid>
Authorization: Bearer <token> (if available)
```

- FE pattern supported by the project:
  - Option A (dev): compute HMAC locally using `VITE_SIGNING_SECRET` and `signedApiFetch` helper.
  - Option B (recommended): request a server-signed signature from `POST /api/signature/create` with body `{ url: "/api/location"|"/api/location/:id", method: "POST|PUT|DELETE" }`, then call the real endpoint with the returned signature headers.
- See `src/api/fetch.js` for helper functions and examples (use `signedApiFetch` or request signature then call `apiFetch`).

## Time handling
- Use server-side timestamps for `created_at` and `updated_at`.
- The frontend should not synthesize or send timestamps for these fields.

## Module structure (already created)
The `masterdata/locations` module structure exists with the following files (do not implement code yet):

- `src/modules/masterdata/locations/index.js` — module entry
- `src/modules/masterdata/locations/controller.js` — UI controller / use-case layer
- `src/modules/masterdata/locations/model.js` — data/model layer (create this to call API)
- `src/modules/masterdata/locations/view.vue` — main view
- `src/modules/masterdata/locations/components/LocationList.vue` — list UI (exists but currently empty)
- `src/modules/masterdata/locations/components/LocationForm.vue` — form UI (exists but currently empty)

## Integration notes / checklist for implementation (next steps)
- [ ] Implement `model.js` using project `signedApiFetch` pattern; provide `list, get, create, update, delete` functions.
- [ ] In `create` flow: ensure `nomor` input disabled and apply `nomor = 1` fallback if empty before submit.
- [ ] Load `type_of_location` options from `/type_of_location` and bind to dropdown in `LocationForm.vue`.
- [ ] Ensure every non-GET request obtains a signature (server-signed preferred) and includes signature headers and `Authorization` token.
- [ ] Do not set `created_at`/`updated_at` on client; read and render server-provided timestamps.

## Example create payload (frontend should send):
```json
{
  "name": "New Location",
  "nomor": 1,
  "location": "Block X",
  "latitude": "-1.234567",
  "longitude": "103.123456",
  "notes": "Notes here",
  "type_of_location": "petak"
}
```

## Example update payload (only changed fields required):
```json
{
  "location": "Block Y",
  "notes": "Updated notes"
}
```

---

If you confirm, I will implement the frontend CRUD scaffolding next (create `model.js` functions and skeleton UI in `LocationList.vue` and `LocationForm.vue`) and wire signature acquisition. Do you want me to proceed with implementation now?