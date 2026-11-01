# Connected delivery operations — proposed plan

Prepared for Faiz Ullah Khan, 26 October 2026. This is a proposal, not an implemented feature. Existing application files and live business records have not been changed for this plan.

## Recommendation and assumptions

Extend the existing Node/Express/Mongoose backend as a delivery module, with the existing React admin/storefront and a separate mobile-first rider workspace. Apply Frappe/ERPNext principles—server permissions, explicit lifecycle commands, durable postings, version checks and recoverable external effects—inside this stack. Do not introduce Frappe, a second order database or microservices for the first release.

Confirmed by Faiz Ullah Khan: in-house riders first, and reliable location tracking while phones are locked or the app is in the background is essential from launch. Remaining planning assumptions: one store initially, whole-order delivery, manual dispatcher assignment, full COD collection where applicable, and no rider authority to change pricing, issue refunds or adjust inventory. Keep a courier adapter boundary for later use. Partial deliveries, multi-store transfers and split settlements require a separately agreed policy before enabling them.

Platform decision: build a native-capable rider mobile app from the first operational release. Do not make a PWA the primary rider client for this requirement. Retain React web for admin and customer tracking, using the same delivery API. Confirm rider phone operating systems before choosing the mobile framework; Android-first is conditional on the actual fleet being Android.

The first technical spike must demonstrate location during an active delivery with the screen locked and after switching to navigation. Android needs an appropriate location foreground service, visible tracking notification and OS-appropriate permissions. A webview wrapper alone is insufficient. Test battery saver, permission changes, app/process termination and reconnect on actual rider devices. Force-stop, denied permissions, missing GPS and no connectivity cannot be described as uninterrupted tracking; show last-seen/accuracy and alert dispatch when updates are stale. Track only during agreed on-duty/active-delivery periods, with clear rider disclosure. Background GPS belongs in phase 1, not a later optional enhancement.

## Existing integration points verified

- React 19 / Vite frontend, Express backend and Mongoose models.
- User role enum currently contains user and admin; rider and dispatcher authority do not exist yet.
- Order statuses currently contain pending, shipped, delivered and cancelled.
- `backend/services/orderLifecycle.js` controls order changes, payments, cancellations and stock reversals; non-admin actions are currently narrowly scoped.
- `backend/services/paymentPosting.js` records full customer payment; it does not establish rider cash custody or cashier settlement.
- `backend/config/socket.js` authenticates sockets and joins user/admin rooms. Rider assignment rooms require new authorization and revocation handling.
- `backend/services/notificationOutbox.js` provides durable notification work with explicit unknown outcomes.
- Existing store coordinates, customer pins and shipping calculations can support dispatch. A free customer shipping radius does not imply zero rider compensation.

These were targeted integration reads, not a new comprehensive security certification.

## Three connected interfaces

| Interface | Essential work |
| --- | --- |
| Admin/dispatcher | Rider onboarding, availability, ready-to-dispatch queue, assignment offers, accepted jobs, aging/failed jobs, reassignment, return intake and delivery history. |
| Rider | Shift availability, offered jobs, accepted jobs, pickup confirmation, navigation, customer contact, delivery proof, failed-attempt reasons, cash due and settlement history. |
| Customer | Their own delivery timeline, appropriate rider contact, proof code, latest tracking status and clear failed/reattempt updates. |

Cashier/reconciliation actions must be separate permissions even if an administrator initially performs both jobs. A rider can only see currently assigned deliveries and the minimum customer information needed to deliver them. Pharmacy prescription documents and clinical details are excluded from rider responses.

## First vertical slice

Start with one order and one rider:

1. Store staff marks the parcel ready after normal fulfillment checks.
2. Dispatcher offers the job to an available rider.
3. Rider accepts before offer expiry. A declined/expired offer returns to the dispatch queue.
4. Store verifies pickup with a parcel code/QR or recorded handover; pickup records custody.
5. Rider starts delivery and opens navigation to the recipient pin/address.
6. Recipient handover proof is verified. For COD, the server verifies the expected amount and records collection atomically with completion.
7. The existing order lifecycle is advanced to delivered once; the customer receives the committed update.
8. Cashier verifies cash handover separately. The rider cash balance is settled with a recorded receipt.

The acceptance gate includes duplicate requests, assignment races, payment duplication, poor connectivity and unauthorized access—not just the successful screen flow.

## Delivery state and exception rules

Keep commercial order state, delivery job state, individual attempts and cash settlement distinct.

Suggested delivery progression:
`ready -> offered -> accepted -> picked_up -> out_for_delivery -> delivered`.

An unsuccessful visit creates a DeliveryAttempt with a reason such as unreachable, wrong address, customer rescheduled, refusal or payment issue. It does not automatically cancel the order or return inventory. Dispatcher chooses reattempt, return-to-store or an approved exception action.

