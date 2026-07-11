# Sensus-Detail Planning Integration Summary

This document describes how the Sensus-detail planning flow should work, the required API payloads, validation expectations, and the frontend UX behavior to integrate Sensus-detail "Perencanaan" with the existing Planning endpoints.

Overview
- The Sensus Detail page displays a list of job details (sensus_detail rows) for a single `id_sensus` (string). Each sensus_detail has an integer `id` and a `type_of_work` reference.
- The goal: when users create planning from Sensus-detail (via the sidebar modal or the "+ Tambahkan ke Perencanaan" button), the new plan must be persisted to `app.t_plan` and shown in the Planning UI filtered by the owning `id_sensus`.

Main UX behaviors (Sensus Detail)
- The Sensus Detail card component (`SensusJobCard.vue`) provides two CTA actions per job:
  - "+ Tambahkan ke Perencanaan" (orange button): when clicked, navigate the user to the main Planning page (`/planning`), open the New Planning drawer automatically, and preselect the activity (job type / sensus_detail) that the user clicked from.
  - "Lihat Detail": navigate to the Planning tab within the Sensus Detail page (i.e., show the per-sensus planning tab that lists plans for this `id_sensus`).

Modal / Form behavior (SensusDetail -> New Plan)
- Reuse the same fields and layout as `PlanningDrawer.vue`: `sensus` (id_sensus shown and disabled), `activity` (the sensus_detail selected or chosen), `start_date`, `end_date`, `status`, and `notes`.
- Do NOT allow editing the `id_sensus` on the Sensus-detail modal — it must be shown disabled because the sensus context is already known.
- Remove block selection UI from the Sensus-detail modal. Blocks will be derived automatically on the backend from the linked `t_sensus_detail` (the DAO already returns `blocks` for a planning row). The frontend should not send block arrays when creating planning from sensus detail.
- The modal must emit a payload containing `sensus_detail_id` (integer), `start_date`, `end_date`, optional `status`, and optional `notes`.

API contract and payloads
- Create planning (POST `/api/planning`):
  - Required field for create: `sensus_detail_id` (integer) — must reference an existing `t_sensus_detail.id`.
  - Other accepted fields: `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD), `actual_start_date` / `actual_end_date` (optional), `status` (string, max 25), `notes` (text).
  - Example payload:
    ```json
    {
      "sensus_detail_id": 123,
      "start_date": "2026-05-10",
      "end_date": "2026-05-12",
      "status": "planned",
      "notes": "Assigned via Sensus Detail"
    }
    ```

Frontend fetching & headers
- All frontend requests must include the signature headers and Authorization if token present. Use the existing `signedApiFetch` helper in `src/api/fetch.js`:
  - `X-Signature` — computed signature string
  - `X-Signature-Timestamp` — timestamp (string)
  - `X-Signature-UUID` — uuid
  - `Authorization` — `Bearer <token>` if token exists
- Signature calculation requires the HTTP method and request path (example: `GET /api/planning`). The `signedApiFetch` utility already encapsulates this behavior; use it for all planning and sensus/detail requests.

Server-side expectations
- The backend `planningDao.create` validates `sensus_detail_id` exists and returns the created planning object (with derived `blocks` and nested `sensus_detail`). After successful POST, the frontend should reload plans via GET `/api/planning?idSensus=<id_sensus>` to display up-to-date data.
- The server sets `created_by` and `updated_by` using the Keycloak-authenticated user available in `req.user`. Frontend must not attempt to set `created_by`/`updated_by` directly; it must authenticate so server can derive the Keycloak user id (subject) for attribution.

Filtering & navigation behavior
- When the user clicks "+ Tambahkan ke Perencanaan" from a sensus job card:
  1. Navigate to `/planning`.
  2. Open the New Planning drawer (same component as `PlanningDrawer.vue`).
  3. Pre-fill/lock `sensus` to the `id_sensus` of the sensus, and preselect the `activity` corresponding to the clicked sensus_detail (pass `sensus_detail_id` or activity id so the drawer can resolve the correct detail if needed).
  4. On save, the drawer should POST to `/api/planning` as shown above. After success, the app should redirect or refresh the Planning page to fetch the latest plans (optionally filtered by `id_sensus`).

When a user clicks "Lihat Detail" on a sensus job card:
- Navigate to the Sensus Detail page and activate the Planning tab for that sensus. The tab should fetch plans filtered by `idSensus` (GET `/api/planning?idSensus=<id_sensus>`).

Edge cases and recommendations
- Ensure the Sensus Detail page provides sensus_detail rows that include enough metadata to build human-friendly activity labels (e.g., join `type_of_work.name`), so the preselected activity in the drawer is readable.
- If a sensus has no sensus_detail rows, disable the "+ Tambahkan ke Perencanaan" action or prompt the user to add sensus details first.
- Confirm DB NOT NULL constraints: migrations may have set `start_date` and `end_date` to NOT NULL; the Sensus modal should require both start and end dates.
- Server-side filtering: add optional `type_of_work` or `sensusDetailId` filters to `planningDao.list` if you want server-side filtering by activity; otherwise frontend may filter fetched plans client-side.

Testing checklist
1. From Sensus list: click View → open Sensus Detail page.
2. Click "+ Tambahkan ke Perencanaan" on a sensus job card → confirm user is taken to `/planning`, drawer opens, `id_sensus` is prefilled and disabled, activity is preselected.
3. Submit the form → confirm POST `/api/planning` is called with `sensus_detail_id` and dates; response returns created planning.
4. On success, refresh/listing shows the new plan (GET `/api/planning?idSensus=<id_sensus>`).
5. Refresh full page and confirm plan persists in DB.

File created to document exact UI flow and API contract for the Sensus-detail -> Planning integration.
