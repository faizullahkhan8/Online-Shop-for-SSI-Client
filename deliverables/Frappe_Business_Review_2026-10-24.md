# Business integrity review using frappe-industry-apps

Reviewed: 24 October 2026. Repository: `E:/Programming/Online-Shop-for-SSI-Client`. Revision: `809e170`.

## Verdict and scope

The app has a useful transactional commerce foundation. Its main gap against the business engineering principles in the skill is durable business history across ALL write paths: checkout is protected, but catalog edits, deletion, payment entry and notifications do not share equivalent lifecycle guarantees. Retain React/Vite, Express and MongoDB; adopting these principles does not require introducing Frappe.

This was a selected semantic review of orders, inventory/catalog writes, payment/refund handling, prescription transitions, access controls, notification delivery and backup code. It is not an exhaustive security audit, legal review, performance assessment or production certification. No application implementation was changed by this review. Diagnostic fixtures were created only in disposable local databases; no browser control was used.

## Evidence

- Existing backend suite: **65 passed, 0 failed**, rerun during this review. Includes actual HTTP authorization, checkout rollback, concurrency, session and provider tests.
- Additional diagnostic exercise invoked the actual controllers, product prevalidation and lifecycle service against MongoDBMemoryReplSet 7.0.14. Seven observable gaps were reproduced below. These were diagnostic reproductions, not new committed regression tests; they did not exercise HTTP role middleware.
- Production MongoDB version/topology, live provider behavior, cloud assets, backup scheduling and deployment recovery were not verified. Package manifests identify Express 5 and Mongoose 9; package ranges are not proof of installed production versions.
- Existing tests passing does not cover stale catalog saves, historical catalog identity, all financial precision cases or all prescription transitions.

## Findings, ordered by priority

### F1 — P1: A stale catalog form can overwrite inventory changed by checkout

Evidence: `backend/controllers/product.controller.js:256` allows stock and entire variants arrays; `:289` writes them with an unconditional `$set`. `frontend/src/Pages/Admin/AddProductPage.jsx:196` constructs a full product payload from form state. Product validation checks values but supplies no stale-write condition (`backend/middlewares/productInput.js:14`).

Reproduced: open/form-equivalent stock **10**, checkout reduces it to **9**, then submit the old form with stock **10**. Persisted stock becomes **10** again. For variants, even an intended name/price edit can resend old stock counters. Checkout's own transaction cannot protect a later valid independent write.

Recommendation: separate catalog editing from inventory adjustment. Ordinary edits must exclude live stock fields. A stock adjustment should be an explicit command with delta or expected balance, reason, actor and unique operation ID, committed with a movement record. Use a version/expected-state condition for stale catalog and variant edits. Avoid comparing only `__v` unless EVERY relevant update increments it, including conditional checkout writes.

Acceptance: stale admin save after checkout must reject or preserve the new balance; two independent adjustments must not lose updates; every inventory delta must reconcile to a source movement.

### F2 — P1: Product/variant removal can strand a pending order

Evidence: `backend/controllers/product.controller.js:325` physically deletes products. Whole-array variant editing can remove an ordered variant. Cancellation correctly refuses missing inventory references at `backend/services/orderLifecycle.js:29-31`, but there is no corresponding dependency guard at deletion/edit time.

Reproduced both cases: create a pending order, delete its product OR remove its selected variant, then cancel. Cancellation returns **409**, respectively `product missing` / `ordered variant missing`. The transaction prevents partial restoration, but the operator cannot finish the normal cancellation/refund workflow through that path.

Recommendation: archive referenced catalog identities and retain ordered variants; check dependencies transactionally before destructive changes. Use a separate explicit correction/reconciliation command for legacy broken references. Preserve ordinary cancellation's fail-safe rollback.

Acceptance: deleting/deactivating an ordered item must preserve historical identity and a valid cancellation path. Concurrent deletion and checkout must not create an orphan reference.

### F3 — P2: Monetary line totals do not always reconcile with displayed unit prices

Evidence: `backend/controllers/order.controller.js:138` rounds unit price and quantity-times-unrounded-price independently; product prices accept arbitrary finite precision.

Reproduced: stored product price **0.335**, quantity **3** produces unit price **0.34**, line total **1.01**; displayed unit price times quantity is **1.02**.

Recommendation: define currency, supported price precision, discount precision and one rounding policy. For a two-decimal retail price, either reject higher precision or calculate line totals from the normalized unit amount. Store currency/minor units or use an appropriate decimal representation, and preserve posting-time rounding choices for refunds.

Acceptance: unit price, quantity, discount, line totals, charges, total and reversals reconcile for fractional boundaries and larger quantities.

### F4 — P2: Historical order item identity changes with the catalog

Evidence: `backend/models/order.model.js:48` holds a product reference and variant labels but no product-name snapshot. Creation at `backend/controllers/order.controller.js:136` omits the name; order reads populate the CURRENT product.

Reproduced: order an item named `Original catalog name`, rename the catalog item, then read the order: its populated name is `Renamed catalog name`; there is no original-name field. Deletion can remove the populated identity altogether.

Recommendation: snapshot product name, SKU/variant identity, pack/unit and currency at posting time; retain IDs for traceability. Add charge/pricing rule snapshots where needed to explain historical totals. Historical displays should use snapshots, with an optional link to the current catalog.

Acceptance: rename, price change, archive and deletion cannot change the business meaning of an already accepted order.

### F5 — P2: Post-commit notifications have a crash window and no durable replay record

Evidence: `backend/controllers/order.controller.js:180-190` sends events/SMS after the order transaction. This ordering is good, but pending notification intent is not written inside that transaction. `backend/utils/smsService.js:39-46` sends first and stores attempt metadata afterward. `backend/models/smsAttempt.model.js` contains no order/event identity and expires metadata after seven days.