- Cancellation before pickup revokes the assignment and follows the existing authorized cancellation/stock rules.
- Cancellation or failed delivery after pickup requires a return process and physical receipt; no automatic stock restoration.
- Returned pharmacy stock goes through inspection/disposition. Return-to-store is not equivalent to saleable inventory.
- Post-pickup reassignment requires a recorded custody transfer. A superseded rider loses action authority immediately.
- Correcting a delivered/cash-posted record uses an authorized correction/reversal with a reason; never silently rewrite history.
- Add a dedicated order return/closure action and update all affected screens/reports under tests. Do not represent a returned parcel as delivered merely to close the workflow.
- The server validates ready state, current assignment, legal transition, current revision and proof/payment requirements on every action.

## Records and API boundaries

Suggested records:

- RiderProfile: linked user, enabled state, verified contact, vehicle details needed for operation and store affiliation.
- RiderAvailability: shift/session availability, last seen and server timestamps. Availability and GPS permission are separate facts.
- DeliveryJob: order/store reference, parcel snapshot, destination, authoritative collection due, current assignment, revision and operational status.
- DeliveryAssignment: offered/accepted/declined/expired/revoked history and who assigned it.
- DeliveryAttempt: attempt number, reason, next action and server receipt time.
- DeliveryEvent: actor, action, previous/new state, request identity, assignment revision, client time and server time.
- DeliveryProof: bounded private attachment or verified one-time recipient code and appropriate handover details.
- RiderCashEntry and CashSettlement: immutable custody postings, cashier receipts, discrepancies, approvals and reversals.
- RiderLocation: separate latest-position projection and short-lived history; do not append GPS points to order documents.

Use existing business/outbox records when their schema and meaning fit. New collections require explicit indexes and a migration/backfill plan. Start new delivery records for operationally eligible orders; do not invent historical rider assignments or cash receipts.

API examples:

- `POST /api/delivery/jobs/:orderId/assign`
- `POST /api/rider/jobs/:jobId/accept`
- `POST /api/rider/jobs/:jobId/pickup`
- `POST /api/rider/jobs/:jobId/start`
- `POST /api/rider/jobs/:jobId/complete`
- `POST /api/rider/jobs/:jobId/attempts`
- `POST /api/rider/locations`
- `POST /api/delivery/returns/:jobId/receive`
- `POST /api/delivery/settlements`

These are business commands with allowlisted payloads, not arbitrary status patches. Rider list, detail, proof download, action APIs and realtime room access must all enforce the same assignment scope.

## Transactions, retries and cash

- Protect one active job/assignment per order with a database constraint or equivalent unique active pointer plus transaction, not a UI precheck.
- Assignment, reassignment and cancellation contend on an authoritative order/job revision so concurrent commands cannot both win.
- Every posting/action has a stable operation ID and unique business identity. Replays return the original result rather than repeating it.
- Cash collection, customer-payment posting, job completion and notification intent commit together, or none commit.
- Calculate collection due from the current authoritative order/payment state. The rider cannot submit a reduced amount and mark full payment.
- Collection creates rider cash custody. Cashier-verified handover reduces that custody. A settlement cannot post the same collection twice or silently erase a discrepancy.
- Prepaid orders do not create COD collections. Refunds, rider earnings and delivery charges are separate records and permissions.
- Use integer minor currency units or a consistent decimal-money policy at new ledger boundaries; do not mix rounding rules.
- Keep external SMS/push/routing calls outside database transactions and preserve committed notification intent in the outbox. Accepted SMS is not proof of recipient delivery.

## Offline and location behavior

- Show the last server-confirmed assignment and an explicit offline/last-synced state.
- Draft notes and eligible proof uploads may queue locally with stable operation IDs. Delivery/payment remains Pending sync until the server accepts it.
- Keep assignment acceptance and reassignment online in the first release. Reject queued actions from a revoked assignment and show a recoverable conflict.
- An uncertain money/action response is checked/retried with the same operation ID; never automatically submit a new financial event.
- Store customer data minimally, scope device caches to the signed-in rider and clear them at logout/expiry. Define retention before launch.
- Capture location accuracy and recorded/received times; flag stale or implausible updates. GPS proximity is supporting evidence, not sole delivery proof.
- Share a rider position with a customer only for that customer's relevant delivery leg. Stop sharing after completion/cancellation; never expose the rider's full route or other stops.
- Start with navigation deep links. Add routed ETA and optimization through replaceable providers only after measuring need and cost. Straight-line radius is not road travel time.
- Production access from rider phones needs reachable HTTPS, authentication and CORS/session configuration; a laptop's localhost is not a rider deployment.

