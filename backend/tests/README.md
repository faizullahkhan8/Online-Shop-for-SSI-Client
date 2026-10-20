# Account, checkout, and P2 regressions



Run `npm test` in `backend` after installing its dependencies. Tests start an

isolated MongoDB replica set, bind the API to an ephemeral port, and use synthetic

accounts and catalog entries. They do not use production data or send SMS.

MongoDB 7.0.14 is downloaded on the first run and cached for subsequent runs.



Coverage includes profile and order ownership, safe user serialization and OTP

verification, promotion access controls, customer versus administrator order

fields, authoritative charges, duplicate item consolidation, rejected orders,

transaction rollback, competing checkouts, and authenticated socket rooms/logout.

The 40 tests also cover complete address persistence and clearing, category

resolution and descendants, paid revenue and period comparisons, average order

value, per-product stock thresholds, and failed/mocked-successful SMS recovery, and real catalog review averages/counts.



## Deployment requirement



Order creation uses a MongoDB transaction to commit the order and stock updates

together. Configure a replica set or sharded cluster, including for local

development. A standalone MongoDB server cannot provide this guarantee and

checkout returns 503 instead of falling back to unsafe partial writes.



`node local-presentation-demo.mjs` now starts a temporary single-node replica set.

Administrator manual orders retain explicit tax, delivery-fee, payment-status,

and fulfillment overrides. Customer charges always come from server settings.



Findings 1 and 2 now have regression coverage for public/admin settings separation,
password preservation and encryption, required secret configuration, authenticated
ciphertext and legacy-key compatibility. Provider credential rotation and deployment
migration still require operational completion. See
`../../deliverables/Security_Functionality_2026-10-19.md`.

## SMS providers

Provider regression tests mock all external requests. They cover SMS Gateway and
Twilio request contracts, phone normalization, timeouts with no retry/fallback,
redacted outcomes, draft tests without activation, admin-only metadata/cooldowns,
encrypted per-provider credentials, rollback, and OTP routing after switching.
See `../../deliverables/SMS_Provider_Implementation_2026-10-19.md`.

Registry/profile coverage includes JSON/form templates and escaping, Bearer/Basic/API-key
auth, nested response mapping, phone formats, invalid profile rejection, generic
credential encryption/preservation, metadata discovery and existing event routing.
See `../services/sms/README.md` for configuration-only and code-adapter integration.
