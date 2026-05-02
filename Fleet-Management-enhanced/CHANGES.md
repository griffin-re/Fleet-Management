# Fleet Management — Enhancement & Bug Fix Report

## Summary
This report documents all bugs fixed and enhancements made across the codebase.

---

## Backend Fixes

### `backend/src/app.js`
- **[BUG]** Added `app.set('trust proxy', 1)` — without this, rate limiting fails behind a reverse proxy (all IPs appear as the proxy's IP)
- **[BUG]** CORS only accepted a single `FRONTEND_URL` string; now supports comma-separated origins (dev + prod)
- **[BUG]** Rate limiter returned an HTML response on 429; changed to JSON error body
- **[SECURITY]** Added separate, stricter rate limiter (`20 req / 15 min`) for `/api/v1/auth` endpoints to mitigate brute-force login attacks
- **[BUG]** Socket.IO broadcast was re-emitting any data without validation; added `typeof data === 'object'` guard
- **[ENHANCEMENT]** Added graceful shutdown (SIGTERM/SIGINT) to drain the DB pool cleanly
- **[ENHANCEMENT]** Added `pingTimeout`/`pingInterval` to Socket.IO config

### `backend/src/controllers/authController.js`
- **[SECURITY]** Removed user-enumeration timing attack: if the user doesn't exist, still run a dummy `bcrypt.compare` so response time is constant
- **[BUG]** Missing account status check — deactivated users could still log in
- **[BUG]** Email was not lowercased/trimmed before querying, causing case-sensitive mismatches
- **[BUG]** No guard if `JWT_SECRET` env var is undefined (would throw an unhandled error)
- **[CLEANUP]** Removed unused `uuidv4` import

### `backend/src/controllers/vehicleController.js`
- **[BUG]** No validation of `status` value — any string could be written to the DB
- **[BUG]** No validation of `capacity` — negative or non-numeric values were accepted
- **[BUG]** `registration` was stored as-is; now trimmed and uppercased for consistency
- **[BUG]** `deleteVehicle` returned a 404 for assigned vehicles instead of blocking the delete; now returns 409 Conflict
- **[BUG]** `getHistory` returned an empty array stub — now queries `audit_logs` table
- **[BUG]** `getHistory` didn't verify the vehicle exists first
- **[ENHANCEMENT]** `getAll` and `getById` now JOIN `users` to return `driver_name`
- **[ENHANCEMENT]** Pagination params are validated and clamped (max 100 per page)
- **[ENHANCEMENT]** Status update emits `vehicle:update` socket event

### `backend/src/controllers/convoyController.js`
- **[BUG]** `getAll` did not include `vehicle_count` — frontend showed 0 for all convoys
- **[BUG]** No validation of `status` or `priority` values
- **[BUG]** `departureTime` was not validated as a parseable date
- **[BUG]** `assign` didn't verify the convoy or vehicle existed before inserting
- **[BUG]** `assign` didn't use a database transaction — vehicle status update could succeed while assignment insert failed
- **[BUG]** `assign` didn't use `ON CONFLICT DO UPDATE` — duplicate assignments threw uncaught DB errors
- **[BUG]** `deleteConvoy` allowed deleting active convoys; now returns 409
- **[BUG]** `deleteConvoy` didn't release assigned vehicles; now uses a transaction to unassign them
- **[BUG]** `getEvents` returned an empty stub — now queries `audit_logs` table
- **[ENHANCEMENT]** `updateStatus` emits `convoy:update` socket event

### `backend/src/controllers/alertController.js`
- **[BUG]** `getAll` had no `WHERE` clause when no severity filter was applied — worked accidentally, but fragile
- **[BUG]** No validation of `severity` value
- **[BUG]** `title` was not validated for minimum length
- **[BUG]** `acknowledge` and `resolve` were byte-for-byte identical — `resolve` now stores a resolution note
- **[BUG]** `acknowledge`/`resolve` didn't guard against already-resolved alerts (now returns 404 for idempotency)
- **[ENHANCEMENT]** `getAll` JOINs `users`, `vehicles`, and `convoys` to return related names
- **[ENHANCEMENT]** `create` emits `alert:new` socket event for real-time delivery
- **[ENHANCEMENT]** Added `resolved` query param to filter by resolved state

---

## Frontend Fixes

### `frontend/src/hooks/index.js`
- **[BUG]** `useAsync` was declared **twice** — the second declaration silently shadowed the first (syntax error in strict mode / bundler warning)
- **[BUG]** `usePrevious` used `useState` + `useEffect` — this pattern stores the *current* value, not the previous one. Fixed with `useRef`

### `frontend/src/services/socket.js`
- **[BUG]** `connect()` created a new socket on every call without checking if one already existed — caused duplicate connections
- **[BUG]** No `connect_error` handler — silent failures on auth/network errors
- **[BUG]** `emit()` sent events even when the socket was disconnected
- **[ENHANCEMENT]** Added `off*` companion methods for all `on*` helpers (required for proper useEffect cleanup)
- **[ENHANCEMENT]** Added `isConnected()` utility method
- **[ENHANCEMENT]** Set `transports: ['websocket', 'polling']` to prefer faster WebSocket transport

### `frontend/src/pages/DashboardPage.jsx`
- **[BUG]** CSS class typo: `grid-cols-` (empty suffix) → `grid-cols-1` — the charts grid didn't render correctly
- **[BUG]** `event.message` used `convoy.id` instead of `convoy.name` — displayed UUID hex instead of readable name
- **[BUG]** `new Date(event.timestamp).toLocaleTimeString()` threw when `timestamp` was null/undefined
- **[BUG]** KPI card colors used dynamic Tailwind classes (e.g. `text-${color}-400`) which Tailwind purges at build time — switched to `style` prop
- **[BUG]** Activity list items were not interactive; now navigate to `/convoys` on click
- **[BUG]** Quick Actions "Create Convoy" and "Dispatch Vehicle" buttons had no `onClick` handlers
- **[ENHANCEMENT]** Added `loadError` state with `ErrorState` fallback component
- **[ENHANCEMENT]** Wrapped `loadDashboard` in `useCallback` to stabilise the `setInterval` dependency

### `frontend/src/pages/FleetPage.jsx`
- **[BUG]** Empty filter strings were passed to the API (e.g. `status=` in query string) — backend matched nothing
- **[BUG]** `vehicle.lastPing` (camelCase) doesn't match PostgreSQL's `last_ping` (snake_case) — column showed "Invalid Date"
- **[BUG]** `Edit` button existed but had no `onClick` and no edit modal
- **[BUG]** Changing filters didn't reset the page to 1 — showed page 3 of filtered results with only 5 items
- **[BUG]** Raw `<select>` used instead of the `Select` UI component (inconsistent styling)
- **[BUG]** Table was missing the `registration` column — a key identifier for fleet operators
- **[ENHANCEMENT]** Combined Add + Edit into a single `VehicleModal` component
- **[ENHANCEMENT]** Added form validation errors displayed inline
- **[ENHANCEMENT]** Error response messages from the API are shown in the toast

### `frontend/src/pages/ConvoysPage.jsx`
- **[BUG]** `convoy.departureTime` (camelCase) doesn't match `departure_time` (snake_case) from PostgreSQL — showed "Invalid Date". Now handles both.
- **[BUG]** `convoy.vehicleCount` → `convoy.vehicle_count` mismatch (always showed 0)
- **[BUG]** "View" button had no action — clicking it did nothing
- **[BUG]** Status pipeline had 4 status buttons + a separate "Total" button totalling 5 but laid out as `grid-cols-4` — buttons overflowed
- **[BUG]** No way to delete or change convoy status from the UI
- **[ENHANCEMENT]** Convoy cards are now fully clickable and open a detail modal
- **[ENHANCEMENT]** Detail modal shows valid status transitions and a delete button
- **[ENHANCEMENT]** Priority is color-coded (low → grey, medium → amber, high → orange, critical → red)
- **[ENHANCEMENT]** Long descriptions are clamped with `line-clamp-2`

### `frontend/src/components/Layout.jsx`
- **[BUG]** Sidebar did not push the main content area — it overlaid it on desktop (content was hidden under the sidebar)
- **[BUG]** Mobile: no overlay/backdrop behind the open sidebar; tapping outside didn't close it
- **[BUG]** Sidebar's "Logout" button called `logout()` (clears store) but never called `socketService.disconnect()` or redirected to `/login`
- **[BUG]** Bell icon was not a `<button>` and had no click handler — not accessible and non-functional
- **[BUG]** Active route detection used `startsWith('/dashboard')` — any path starting with that string (e.g. `/dashboard-admin`) would match incorrectly
- **[ENHANCEMENT]** Sidebar auto-closes on mobile after navigation
- **[ENHANCEMENT]** Logout shows a success toast and navigates to `/login`
- **[ENHANCEMENT]** Unread count badge shows "99+" instead of overflowing for large numbers

### `frontend/src/pages/LoginPage.jsx`
- **[BUG]** Login errors were shown via `toast.error()` only — users missed them if not looking at the corner. Now shown inline in the form.
- **[BUG]** No client-side validation — form submitted with empty fields or invalid email format
- **[BUG]** `socketService.connect()` was not called after login — real-time events didn't work until page refresh
- **[ENHANCEMENT]** Password field uses `autoComplete="current-password"` for password manager support
- **[ENHANCEMENT]** Submit button shows "Signing in..." text with spinner while pending
