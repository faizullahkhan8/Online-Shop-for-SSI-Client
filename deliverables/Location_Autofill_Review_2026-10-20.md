# Location autofill and saved-address review

Reviewed checkout, profile, prescription submission, registration, admin manual orders, admin store/shipping settings and the shared map picker.

## Fixed

- Checkout, profile and prescription forms request the current account record from the API rather than relying only on persisted Redux data. A failed fetch warns the user before falling back to cached account information. Background refetches do not repeatedly hydrate and erase an edited form.
- Checkout and prescription initial hydration retains existing user input. Saved coordinates are loaded as a pair, including valid zero values.
- Shared geocoding logic debounces lookups, aborts obsolete requests, has a ten-second provider timeout and ignores stale responses even when transport ignores abort. A late reverse lookup cannot overwrite newer typed text.
- Loading a saved address/pin does not trigger a lookup that rewrites that address. Forward lookup changes the pin without reverse lookup replacing typed building/apartment details.
- Failed/empty geocoding retains the selected pin and address. It does not claim that a location was found.
- The map recenters when its selected coordinates change, including DB hydration. The Islamabad fallback is now only a map viewing center; it is never silently written as a delivery location when GPS fails. Use the location button or select a map point to provide a location.
- GPS requests have bounded waits. The shared location button reports permission/location failures and disables itself while waiting.
- Registration's final address step now calls the profile update API, updates auth state only after success and remains open if saving fails.
- Admin manual order customer selection now replaces all recipient fields, including coordinates. Missing fields in a newly selected customer no longer retain the previous customer's address/phone.
- Store settings use the shared lookup flow and preserve saved store address data while loading.
- Prescription profile saves do not carry the old city's fields into an unrelated newly selected location. Successful reverse lookup provides the new structured address fields.
- Server validation rejects incomplete/out-of-range coordinate pairs for profiles/orders/prescriptions; prescription validation runs before external image upload. Store coordinate bounds are enforced. Zero coordinates remain valid.

## Verification

- 61 backend regression tests passed, including profile save/read round-trips and invalid coordinate rejection.
- Six Node/React location tests passed: zero coordinates, customer-field clearing, saved DB preservation, out-of-order responses, edits during lookup, provider/empty-result failure handling and prevention of forward/reverse feedback.
- Production frontend build passed; 352 relative imports passed casing checks. Existing bundle-size warning remains. React's test-renderer emits its deprecation notice.
- The broader lint check still reports effect-state/dependency issues in these legacy form components; this report does not claim a clean full lint run.
- No browser control, app restart or deployment was performed. Tests mocked geocoding and did not verify a physical device's GPS permission prompt, tile loading or live provider availability. Address search results remain approximate; the user can place the delivery pin manually.
