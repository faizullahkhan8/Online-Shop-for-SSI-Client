# Business integrity implementation — 24 October 2026

Implemented the seven findings from `Frappe_Business_Review_2026-10-24.md` in the existing React/Express/MongoDB stack. No Frappe runtime or upstream implementation was introduced. No real database migration, provider send, deployment or Git push was performed.

## Resulting behavior

| Finding | Implemented result |
| --- | --- |
| F1: stale stock writes | Catalog saves preserve current counters and reject conflicting stock/revision values. Every checkout, cancellation, catalog save and stock adjustment advances a product revision. A dedicated admin stock-adjustment command requires a signed-in admin, integer delta, reason, expected revision and Idempotency-Key. Replayed identical adjustments return their existing result; conflicting or stale requests fail. |
| F2: stranded cancellation | Product deletion archives instead of physically removing the record or media. Public listings/detail/checkout omit archived products; historical orders can still cancel and restore stock. Admins can list/restore archived products. Ordered variants cannot be removed; an Active control allows deactivation while preserving their identity and restoration path. |
| F3: rounding | Accepted orders normalize unit prices to two decimal places, then derive line totals from those normalized prices. New orders record PKR and the pricing-policy version. Original accepted totals/charges are preserved separately from cancellation-adjusted amounts. |
| F4: historical identity | Accepted order lines snapshot name, SKU, variant labels, pack size and image. Order screens prefer these snapshots. A legacy migration records the source of reconstructed details and explicitly marks missing evidence. |
| F5: notification recovery | Order and prescription transactions persist encrypted notification intent in a durable MongoDB outbox. A worker leases pending events once. Provider acceptance is distinct from delivery. Expired/inconclusive attempts become unknown and cannot be blindly retried. Admin recovery records actor/reason/provider evidence before a safe resend. OTPs retain their synchronous flow and are never added to this business outbox. |
| F6: payment history | Initial manual receipts and later payment confirmations share posting rules. Amount, actor, time and reference are recorded. Repeated confirmation with a conflicting reference is rejected. Stock movements, business events, order history and the existing refund ledger retain traceable records. |
| F7: prescription workflow | Pending -> processing/rejected; processing -> completed/rejected. Terminal decisions require an explicit reopening to pending with a reason. Expected-state validation prevents stale decisions. History and notification intent commit with the decision. |

## Admin entry points

- **Products:** active/archived filter, restore action, archive confirmation.
- **Edit product:** fresh product hydration, explicit reload/discard action, read-only live stock fields, Adjust stock form and variant Active control.
- **Order details:** payment reference entry, original accepted amount, receipt details and action history.
- **Prescriptions:** allowed transition choices and a reasoned Reopen form for terminal decisions.
- **Settings:** Notification delivery and recovery link opens `/admin-dashboard/notifications`. It shows paginated safe metadata, status filtering and explicit recovery actions. Encrypted payloads and recipient numbers are not returned by its list API.

## Durable records and API boundaries

New collections: StockMovement, BusinessEvent, NotificationOutbox. Unique business keys are initialized before transactional use. No public mutation endpoint edits historical movement/event records. This is application-level audit history, not a claim of tamper-proof storage against database administrators.

Admin APIs:

- `POST /api/products/:id/stock-adjustments` — integer delta, reason, expectedRevision, optional variantId; Idempotency-Key required.
- `GET /api/products/archived` and `POST /api/products/:id/restore`.
- `GET /api/business/products/:id/movements`.
- `GET /api/business/:aggregate/:id/history`.
- `GET /api/business/notifications?status=unknown&page=1`.
- `POST /api/business/notifications/:id/recovery` — retry only blocked events; confirm_accepted/confirm_not_sent only unknown events, with provider confirmation reference and reason.

BusinessEvent and StockMovement record source, actor and time. Refund entries retain existing reference/actor/amount semantics. No general-ledger accounting system or warehouse/batch/expiry subsystem was added; those were additional scale-dependent recommendations rather than these seven fixes.

## Runtime setup

MongoDB must run as a replica set or sharded cluster, as already required by checkout. A 32-byte UTF-8 ENCRYPTION_KEY protects provider credentials and business outbox payloads; preserve the matching key with backups. The API starts its polling worker automatically. `NOTIFICATION_WORKER=off` disables it for isolated tests/API-only processes. Multiple workers claim events atomically; they do not automatically resend unknown outcomes.

The outbox is a durable business queue, not an SMS delivery receipt. There is no provider fallback on uncertainty. Accepted events mean provider acceptance; the app does not claim handset delivery. Realtime websocket updates remain best-effort projections of the persisted business state; reconnecting clients should refetch their records.

## Legacy migration and recovery

The tool is dry-run by default and is resumable per business record. From `backend`:

```powershell
node scripts/migrate-business-records.mjs --dry-run
node scripts/migrate-business-records.mjs --apply
```

Run the dry-run against a restored copy first, inspect its summary, and keep a matched database/files/encryption-key backup before applying to a working deployment. The implementation was verified only against disposable fixtures; it was not applied to the user's database.

The migration:

- Captures current catalog details for old orders only when no original snapshot exists, using `legacy_catalog`/`unavailable` evidence labels.
- Preserves unknown historical payment timestamps/actors; it never invents receipts or original approval times.
- Records zero-delta observed inventory baselines, explicitly stating prior movements are unknown; it does not manufacture historical stock receipts.
- Preserves order updatedAt timestamps and does not enqueue historical messages.
- Skips completed records/baselines on repeat runs. Interrupted runs can resume after resolving the underlying error.

Historical totals are not retroactively recalculated with the new rounding rule. Previously physically deleted catalog references still require explicit operator reconciliation; the archive policy prevents new instances, but cannot reconstruct inventory that no longer exists.

## Verification

- Backend: **74 tests passed**, including new stale-save, same-key/concurrent adjustment, independent-writer conflict, archive/cancel/restore, ordered variant protection, price reconciliation, payment provenance/conflict, outbox atomic rollback/concurrent claims/uncertain outcome/expired lease, prescription workflow and resumable migration coverage.
- Frontend: **12 tests passed** for cart, location and skeleton behavior.
- Production build passed; exact-case import validation passed (411 relative imports).
- Frontend lint inspection found no parser or undefined-variable errors. Existing broader hook/unused-variable lint findings are not claimed fixed.
- No browser control or live-provider test was used. Visual interaction checks and real deployment recovery remain operational verification, distinct from the isolated automated evidence above.