Source-derived failure scenario, not a process-crash reproduction: a process stops after order commit but before send; the order exists, but nothing durable schedules its missing notification. Replaying the checkout key returns the existing order without recovering that intent. A crash after provider acceptance but before recording also leaves an uncertain delivery outcome.

Recommendation: transactionally insert an outbox entry with the order/event identity. Process it with leases, bounded retry rules and operator-visible failed/uncertain states. Reconcile after restart. Do NOT blindly retry an uncertain send or switch providers; use provider idempotency/status lookup when supported, otherwise require an explicit recovery decision. Keep OTP content out of general outbox/log records.

Acceptance: test crash-before-send and accepted-but-response-lost separately. Retrying business checkout must not place a second order or duplicate a confirmed notification.

### F6 — P2: Payment entry and business audit history are incomplete

Evidence: `backend/controllers/order.controller.js:154-156` permits an authorized manual order with `ispaid: true` but does not populate paid amount/time. `backend/services/orderLifecycle.js:64-66` populates these for later payment confirmation but records no confirming actor or payment reference. Refund entries DO retain actor, reference and time and should be preserved.

Reproduced: a manual paid order has `ispaid: true`, `paidAmount: null` and `paidAt: null`. `createdAt`/`updatedAt` cannot establish who confirmed payment or its transaction reference.

Recommendation: route manual initial payment and later payment confirmation through the same explicit posting command. Record actor, effective time, received amount, method, reference and unique operation ID. Maintain append-only order/stock/payment business events; restrict corrections to reversals/amendments instead of arbitrary history edits. For a small COD shop, keep this proportional; a complete general ledger is needed only if the app is intended to own accounting.

Acceptance: every paid state has a traceable receipt; replaying the receipt is safe; refunds and outstanding balance reconcile to receipts and reversals.

### F7 — P2: Prescription statuses are enum values rather than an enforced workflow

Evidence: `backend/controllers/prescription.controller.js:136-147` validates only membership in the status list, then assigns the requested status. There is no previous-state condition, transition event or required reopening reason.

Reproduced: a completed prescription can become pending directly without a reason. This does not establish that reopening should always be forbidden; that business policy needs an explicit decision.

Recommendation: agree allowed transitions and which actions need a reviewer. If reopening is allowed, make it a named action with reason, actor and history. Protect concurrent decisions with expected state/version. Consider order-to-prescription linkage and restricted asset access as separate requirements before prescription-based fulfillment; they were not validated here.

Acceptance: allowed actions persist the expected outcome; disallowed or stale actions fail without sending a success notification; reopenings retain the original decision history.

## Strengths to preserve

- Checkout recalculates prices/fees on the server, validates quantities, combines duplicate product+variant lines, uses conditional stock decrements and commits the order and stock together.
- Per-account checkout keys have database uniqueness and request-hash checking; concurrent purchase and replay scenarios already have regression coverage.
- Order lifecycle service enforces pending cancellation and forward fulfillment transitions, restores stock once, tracks refund due, prevents over-refunds and makes refund references replay-safe within an order.
- Order routes and service ownership checks restrict customer reads/cancellation; admin reports and mutations have server-side authorization. Existing negative HTTP tests exercise multiple actors.
- Provider credentials are separated/encrypted, unknown send outcomes are distinguished, and automatic unsafe provider fallback is avoided.
- Backup utilities use authenticated encryption, preserve BSON/index metadata, refuse nonempty restore targets and have automated restore tests. This does not establish recovery of externally hosted files or production restoration readiness.

## Additional engineering gaps, not all immediate defects

1. **Stock reconciliation:** only current counters exist; there is no stock movement ledger for receipts, adjustments, sale reservations/release, damage or corrections. If pharmacy operations require batches, expiry, units or multiple warehouses, model those explicitly rather than adding more counters to Product.
2. **Financial reporting:** current dashboard revenue is a paid/non-cancelled order-created-date metric, not a cash receipt/refund ledger. Keep it labeled operationally. A separate posting-date report is needed for cash collection, refunds paid/outstanding and reconciliation; do not silently change the existing metric's meaning.
3. **Authority:** the single-shop admin/customer model can be valid. Add least-privilege inventory, fulfillment and refund roles only when operations need them. Test list, individual record, report, export, media and realtime scope separately. Do not claim company/warehouse isolation without modeling it.
4. **Delivery:** no tracked `.github` CI directory was found. Add repeatable isolated tests/builds, versioned data migrations and a release checklist as deployment approaches. Existing backup restore tests do not replace a full database+external-files+keys recovery drill.
5. **Data corrections:** define currency/precision migration, catalog archive compatibility and legacy order backfills before enforcing new schema constraints. Preserve original references and mark unknown historical values rather than inventing them.

## Suggested sequence

1. Fix **F1/F2** together: inventory write boundary, dependency-safe catalog lifecycle, stale-write protection and targeted regressions.
2. Fix **F3/F4/F6**: consistent amounts, immutable order snapshots and receipt/audit events, including a resumable legacy migration.
3. Fix **F5/F7**: durable outbound event recovery and an explicit prescription workflow with tested role/state decisions.
4. Add reconciliation reports, operational monitoring and a tested deployment/restore process matching the intended shop scale.

## Skill basis and limits

Applied the local `frappe-industry-apps` SKILL.md and its source-map, coverage, architecture, domain-patterns, integrations and delivery references. The transferable principles used here are authoritative business commands, lifecycle validation, durable postings, permission scope, database uniqueness/concurrency, outbox recovery and meaningful business tests. The skill's Frappe/ERPNext/HRMS coverage describes selected development-snapshot traces, not certification of this app. No Frappe framework or upstream implementation code was introduced, and upstream repositories were not independently rerun or audited in this review.
