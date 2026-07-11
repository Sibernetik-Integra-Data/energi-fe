# Sensus API Integration (Display list of sensus)

This document explains how to replace the current hard-coded dummy rows with real data from the backend `GET /api/sensus` endpoint, and how to handle request signing (signature).

Scope
- Frontend: `energi-fe` (modular architecture). The sensus page currently uses `src/modules/sensus/model.js` with hard-coded rows.
- Backend: `energi-be` exposes `GET /api/sensus` and a signature endpoint `POST /api/signature/create`.

Goals
- Fetch sensus list from the backend and display it in the existing `SensusList` component.
- Use request signing to satisfy the server's signature verification middleware.
- Keep implementation modular and minimal invasive to current structure.

Files to update
- `src/modules/sensus/model.js` — load rows asynchronously instead of hard-coded data.
- Optionally: `src/modules/sensus/controller.js` if you want the controller to expose a reactive promise/state.
- `src/api/fetch.js` — already contains helpers: `apiFetch`, `signedApiFetch`, `createSignature`, `buildSignatureHeaders`.

Signature options

Option A — Client-side HMAC (`signedApiFetch`)
- Uses `VITE_SIGNING_SECRET` in the client environment to compute an HMAC signature locally via `signedApiFetch`.
- Pros: simplest to implement, single request to the API.
- Cons: requires the signing secret to be available to the client (ok for local/dev only). Not recommended for production.

Example usage (quick, dev):

```js
import { signedApiFetch } from '../../api/fetch'

async function loadSensus() {
  const res = await signedApiFetch('/sensus?page=1&limit=20')
  // res has structure: { code, message, data, meta }
  return res.data || []
}
```

Environment variables (dev):
- `VITE_API_PREFIX` — e.g. `http://localhost:10002/api` or `/api` depending on dev proxy.
- `VITE_SIGNING_SECRET` — signing secret for HMAC (development only).

Option B — Server-side signing (recommended for staging/prod)
- Flow:
  1. Client requests a signature from backend: `POST /api/signature/create` with body `{ url: '/api/sensus?page=1&limit=20', method: 'GET' }`.
  2. Backend returns `{ signature, uuid, timestamp, url, ttlSeconds, expiresAt }`.
  3. Client then requests `GET /api/sensus...` with headers `X-Signature`, `X-Signature-Timestamp`, `X-Signature-UUID` (and Authorization if needed).
- Pros: signing secret stays on the server; signatures can be bound to a UUID and TTL.
- Cons: two requests instead of one, but more secure.

Example helper (server-signed request):

```js
import { apiFetch } from '../../api/fetch'

async function signedGet(path) {
  // request signature from backend
  const sigResp = await apiFetch('/signature/create', {
    method: 'POST',
    body: JSON.stringify({ url: `/api${path}`, method: 'GET' })
  })
  const { signature, uuid, timestamp } = sigResp.data
  const headers = {
    'X-Signature': signature,
    'X-Signature-Timestamp': String(timestamp),
    'X-Signature-UUID': uuid
  }
  // call the real api path (apiFetch resolves API_PREFIX internally)
  return apiFetch(path, { method: 'GET', headers })
}

// usage: const res = await signedGet('/sensus?page=1&limit=20')
```

Mapping backend response to view model
- Backend `listSensus` returns rows with fields like:
  - `id_sensus` (string)
  - `sensus_date` (YYYY-MM-DD)
  - `created_by`
  - `blocks` (array of block objects with `name`)
  - `type_of_work` (object with `name`)

- Example mapping for `SensusList` rows (adjust to UI needs):

```js
function mapRow(r) {
  return {
    id: r.id_sensus,
    worker: r.created_by || '',
    block: (r.blocks && r.blocks[0] && r.blocks[0].name) || '',
    date: r.sensus_date || '',
    time: '',
    jobTypes: r.type_of_work ? [r.type_of_work.name] : [],
    status: 'Open' // adapt if backend provides status
  }
}
```

Implementation suggestions (modular)
- Keep the data-loading inside `src/modules/sensus/model.js`. Replace the `rows` constant with an initially empty array and a `loadRows()` function that fetches and populates the rows.
- Export `getList()` as before but ensure it returns a snapshot/copy of `list` (the existing model pattern).
- Avoid side-effects during module import if possible; call `loadRows()` from the controller or call it once at module init (acceptable for SPA page modules).

Error handling and UX
- Show a loading state in the `SensusList` component (e.g., empty rows or a spinner) while fetching.
- Log and surface fetch errors to the console and optionally show a non-blocking toast.

Security notes
- Never commit `VITE_SIGNING_SECRET` to source control. If you use Option A, restrict it to local dev `.env` only.
- Prefer Option B for production.

Testing locally
- Start backend (energi-be) and frontend (energi-fe) with correct `VITE_API_PREFIX` pointing at the backend.
- Ensure Keycloak token is present in `localStorage` under `energi.access_token` if Authorization is required.

Next steps (if you approve)
1. Implement the safe server-signed helper and update `src/modules/sensus/model.js` to fetch rows and map them to the UI.
2. Wire controller to call `loadRows()` and refresh the view.
3. Add small loading state in `SensusList.vue` if needed.

References in this repo
- Backend controller: `energi-be/src/controllers/sensusController.js`
- Frontend fetch helpers: `src/api/fetch.js`
- Current model with dummy rows: `src/modules/sensus/model.js`

---

If you want, I can now implement the preferred option (server-signed flow) and create a patch for `model.js` and any small controller changes. Which option do you prefer (A: client HMAC for dev, B: server-signed recommended)?