## Proof, permission and privacy controls

- Add rider and dispatcher/cashier capabilities without granting broad admin order updates.
- Code proof: server-generated, expiring, hashed, rate-limited, single-use and bound to the job. Do not return the customer's secret code to the rider API.
- Photo proof: private storage, validated/normalized files, bounded size, authorized expiring access and retention. Avoid prescription labels, unnecessary faces and unrelated personal data.
- Permit an audited dispatcher exception for unavailable SMS/code, based on an agreed policy. A logged-out, disabled or reassigned rider cannot use the exception path.
- Authenticate socket joins; revoke old assignment rooms and device sessions. Socket messages are projections of server-committed state, not authorization to complete a delivery.
- Use map provider key restrictions, notification rate limits and existing secret handling. Push must not disclose full customer addresses or medical information on lock screens.

## UX direction

Retain the existing brand: primary #4d8d3a, deep green #1e4d28, pale green #ebf7d9, text #111827, muted #6b7280 and white #ffffff. Use existing Plus Jakarta Sans for operations and the existing display family only where already appropriate. Use existing Lucide icons and restrained action-driven motion.

Rider screens are a task list first, with a prominent next action. Bottom navigation: Jobs, Cash and Account. Show availability and sync status near the header. Each job focuses on destination, due amount, next action and exception reporting. Use large readable amounts, at least 48px action targets, visible focus and clear text labels. English/Urdu support can be added after language preference is confirmed.

Admin layout combines a dispatch queue, rider availability and an optional map. Critical overdue/failed/unknown cases remain visible in lists so work is possible without the map. Customer tracking uses a timeline and last-updated timestamp; do not display an unsupported precise ETA.

Include loading, empty, offline, permission-denied, expired offer, reassigned job, proof failure and reconciliation discrepancy states in each relevant journey. No queued action should look server-confirmed.

## Phased delivery and release gates

| Phase | Outcome | Gate |
| --- | --- | --- |
| 0: device and background-tracking spike | Own-rider model and background tracking are confirmed. Verify phone OS/devices, demonstrate locked-screen tracking, and agree proof/cash policies. | Foreground-service/permission behavior, battery impact, offline buffering and stale-tracking alerts demonstrated on actual rider devices. |
| 1: operational pilot | Native-capable own-rider app, background tracking, manual dispatch, acceptance, pickup, delivery proof, failed attempts, controlled returns and COD/cash handover. | One order completes end to end with locked-phone tracking; races, wrong-rider access, duplicate cash, failures and reconciliation pass. |
| 2: customer visibility and resilience | Timeline, notifications, bounded customer location sharing and expanded poor-network recovery. | Test reconnect, locked phone, denied location, stale GPS, revoked assignment and outbox failure on actual devices. |
| 3: optimization | Multi-stop trips, assignment suggestions, zone/capacity rules, rider earnings, reconciliation reports and courier adapters. | Proven operating data, measured routing costs, separate payment/earnings policies and rollback controls. |

Manual dispatch, full COD reconciliation and failure recovery belong in the pilot. Automatic nearest-rider dispatch and an in-app navigation engine should not delay proving those fundamentals.

Deployment needs migrations/index verification, backups with a restore rehearsal, health monitoring for unassigned/overdue jobs, failed proof uploads, notification unknowns and unsettled cash, plus per-module feature flags. Pilot with a small real operational cohort after staging tests. Do not assume a build or localhost HTTP 200 proves delivery operations work.

## Unresolved decisions

1. Confirmed: own riders first. Courier integrations remain future scope.
2. Confirmed: background/locked-screen tracking is essential. Still needed: rider phone OS, models and minimum supported versions.
3. Who verifies cash handover, and are riders employees, per-delivery contractors or both?
4. One whole parcel per order initially? What is the return/reattempt charge policy?
5. Recipient code, photo or a combination? What authorized exception process is acceptable?

## References and limits

- Requested local Frappe Industry Apps skill: `references/source-map.md`, `coverage.md`, `blueprints.md`, `architecture.md`, `integrations.md` and `frontend.md`. These support adapting lifecycle, authorization, posting and outbox principles; they do not imply the current app runs Frappe.
- Frappe users/permissions: https://docs.frappe.io/framework/user/en/basics/users-and-permissions
- Browser geolocation and secure contexts: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Service worker lifecycle/platform context: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Android location foreground service: https://developer.android.com/develop/background-work/services/fgs/service-types#location
- Android background location restrictions and permission considerations: https://developer.android.com/develop/sensors-and-location/location/background

No implementation, browser control, real notifications, GPS tracking or financial postings were performed for this proposal. Feature timing and commercial costs require the unanswered scope/platform decisions; no unsupported delivery-date estimate is included.
