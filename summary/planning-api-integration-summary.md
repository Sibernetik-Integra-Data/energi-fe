# Planning API & Frontend Integration Summary

This document summarizes backend endpoints, request payloads, validation rules, and frontend integration guidance for the Planning feature (table: `t_plan`). It includes required request signature headers and user attribution rules.

## Overview
- Backend exposes planning CRUD via the generic entity router at `/api/:entities` using the `planning` DAO.
- Frontend currently contains hard-coded/dummy planning data in `src/modules/planning/model.js` and a drawer UI in `src/modules/planning/components/PlanningDrawer.vue` that emits save events but does not call the API yet.

## Backend Endpoints (planning)
- GET `/api/planning` — list (supports query filters: `id`, `sensusDetailId`, `idSensus`, `page`, `limit`).
- GET `/api/planning/:id` — get single planning.
- POST `/api/planning` — create planning.
- PUT `/api/planning/:id` — update planning.
- DELETE `/api/planning/:id` — delete planning.

## Database table: `app.t_plan` (relevant columns)
- `id` (pk)
- `sensus_detail_id` (fk -> `t_sensus_detail.id`)
- `start_date` (date)
- `end_date` (date)
- `actual_start_date` (date)
- `actual_end_date` (date)
- `status` (varchar(25))
- `notes` (text)
- `created_at`, `created_by`, `updated_at`, `updated_by`

## Create / Update payload (accepted field names)
Both create and update accept JSON objects. Backend `validateAndNormalizePayload` supports both snake_case and camelCase aliases.

- `sensus_detail_id` | `sensusDetailId` | `detail_id` — integer (required for create)
- `start_date` | `startDate` — string `YYYY-MM-DD`
- `end_date` | `endDate` — string `YYYY-MM-DD`
- `actual_start_date` | `actualStartDate` — string `YYYY-MM-DD`
- `actual_end_date` | `actualEndDate` — string `YYYY-MM-DD`
- `status` — string (max 25 chars)
- `notes` — string

Example create:
```json
{
  "sensus_detail_id": 7,
  "start_date": "2026-05-10",
  "end_date": "2026-05-12",
  "status": "planned",
  "notes": "Initial plan"
}
```

Example partial update:
```json
{
  "end_date": "2026-05-13",
  "actual_start_date": "2026-05-11",
  "status": "in_progress"
}
```

## Server-side validation rules (summary)
- Payload must be an object.
- For CREATE: `sensus_detail_id` is required and must reference an existing `t_sensus_detail` row.
- Date fields must be valid ISO dates `YYYY-MM-DD`.
- If both `start_date` and `end_date` are provided, `end_date` must be >= `start_date`.
- If both `actual_start_date` and `actual_end_date` are provided, `actual_end_date` must be >= `actual_start_date`.
- `status` length <= 25.

Important DB note: recent migration sets `start_date` and `end_date` to NOT NULL. If the DB enforces NOT NULL, creating without those fields will fail on the DB level even if backend validation currently permits missing start/end — align backend create validation with DB constraints.

## Response shape
- The DAO returns a mapped object containing: `id, sensus_detail_id, id_sensus, blocks[]`, `start_date`, `end_date`, `actual_start_date`, `actual_end_date`, `status`, `notes`, `created_at`, `created_by`, `updated_at`, `updated_by`, and nested `sensus_detail` with related info.

## Frontend integration notes
- Remove dummy/hard-coded arrays in `src/modules/planning/model.js` (`plannings`, `sensusOptions`, `aktifitasOptions`, `blockOptions`) and replace with API-driven data.
- Use the existing API helper `signedApiFetch` from `src/api/fetch.js` to call backend endpoints. `signedApiFetch` will build required signature headers and include auth token.
- Recommended model API methods:
  - `loadPlannings(filters)` → GET `/planning` (with query string)
  - `loadSensusOptions()` → GET `/sensus` or GET `/sensus/detail` depending on desired granularity
  - `loadAktifitasOptions()` → GET `/type_of_work`
  - `createPlanning(payload)` → POST `/planning`
  - `updatePlanning(id, payload)` → PUT `/planning/:id`

UI behaviour and selection flow (important):
- A planning must be linked to a `sensus_detail_id` (an integer). Current drawer selects only `id_sensus` string; implement an extra step to select a `sensus detail` row (or load details after selecting `id_sensus`) so the UI can provide the correct `sensus_detail_id` when creating a planning.
- Add UI filters for `id_sensus` (string) and `activity` (type_of_work id). When filters change, call `loadPlannings({ idSensus, typeOfWork })` and update the Gantt chart.
- For local client-side testing (if backend lacks filter support), you can fetch all plannings and filter in the client; however, adding backend filter by activity is recommended for efficiency.

## Required request signature and headers (must be applied on every request)
- Each request must include signature headers:
  - `X-Signature`: computed signature string
  - `X-Signature-Timestamp`: timestamp (string)
  - `X-Signature-UUID`: uuid
  - `Authorization`: optional `Bearer <token>` (if token exists)
- Signature calculation requires the HTTP method and request path (for example: `GET /api/planning`).

## User attribution (`created_by` / `updated_by`)
- The router sets `created_by` / `updated_by` using the Keycloak-authenticated user available on `req.user`.
- Frontend should not hard-code `created_by`/`updated_by`. Ensure requests are signed and include a valid Keycloak token so the server reads the user identity (prefer `sub` claim or `id` claim). The server stores the Keycloak user id (subject) as `created_by` and `updated_by`.

## Example creation flow (server is empty)
1. Create a sensus master row (POST `/api/sensus`) → obtain `id_sensus` string from response.
2. Create one or more sensus detail rows (POST `/api/sensus/detail`) with `id_sensus`, `id_block`, `id_location`, `type_of_work`, `progress_status` → obtain `id` (integer) for each detail.
3. Create planning (POST `/api/planning`) using `sensus_detail_id` (the integer from step 2).

## Risks & recommendations
- Align backend create validation with DB NOT NULL constraints for `start_date` and `end_date`.
- Add backend filter support for activity (`d.type_of_work`) in `planningDao.list` to allow server-side filtering by activity id.
- Update frontend drawer to require/obtain `sensus_detail_id` instead of only `id_sensus` string.

---
File created to help implementors replace frontend dummy data with real API-driven data and to document payloads, validation, and signature/attribution requirements.
