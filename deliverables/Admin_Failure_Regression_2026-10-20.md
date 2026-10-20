# Admin workflows and failure handling

## Fixes

- Partial settings saves preserve tax/shipping instead of resetting omitted values to zero. Negative/non-finite charges and invalid advanced shipping rates are rejected without saving.
- Products can be created with zero stock, zero price and zero low-stock threshold. Negative/fractional stock, negative price, malformed image arrays and invalid price ranges are rejected.
- Product input and referenced category/vendor are validated before external image processing/storage. Blank optional price/vendor fields remain supported. Product edits cannot overwrite sales counters or unrelated internal fields.
- Invalid product pagination returns 400 instead of unbounded/invalid queries.
- When one image in a batch fails to upload, successful uploads from that batch are deleted where possible; failures are logged safely. Background-removal failures are now reported instead of silently continuing with the original image.
- Failed product saves no longer cause an undefined-response crash. Successful edits return to the products list.
- Vendor malformed identifiers use the common 400 error handler; create/edit/delete and missing-record behavior have regression coverage.
- Revoked refresh tokens return 401 consistently. Expired access tokens still refresh when a valid refresh token exists.
- Browser API calls have a 60-second timeout. Network errors do not automatically replay mutations. A failed refresh request cannot recursively refresh itself or hang queued requests.

## Verification scope

Automated checks cover admin products/stock, settings, vendor CRUD, prescription processing/view status, payment/refund/order lifecycle, invalid input, expired/revoked sessions, concurrent refresh failures, network disconnects and partial image-upload failures. Existing SMS rejection/timeout and order concurrency/rollback tests remain included.

Uploads, SMS and network failures were simulated with controlled fixtures/adapters. No real provider messages or money transfers were performed. Image cleanup is best effort if the storage provider is also unavailable; this is not a general cleanup mechanism for every possible database failure after a successful upload.

Final verification: 60 tests passed, frontend production build passed, 336 relative import paths checked. The existing bundle-size warning remains. Backend tests that exercise the frontend API client require dependencies installed in both projects.

No browser control, deployment or running application restart was used. Interactive visual behavior and actual third-party delivery were not verified by this test run.
