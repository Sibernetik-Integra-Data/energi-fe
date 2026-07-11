Driver Form Summary
===================

Purpose
-------
This document describes the frontend implementation plan for the Driver create/update form (master data). The form will call the backend Driver CRUD endpoints and include the required signature headers.

API Endpoints
-------------
- List drivers: GET /api/driver
- Create driver: POST /api/driver
- Get driver: GET /api/driver/:id
- Update driver: PUT /api/driver/:id
- Delete driver: DELETE /api/driver/:id

Signature Headers
-----------------
Requests to the API require these headers:

```
X-Signature: <signature>
X-Signature-Timestamp: <timestamp>
X-Signature-UUID: <uuid>
Authorization: Bearer <token> (optional)
```

Notes:
- The signature generation requires knowledge of the API path and HTTP method (e.g. `GET /api/driver`).
- Server time must be authoritative: `created_at` / `updated_at` are set by the server; the client must not send timestamps as authoritative values.

Vehicle Data (for select)
-------------------------
Fetch vehicle options from: GET /api/vehicle (frontend may call `/vehicle` depending on proxy; backend routes are mounted at `/api/vehicle`).
Response shape (data array): each vehicle has `id`, `name`, `title`, `type`, `notes`, `created_at`, `updated_at`.
The driver form stores `vehicle_id` and `vehicle_number`. The select should show `vehicle.name`.

Form Fields (create/update)
---------------------------
- `name` (string) — required
- `address` (text)
- `location` (string)
- `vehicle_id` (integer) — select populated from vehicle list
- `vehicle_number` (string)
- `notes` (text)

Analysis
--------
- Backend expectations (from `driverDao`): `name` is required for create; other fields are optional. API will return the full driver row including `vehicle_name` after create/update.
- Create vs Update:
	- Create: POST `/api/driver` with JSON body containing at least `name`.
	- Update: PUT `/api/driver/:id` with JSON body containing one or more updatable fields. Server returns null/404 if no rows changed or id not found.
- Signature: signing input must include HTTP method + API path (e.g. `GET /api/driver`) so the helper must accept method+path when building `X-Signature`.
- Timestamps: do not set `created_at`/`updated_at` on client; server timestamps are authoritative.

Create Form Requirements (UI)
-----------------------------
- Full form fields: all fields listed under "Form Fields (create/update)" must be present and usable.
- Vehicle select:
	- On form load (create mode), fetch the vehicle list from `/vehicle` (or `/api/vehicle`).
	- Populate a searchable select showing `vehicle.name` and storing `vehicle_id`.
	- Optionally show `title` or `type` as secondary info in options.
- Validation:
	- `name` is required client-side; show inline error if empty.
	- Basic client validation for string lengths where appropriate.
- Submit:
	- Build request body with changed fields only (for update) or full payload (for create).
	- Attach signature headers (`X-Signature`, `X-Signature-Timestamp`, `X-Signature-UUID`) and `Authorization` when token exists.
	- On success: close form and refresh driver list or show created/updated driver.
	- On error: show server error message details.

Implementation Notes
--------------------
- Re-use existing project form layout and components from `modules/masterdata/blocks` for visual parity.
- Centralize signature logic in one API helper (e.g. `src/utils/api.js`) so all signed requests use the same method and inputs (method + path + body).
- Use `/api/vehicle` as canonical backend path; adjust if frontend proxy maps `/vehicle` → `/api/vehicle`.

Example request bodies
----------------------
Create:
{
	"name": "Driver One",
	"address": "Street 1",
	"location": "LocA",
	"vehicle_id": 1,
	"vehicle_number": "A111",
	"notes": "Sample"
}

Update:
{
	"name": "Driver One Updated",
	"vehicle_number": "A112"
}

Files to Create / Modify
------------------------
- `src/modules/masterdata/driver/components/DriverForm.vue` — implement complete create + update form with vehicle select.
- `src/modules/masterdata/driver/DriverList.vue` — ensure list refresh after create/update.
- `src/utils/api.js` (or existing API helper) — add signed request helper that accepts method+path and returns headers.

Next Steps
----------
- I can implement the `DriverForm.vue` component and the API helper next, then wire the form into the driver list.

