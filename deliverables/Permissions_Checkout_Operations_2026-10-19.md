# Permissions, checkout reliability and operational security

Completed locally without browser control or restarting the running demo.

## Permissions

- Inspected router authentication/role guards and profile, order and prescription ownership paths.
- Added a 38-route administration regression matrix, checking anonymous and customer access before any upload or external service call.
- Added cross-account profile read/write, profile privilege-injection and prescription-list isolation tests. Existing order ownership tests remain passing.
- Removed an accidental extra refund handler from the item-cancellation route.
- Guest prescription submission remains intentional. This audit verifies API access controls; it does not establish private delivery guarantees for files already hosted by the image provider.

## Checkout

- Every checkout now requires an `Idempotency-Key` header (16–128 letters, digits, underscores or hyphens). API clients outside this frontend must send it too.
- A unique MongoDB index stores the hashed account/request key with the order. Repeating the same request returns the original order; changing the payload under the same key returns 409. Different customers have separate key namespaces.
- Stock deduction and order insertion remain one transaction. Concurrent retries of the same checkout create one order and deduct inventory once. Different purchases still compete against conditional stock updates.
- The frontend blocks simultaneous submissions and retains the key in session storage for uncertain network outcomes, including reloads in the same tab. Only a successful response clears it. Identical purchases deliberately started afterward receive a new key.
- Idempotency metadata is retained with the order and excluded from normal API output. Database transactions and the unique index are required; failure to initialize the index prevents checkout.
- Notifications run only after the first successful commit. A process crash between commit and notification can still lose a notification; a durable notification queue is separate work.

## Error handling and dependencies

- Internal errors return a generic response with a request identifier. Invalid identifiers/data return 400; duplicate records return 409. Logs retain static event/type identifiers rather than raw database/provider errors, credentials or patient details.
- Removed raw provider error bodies from upload responses/logs.
- Updated vulnerable frontend dependencies using compatible releases. Replaced the vulnerable nodemon dependency with Node's built-in watch mode for local development.
- Backend lockfile is now eligible for version control, allowing reproducible installs.
- Final npm audit: **0 reported vulnerabilities in both projects**, including development dependencies, on 19 October 2026. This is advisory coverage, not a guarantee of no vulnerabilities.

## Configuration and secret rotation

- `node scripts/check-security.mjs` (run from backend) checks secret lengths, distinct JWT secrets, encryption-key format, HTTPS frontend origin and database configuration without printing values.
- Production startup runs these checks automatically. Local development is not blocked. Current shell configuration is missing the required production values; the running demo uses its own temporary setup.
- Provider credentials have **not** been rotated. Create replacements in the relevant ImageKit/SMS/provider account, update the environment or encrypted settings, validate provider access, then revoke the old credentials.
- Rotate access/refresh signing secrets together when invalidating all sessions is intended. Never reuse the encryption key for JWTs.
- Do not blindly replace `ENCRYPTION_KEY`: existing encrypted provider settings require the old key. Back up the database and securely preserve the old key; migrate/re-enter encrypted settings under the replacement key before revoking the old one. `LEGACY_ENCRYPTION_KEY` supports legacy CBC values only, not arbitrary modern-key rotation.
- No environment files, live credentials, provider accounts or running processes were changed by this work.

## Encrypted backup and safe restore drill

From the backend directory, set `BACKUP_KEY` to a separately stored random 32-byte key encoded as 64 hex characters. Do not store it alongside the backup. Set database URIs through environment variables, never command-line arguments.

```powershell
node scripts/database-backup.mjs backup shop.backup zada_pharmacy
# Set RESTORE_MONGO_URI to an isolated test instance first.
node scripts/database-backup.mjs restore shop.backup restore_shop_check
```

- Backups use an authenticated AES-256-GCM envelope, preserving BSON types and collection indexes. Reads use a snapshot transaction; use a replica set. Pause schema/index changes during capture.
- Files are created exclusively: existing files are never overwritten. Windows access control still depends on the containing directory's ACL.
- Restore accepts only a database name starting with `restore_`, checks that it is empty and never drops/overwrites existing data. A failed restore can leave a partial target; retry with a fresh empty database. Never point a restore drill at a shared/live database.
- This utility is intended for small local datasets and rejects snapshots exceeding 100 MB of document data. Large deployments should use managed snapshots or MongoDB database tools. Database users, server configuration and external image assets are outside the snapshot.
- Backup/restore was exercised only against synthetic isolated test databases, including authenticated tamper rejection, document dates/ObjectIds, unique and TTL indexes, and refusal to overwrite a populated database. No copy of the actual app data was made.

## Verification

- **52 backend tests passed, zero failed.**
- Frontend production build passed; 336 import paths passed exact-casing checks. Existing large-bundle warning remains.
- No browser automation, deployment or application restart performed, as requested.
