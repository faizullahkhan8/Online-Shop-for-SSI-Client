# Security and functionality work — 19 October 2026

UI design is paused. This first security batch addresses the two outstanding findings in the original bug review. It is not a complete security certification or deployment.

## Implemented

- Public `GET /api/settings` returns checkout fields only and active payment methods. It excludes SMS credentials, credential status, and internal payment image file IDs. Reading an empty installation does not create database records.
- New `GET /api/settings/admin` requires an authenticated administrator. Admin reads and saves return the gateway username and a password-configured flag, never plaintext or encrypted passwords.
- The admin settings form uses its own API/cache key, masks newly entered passwords, and preserves the stored password when the field is blank. Replacements are encrypted; an explicit admin API `clearSmsGatewayPassword: true` clears the credential.
- Removed the embedded ImageKit account keys and endpoint. Image service operations require environment configuration; missing configuration fails locally without preventing unrelated API startup.
- Removed the fixed encryption-key fallback. New values use AES-256-GCM with random nonces and authenticated ciphertext. Missing/invalid keys fail closed. Legacy CBC values can be read only using an explicit environment key.
- Fixed the vendor controller's ImageKit import casing for case-sensitive filesystems.
- Added `backend/.env.example` with empty secret placeholders. The temporary demo generates its own encryption key with its temporary database.

## Verification

All **27 backend tests passed** against a separate temporary MongoDB replica set and ephemeral API port. No production database or real SMS gateway was used. New coverage verifies anonymous/customer access denial, public/admin credential omission, encrypted storage, password preservation/replacement/clearing, missing configuration, tampering rejection, and legacy-key compatibility. Existing account, checkout, inventory concurrency, reporting, SMS recovery, and socket regressions continue to pass.

Frontend production build passed and checked 333 relative import paths for exact casing. Existing large-chunk warning remains. Targeted frontend lint still reports the existing settings form effect error and dependency warning; these are not a clean global lint result.

The currently running presentation backend has not been restarted: it retains its loaded modules and temporary data. Restart it to load these backend changes; restarting `local-presentation-demo.mjs` recreates its temporary dataset and sessions. Automated tests exercised the new API implementation independently.

## Deployment actions still required

1. Rotate/revoke the previously embedded ImageKit private key in the provider account; removing it from current source cannot revoke copies or Git history. Configure the replacement through the deployment secret store.
2. Generate a unique, random `ENCRYPTION_KEY` of exactly 32 UTF-8 bytes. Keep it stable across application restarts and protected outside source control.
3. For existing SMS credentials, preferably re-enter a rotated gateway password after configuring the new key. If preserving legacy CBC data temporarily, set `LEGACY_ENCRYPTION_KEY` to the actual old deployment key, read/re-save the credential under the new key, verify delivery, then remove the legacy key. Do not simply change a key and assume existing ciphertext has migrated.
4. Deploy/restart frontend and backend together because the admin settings form now uses the protected endpoint.

## Next review priorities

- Login, registration, OTP guessing/resend limits and session revocation.
- HTML content sanitization, upload content validation and resource limits.
- Full order lifecycle: transitions, cancellation/restocking, refunds and payment evidence.
- Input validation, error handling and deployment security headers/origin protection.

These are review priorities, not claims of completed fixes. The original audit's findings 3–24 remain covered by the earlier implementation; findings 1–2 now have code remediation, with provider rotation and environment migration still operationally outstanding.
