# Customer-side verification

## Verified without browser control

A complete HTTP/API journey uses a newly registered synthetic customer and exercises:

1. Registration and mocked OTP delivery; login blocked before verification.
2. Successful OTP verification, prevention of OTP reuse and authenticated cookies.
3. Address save and reload from the database.
4. Product search and concurrent wishlist additions without duplicates.
5. Checkout, same-key retry returning the same order, and customer order history.
6. Review creation and duplicate-review rejection.
7. Pending-order cancellation with stock restoration.
8. Wishlist removal, logout, rejection of the old session and fresh login.

A separate multipart prescription test verifies actual image decoding, mocked storage upload, zero-coordinate persistence, customer ownership and exclusion from another customer's list. Existing failure tests cover SMS rejection/timeout, failed image upload, expired/revoked sessions, checkout rollback, stock concurrency, invalid coordinates, and out-of-order geocoding responses.

## Bugs fixed

- Cart additions reject zero-stock products, invalid/non-integer quantities and invalid prices. Adding an existing item uses the supplied current stock and price rather than stale values. Quantity updates normalize numeric input.
- Successful checkout consumes the purchased quantities instead of clearing the entire cart based on an old item-count snapshot. New cart additions and unselected products are retained.
- Wishlist creation handles concurrent first additions through its unique user index; atomic conditional pushes avoid duplicates. Atomic removal does not overwrite another concurrent addition.
- Checkout and prescription submission stop if a requested permanent address save fails. The existing profile mutation reports the save error and inputs remain available for retry.
- Failed prescription submission handles an absent response without a secondary property-access error and resets upload progress.

## Results and limits

- **63 backend tests + 9 frontend Node/React tests passed: 72 total, zero failed.**
- Frontend production build and 352 import-casing checks passed. Existing large-bundle warning remains; React test-renderer reports its deprecation notice.
- Providers were mocked. No real SMS, provider upload or financial transfer was performed.
- These are API, reducer and hook tests, plus source review. They do not establish that every rendered screen, device interaction, accessibility behavior or physical GPS prompt works correctly.
- No browser control, deployment or restart of the existing app was performed.
