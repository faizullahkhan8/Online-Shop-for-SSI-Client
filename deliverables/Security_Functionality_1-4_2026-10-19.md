# Security and functionality priorities 1–4

Implemented in source on 19 October 2026. Verified without browser control.

## 1. Login and OTP abuse protection

- MongoDB-backed atomic limits apply per IP and normalized account identifier. Hashed counter keys expire automatically.
- Login: 10/account and 60/IP per 15-minute window. Registration: 5/account and 20/IP per hour. Resend: 5/account and 30/IP per hour, plus an atomic 60-second cooldown.
- Verification: 10/account and 60/IP per 10 minutes; each issued code permits at most five guesses. Successful codes cannot be reused.
- New codes use cryptographic randomness and HMAC storage. Existing plaintext codes remain valid only through their original expiry. A failed resend preserves the previous valid code.
- Fixed-window limits can allow traffic around window boundaries. Reverse-proxy IP forwarding must be configured for the actual trusted deployment topology; arbitrary forwarded headers are not trusted.

## 2. Sessions

- Access tokens expire after 15 minutes; refresh tokens after seven days. Tokens enforce algorithm, token purpose, expiry and account session version.
- Logout revokes all sessions for that account, including refresh tokens, and disconnects its local socket subscriptions. Password changes increment the session version.
- Old tokens issued before this change require a fresh login. Cookies remain HttpOnly; production cookies use Secure. Untrusted browser origins cannot submit mutations.
- Set FRONTEND_URL to the exact deployed frontend origin. Multi-instance deployments need shared socket coordination to disconnect already-connected sockets on other instances.

## 3. Images and HTML

- Uploads accept static JPEG, PNG and WebP only: maximum 5 MB each, five files per request and 16 million decoded pixels per image. Upload routes have a 30-request/15-minute user limit.
- Sharp decodes actual bytes, checks MIME consistency, strips metadata and rewrites images to WebP with generated filenames. SVG and disguised/corrupt files are rejected before external upload.
- Rich content is allowlisted on JSON/multipart writes, relevant model setters and API reads (including legacy content). DOMPurify protects all three HTML rendering locations.
- Script, event-handler, iframe and unsafe URL content is removed. Inline styles are deliberately removed; existing styled HTML may look different. JSON bodies are limited to 2 MB.

## 4. Orders, inventory and refunds

- Legal progression: pending → shipped → delivered. Only pending orders/items can be cancelled. Repeating an already-completed cancellation is harmless.
- Cancellation and inventory restoration share one MongoDB transaction. Missing products cause rollback. Concurrent cancellation cannot restore stock twice.
- Partial cancellation subtracts the item's amount and retains fixed shipping/tax. Cancelling the final item cancels the order and zeros remaining charges.
- Payment updates require a boolean. Paid status cannot be reversed by toggling a flag. Original paid amounts are retained and cancelled amounts become refund obligations.
- Admins can record completed external refunds with amount and transaction reference in the order page. The endpoint is POST /api/orders/:id/refunds. Reusing the same reference and amount is idempotent; excessive refunds are rejected. This records bookkeeping only, not a money transfer.
- Active orders and orders with outstanding refunds cannot be archived. Status controls expose only legal next states.
- MongoDB replica-set/transaction support is required, as it already was for checkout. Historical cancellations/refunds are not reconstructed automatically.

## Verification and activation

- Final result: **47 tests passed, zero failed**. Production build passed; 336 relative imports passed casing checks. Vite reports an existing bundle-size warning.
- Automated tests cover existing checkout/SMS/security behavior, concurrent cancellation, transaction rollback, partial totals, refund bounds/idempotency, OTP limits, revoked sessions, origin checks, malformed images and HTML sanitization.
- Frontend production build and exact import-casing checks run without browser automation. No real SMS or financial transfer is performed by tests.
- The existing temporary demo backend has not been restarted: its launcher recreates demo data. Restart/redeploy against the intended database to activate server changes; sign in again afterward. Install the updated backend/frontend dependencies in deployment.
- This work covers the four requested areas; it is not a claim that the entire application has undergone a penetration test.

Implementation references: [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Sharp input limits](https://sharp.pixelplumbing.com/api-constructor/).
