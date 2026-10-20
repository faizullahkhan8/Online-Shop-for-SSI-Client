# Local and remote merge — 20 October 2026

## Recoverable history
- Original common base: `940e5ae`.
- Local work checkpoint: `646ee3e`, also retained on `codex/local-checkpoint-2026-10-20`.
- Incoming remote main: `ac2315e` (including `9286a60` and `97553c5`).
- Integrated branch: `codex/merge-local-remote-2026-10-20`.
- No remote push performed. Local environment files and build/cache directories were not committed.

## Resolution decisions
| Area | Combined result |
| --- | --- |
| Checkout and inventory | Remote product variants work inside local MongoDB transactions and idempotency protection. Duplicate lines combine by product AND variant; concurrent purchases cannot oversell. Shared-stock legacy variants remain supported. |
| Cancellation and refunds | Local lifecycle and refund ledger retained. Cancellation restores the exact variant once, or restores shared stock where appropriate. A missing ordered variant fails safely without partially changing stock. |
| Product management | Remote variant editor and aggregate price/stock retained with local pre-upload validation, numeric constraints, editable-field allowlist, optional price fields and failure handling. |
| Customer and manual orders | Variant identity retained through cart, checkout and consumption. Product list, related items and wishlist lead to variant choice; manual orders have a variant selector. |
| Homepage and footer | Remote builder/configuration and dynamic footer retained; local query errors, category-ID links, product deduplication and valid social/article/app links preserved. |
| Staff and media | Remote team hero and animated staff page retained. Team descriptions render as text; existing HTML surfaces remain sanitized. Upload normalization, batch cleanup and dedicated upload folders retained. |
| SMS settings | Remote Settings route shares the local provider-aware settings form. This avoids a second legacy credential editor overwriting provider configuration. |
| Authentication and dialogs | Local session/security protections, request refresh guard, portals, focus management and labels retained alongside remote header/mobile-menu changes. Refresh failure clears auth through a registered callback, avoiding a store/API import cycle. |
| Network origins | CORS, mutation checks and sockets use one trusted-origin list. Remote development LAN/alternate port support remains available in development; production uses configured FRONTEND_URL. |
| Dependencies | Both DOMPurify and Framer Motion retained. Lockfile regenerated without reverting local dependency updates. |

## Verification
- Backend: **65 tests passed**, including added dedicated/shared variant stock, concurrent checkout, idempotency, cancellation and pre-upload variant validation coverage.
- Frontend: **10 tests passed**, including location behavior and variant-specific cart consumption.
- Production frontend build: passed.
- Exact-case import check: **373 relative imports passed**.
- ESLint inspection: no parsing or undefined-variable errors. Existing broader hook/unused-variable lint findings remain; this is not a claim of a clean full lint run.
- Dependency audit: frontend full audit and backend production audit both reported **0 vulnerabilities**.
- No browser control used. Visual/browser interaction behavior was not manually verified.

## Notes
- The incoming empty `pharmacy-1.jpg` file is preserved in history, but its broken gallery reference is omitted.
- The existing local demo backend was not restarted because its launcher creates an ephemeral database and reseeds on startup. Restart it when ready to load the merged backend; the tests used isolated databases.
- The checkpoint and the two parent histories preserve both original versions for comparison and recovery.
