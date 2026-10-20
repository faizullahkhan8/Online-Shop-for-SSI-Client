# Zada Pharmacy bug and error review



Reviewed on 19 October 2026. This review covers frontend and backend code, the existing production build and lint commands, selected browser interactions, and focused API probes against the isolated local demo database. No production service was tested. No application source code was changed during this review. The two fixes from the earlier screenshot task remain in the working tree.



## Security remediation update

Findings 1 and 2 now have code repairs: public settings exclude gateway credentials,
admin responses never return saved passwords, and embedded secret fallbacks are removed.
All 27 backend tests and the frontend build pass. Provider key rotation, deployment
configuration, and legacy encrypted-value migration remain outstanding operational actions.
See [security implementation and deployment notes](Security_Functionality_2026-10-19.md).
The assessment below preserves the earlier audit and repair history.

## Assessment



Remediation update: findings 3 through 24 are now addressed in the working tree,

including all P2 findings (14–24). Findings 1 and 2 remain open. The observations

below are the original audit record, not a statement that repaired defects remain.

Checkout requires a transaction-capable MongoDB replica set or sharded cluster.



### P2 repair verification



| Finding | Implemented repair |

| --- | --- |

| 14 | Manual orders load a searchable, paginated catalog and retain selected products across searches. |

| 15 | Pages use the hooks' `loading` contract, distinguish failures from empty results, and remove the obsolete drawer flag. |

| 16 | Generated category links use IDs; filtering includes descendants, supports legacy names, and resets pagination on category changes. |

| 17 | Hero and review mutations use cache invalidation; promotion selection no longer invokes a removed setter. Promotion editing loads its query declaratively. |

| 18 | Updates validate and preserve every address and its coordinates, including zero values; an empty list clears addresses. Existing address editors retain secondary addresses. |

| 19 | Revenue includes paid, non-cancelled orders created in the selected period. Trends compare the preceding equal period. Date labels, averages, and chart captions match the calculations. |

| 20 | Import casing matches `homePage.api.js`; the build verifies exact casing for 297 relative imports. |

| 21 | Closed panels unmount. Dialogs have labels, focus trapping/restoration, Escape handling, inert backgrounds, scroll locking, and portals above mobile navigation. Form controls and icon buttons have accessible names. |

| 22 | Registration reports SMS delivery failure while retaining a recoverable pending account. Resend failures return 503 and preserve the previous code. Login reopens verification for pending accounts. |

| 23 | Removed unsupported strip/box choices and the cosmetic pack specification. Price represents the listed product. |

| 24 | Low-stock alerts compare stock with each product's threshold, with a legacy fallback of five. |



Validation: all 23 backend tests pass against an isolated MongoDB replica set.

New coverage checks address round trips and clearing, category IDs/names/descendants,

revenue and comparisons, order averages, stock thresholds, and SMS failure and

mocked success/resend/verification. No real SMS was sent.



The frontend production build passes, retaining its existing chunk-size warning.

Full ESLint still reports 100 errors and 15 warnings, predominantly existing

maintainability issues; no undefined identifiers or hook-order errors remain.

The focused dialog, catalog, dashboard, auth, and promotion repair files have no

reported lint errors. A Linux build itself was not run.



Browser checks covered manual catalog loading/search with retained selections,

category filtering, saved reviews, promotion editing/removal/reselection/update,

login labels, stale-session recovery, and keyboard focus/Escape/restoration.

Responsive checks covered 390, 768, 1024, and 1440 pixel viewports. Mobile registration

scrolls within the viewport and stays above bottom navigation. Hero image uploads

and a full screen-reader audit were not exercised.



Screenshots are saved under `.presentation-build/p2-*.png`.



The app currently has release-blocking access-control, checkout-integrity, and runtime issues. A successful production build does not catch the undefined JavaScript identifiers found here.



- Production build: passed on Windows, with a large-chunk warning.

- ESLint: failed with 133 errors and 16 warnings across the frontend. Errors occur in 54 files. These counts include maintainability rules and are not a count of independent product bugs.

- Undefined identifiers: nine reported references. Some crash pages during rendering, others fail only after an action, and one is currently masked by a loading-property mismatch.

- Browser reproductions: catalog Add to Cart throws `dispatch is not defined`; vendor management renders a blank page and throws `fetchVendors is not defined`; a category link changes the URL but leaves all products visible.

- API reproductions: cross-account profile reads and writes, cross-account order reads, anonymous promotion updates, password-hash serialization, client-controlled payment and delivery states, inventory loss on a rejected order, and discarded address coordinates.

- Evidence files: [safe API probe results](E:/Online-Shop-for-SSI-Client/.presentation-build/review-probes.json) and [ESLint results](E:/Online-Shop-for-SSI-Client/.presentation-build/review-eslint.json). The API results contain booleans and status codes rather than credentials or password hashes.



P1 means a serious security, data-integrity, or primary-workflow defect to fix before release. P2 means a functional or accessibility defect to address next. Findings marked code-confirmed were identified from implementation paths rather than an end-to-end reproduction.



## Security and order integrity



### 1 P1 Public settings response exposes the SMS gateway password



The settings GET route is public, but its controller decrypts `smsGatewayPassword` and returns it with the full settings object. Once an administrator configures the gateway, an anonymous caller can retrieve those credentials.



Evidence: [public route](E:/Online-Shop-for-SSI-Client/backend/routers/settings.router.js:10) and [password serialization](E:/Online-Shop-for-SSI-Client/backend/controllers/settings.controller.js:19). Code-confirmed. The demo does not configure real gateway credentials, so no real credential retrieval was attempted.



Fix: return a public allowlist of checkout settings. Keep gateway settings on an authenticated admin endpoint and return a configured flag instead of an existing password.



### 2 P1 ImageKit credentials and an encryption key are embedded in source



The ImageKit configuration includes a literal private-key fallback. Encryption also falls back to a fixed source-code key. Missing environment configuration therefore silently uses shared credentials and a known encryption key. Credential validity was not tested.



Evidence: [ImageKit configuration](E:/Online-Shop-for-SSI-Client/backend/config/imagekit.js:3) and [encryption configuration](E:/Online-Shop-for-SSI-Client/backend/utils/encryption.js:4).



Fix: remove credential literals, require environment configuration, and rotate any real exposed credentials. Use a dedicated secret for encryption and plan migration of previously encrypted values. This review did not rotate credentials.



### 3 P1 Customers can read and update another account



Profile endpoints require login but never compare the requested user ID with the authenticated user. The controller loads the account directly from the route parameter. Local probes used the customer session to read the demo administrator and submit an update using its existing name. Both returned HTTP 200.



Evidence: [profile read](E:/Online-Shop-for-SSI-Client/backend/controllers/user.controller.js:193), [profile update](E:/Online-Shop-for-SSI-Client/backend/controllers/user.controller.js:213), and [routes](E:/Online-Shop-for-SSI-Client/backend/routers/user.router.js:29).



Fix: enforce account ownership, with an explicit and separately authorized admin exception. Perform that check before processing uploads.



### 4 P1 Customers can read another customer's order



`getOrderById` queries by ID without checking ownership. A local customer session retrieved an order belonging to the demo admin account with HTTP 200, including recipient information and the populated owner object.



Evidence: [order lookup](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:234).



Fix: scope customer queries to `userId: req.user._id`, allowing an explicit admin exception. Return 403 or 404 for unauthorized access.



### 5 P1 User responses expose password hashes



Login and profile responses serialize full Mongoose user documents. Order responses also populate full user documents. The user schema has no password selection restriction or serialization scrubber. Local probes confirmed password-hash fields in login, another account's profile, and a populated order owner.



Evidence: [login response](E:/Online-Shop-for-SSI-Client/backend/controllers/user.controller.js:169), [user schema](E:/Online-Shop-for-SSI-Client/backend/models/user.model.js:21), and [populated order owner](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:243).



Fix: return explicit response DTOs and exclude password hashes, OTPs, and verification expiry fields. If password queries use `select: false`, explicitly select the password only for password comparison.



### 6 P1 Anonymous callers can change promotions



Promotion create, edit, and delete routes have no authentication or role middleware. A local anonymous request updated the existing demo promotion title to its current value and received HTTP 200.



Evidence: [promotion routes](E:/Online-Shop-for-SSI-Client/backend/routers/promotion.router.js:13).



Fix: protect mutations with authentication and admin authorization. Expose only the intended public promotion-read endpoints.



### 7 P1 Socket subscriptions trust caller-supplied roles and user IDs



Any connection can emit `join_admin` to join the admin room or `join_user` with another user's ID. There is no socket authentication middleware. Order and prescription events broadcast to those rooms, exposing private event payloads to unauthorized subscribers. CORS does not authorize room membership.



Evidence: [room admission](E:/Online-Shop-for-SSI-Client/backend/config/socket.js:46) and [admin event payloads](E:/Online-Shop-for-SSI-Client/backend/config/socket.js:95). Code-confirmed.



Fix: authenticate the socket handshake, derive identity from verified credentials, check the stored role before admin subscriptions, and minimize event payloads.



### 8 P1 Customers can mark their own checkout paid and delivered



The order controller accepts the request's `payment` object and `status` without restricting these fields for customers. A normal customer request created a local demo order with `payment.ispaid: true` and `status: delivered`; the API returned HTTP 201 with both values retained.



Evidence: [order construction](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:150).



Fix: force customer orders to unpaid and pending. Reserve fulfillment and verified payment changes for authorized admin actions or trusted payment-provider callbacks.



### 9 P1 Checkout accepts customer-supplied tax and delivery fees



Product prices are recalculated on the server, but tax and shipping are copied from the request. A customer can submit zero fees even when the configured delivery fee is nonzero. The local demo had a delivery fee of 150; a customer request retained a shipping fee of zero.



Evidence: [fee calculation](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:142).



Fix: calculate charges from server settings and validated delivery details. Treat browser calculations as a preview.



### 10 P1 Rejected orders reduce stock and stock updates are not atomic



Stock is decremented before tax validation and before order persistence. A local order with negative shipping returned HTTP 400, but stock changed from 30 to 29. Later validation or save failures have the same rollback problem. Separately, checking stock and saving it in separate operations permits concurrent overselling; that race was code-reviewed, not load-tested.



Evidence: [inventory updates](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:130) and [later validation](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:144).



Fix: validate the entire request first, combine duplicate product lines, require finite positive integer quantities, and use conditional atomic stock updates inside a transaction with order creation.



## Runtime and shopping defects



### 11 P1 Catalog Add to Cart throws a ReferenceError



`ProductCard` imports `useDispatch` but never calls it. Its click handler references an undeclared `dispatch`. The browser reproduced the error, and the cart count did not change.



Evidence: [cart handler](E:/Online-Shop-for-SSI-Client/frontend/src/Components/ProductCard.jsx:34).



Fix: initialize `const dispatch = useDispatch()` inside the component and exercise the catalog cart action.



### 12 P1 Admin order details crash after order data loads



The component passes two undeclared handlers as props: `handleOpenOrderCancelModal` and `handleConfirmItemCancel`. JavaScript evaluates these expressions while rendering, even when the modal is closed. The actual confirmation handler is named `handleCancelItemConfirm`.



Evidence: [modal props](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/OrderDetailsPage.jsx:124). Confirmed by code and ESLint; not browser-reproduced with a fresh authenticated session in this review.



Fix: connect the existing confirmation handler and implement an explicit close callback that resets modal state.



### 13 P1 Vendor management renders a blank page



The Refresh button receives undeclared `fetchVendors` during rendering. The browser reproduced a blank page and the corresponding ReferenceError.



Evidence: [Refresh handler](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/VendorsListPage.jsx:168).



Fix: use the existing vendor query's refetch function or its exposed `getAllVendors` function.



### 14 P2 Manual order creation never loads its product catalog



`AddOrderPage` calls `useGetAllProducts()` with no parameters. That hook defaults to `null` and disables its query when parameters are null. The page never calls the imperative fetch function, so the product selector has no products on a normal fresh visit.



Evidence: [page query](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/AddOrderPage.jsx:22) and [query enable condition](E:/Online-Shop-for-SSI-Client/frontend/src/api/hooks/product.api.js:54). Code-confirmed.



Fix: make the page request the intended product list declaratively, with suitable pagination or search for larger catalogs.



### 15 P2 Query hooks and pages disagree on the loading property



Several custom hooks return `loading`, while their callers destructure `isLoading`. For example, product-list loading is always undefined. This hides loading indicators and makes initial loading look like an empty result. The same mismatch affects product details and several admin and order pages. `OrdersDrawer` additionally references undefined `hasFetched` if its loading condition becomes true, so fixing the alias alone would expose another crash.



Evidence: [product hook return](E:/Online-Shop-for-SSI-Client/frontend/src/api/hooks/product.api.js:78), [product-list caller](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductListPage.jsx:24), [order hook return](E:/Online-Shop-for-SSI-Client/frontend/src/api/hooks/orders.api.js:188), and [latent drawer error](E:/Online-Shop-for-SSI-Client/frontend/src/Components/OrdersDrawer.jsx:78).



Fix: standardize hook return contracts and update callers together. Provide explicit error states and remove the obsolete `hasFetched` reference.



### 16 P2 Category links do not filter products



Product links add a `category` URL parameter, but the product list reads only `page` and `search`. The browser reproduced a Personal Care URL while all eight demo products remained visible. The API expects a category ID, while several links also supply names, so merely forwarding the current parameter will not fully fix this.



Evidence: [query parameters](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductListPage.jsx:21), [example category links](E:/Online-Shop-for-SSI-Client/frontend/src/Components/Home/Footer.jsx:25), and [backend category filter](E:/Online-Shop-for-SSI-Client/backend/controllers/product.controller.js:83).



Fix: define one category identifier convention, generate valid links, pass the category into the product query, and reset pagination when the category changes.



### 17 P2 Other action handlers reference removed functions



- Hero creation, editing, and deletion success paths call `getSlides`, but `HeroManager` never destructures it from the hook. The server operation can succeed before the client throws. [Evidence](E:/Online-Shop-for-SSI-Client/frontend/src/Components/Admin/HeroManager.jsx:86).

- Promotion product selection calls undeclared `setNoProductFound`, causing an error after the selection handler updates state. [Evidence](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/PromotionBuilderPage.jsx:87).

- Successful product review submission calls undeclared `getReviews`, causing an error after the review has been saved. [Evidence](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductDetailPage.jsx:237).



These references were confirmed by code and ESLint, without invoking external image uploads or submitting a customer review. Fix stale callbacks by using the current query contract and existing cache invalidation behavior.



### 18 P2 Profile updates discard map coordinates and additional addresses



The update controller rebuilds `addresses` from only its first entry and copies text fields without `lat` or `lng`. A local round-trip with explicit sample coordinates returned neither coordinate. An empty array cannot clear addresses because updates require a nonempty array.



Evidence: [address reconstruction](E:/Online-Shop-for-SSI-Client/backend/controllers/user.controller.js:240).



Fix: validate and retain every supported address field, handle the intended number of addresses explicitly, and permit an intentional empty list.



### 19 P2 Dashboard revenue and trend labels are misleading



The sales aggregation sums all undeleted orders, including unpaid and cancelled ones, while the frontend labels it TOTAL REVENUE. Trend percentages are hardcoded. The initial filter label is Today while its actual range starts with the last 30 days.



Evidence: [aggregation](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:494), [initial filter](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/DashboardPage.jsx:37), and [hardcoded trends](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/DashboardPage.jsx:176).



Fix: define order value versus collected revenue, filter appropriately, calculate comparative trends from actual periods, and synchronize the initial date label and range.



### 20 P2 An import uses the wrong filename case



`Header.jsx` imports `homepage.api`, while the actual filename is `homePage.api.js`. Windows resolves this, but a typical Linux deployment has case-sensitive paths and cannot resolve the import. The Windows build passed; a Linux build was not run.



Evidence: [import](E:/Online-Shop-for-SSI-Client/frontend/src/Components/Bars/Header.jsx:23) and [actual file](E:/Online-Shop-for-SSI-Client/frontend/src/api/hooks/homePage.api.js:1).



Fix: match the existing filename exactly and add a case-sensitive build check in CI.



### 21 P2 Closed drawers remain accessible and dialogs lack focus management



Cart, wishlist, and orders panels stay mounted and are only moved offscreen using transforms when closed. Their focusable children remain in the accessibility tree. The browser snapshot exposed closed drawer controls alongside normal page controls. The login dialog also lacks dialog semantics, focus trapping and restoration, an accessible close-button name, and Escape handling. Its visible form labels are not associated with input IDs.



Evidence: [cart drawer container](E:/Online-Shop-for-SSI-Client/frontend/src/Components/CartDrawer.jsx:63), [orders drawer container](E:/Online-Shop-for-SSI-Client/frontend/src/Components/OrdersDrawer.jsx:54), and [login modal](E:/Online-Shop-for-SSI-Client/frontend/src/Components/Auth/LoginModal.jsx:67).



Fix: unmount or make closed panels inert, use accessible dialog semantics, move and contain focus while open, restore focus on close, associate labels with controls, and label icon-only buttons. A complete screen-reader audit was not performed.



### 22 P2 Registration claims OTP delivery even when SMS fails



The SMS helper returns false when configuration is missing, the template is disabled, or sending fails. Registration and resend ignore that result and always claim an OTP was sent. Registration has already created an unverified account, so the customer can be stranded without a usable verification path.



Evidence: [registration send](E:/Online-Shop-for-SSI-Client/backend/controllers/user.controller.js:52), [resend send](E:/Online-Shop-for-SSI-Client/backend/controllers/user.controller.js:77), and [SMS failure behavior](E:/Online-Shop-for-SSI-Client/backend/utils/smsService.js:100). Code-confirmed. No real SMS was sent.



Fix: handle delivery failure explicitly, provide retry feedback, and keep recovery possible without falsely reporting success.



### 23 P2 Product pack selection does not affect the cart or order



The detail page offers a strip and a box of 20 strips using local `selectedPack` state. Adding to the cart passes only the original product and quantity. The chosen pack does not affect price, quantity conversion, or the cart payload. Customers choosing a box therefore add the same item as those choosing a strip. The hardcoded pack options also appear on non-tablet products.



Evidence: [pack state](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductDetailPage.jsx:40), [cart payload](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductDetailPage.jsx:192), and [pack buttons](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductDetailPage.jsx:483).



Fix: model and validate real product variants throughout catalog, cart, checkout, and order storage, or remove the selector until variant support exists.



### 24 P2 Low-stock alerts ignore each product's threshold



Products store a `lowStock` value, but dashboard alerts use a fixed threshold of five. A product configured to warn at 20 units will not trigger at 10, while a product configured to warn at two triggers prematurely at five.



Evidence: [alert query](E:/Online-Shop-for-SSI-Client/backend/controllers/order.controller.js:584) and [product threshold](E:/Online-Shop-for-SSI-Client/backend/models/product.model.js:32).



Fix: compare stock against the product's configured threshold, with a deliberate fallback for older records.



## Suggested repair order



1. Remove public secret disclosure, enforce ownership and admin authorization, and authenticate socket subscriptions.

2. Restrict checkout fields and make stock/order changes atomic.

3. Repair page crashes, catalog cart actions, and manual-order product fetching.

4. Align query contracts, category filtering, variant behavior, and address persistence.

5. Correct reporting and accessibility behavior, then establish a clean lint baseline and case-sensitive CI build.



## Limits and follow-up checks



This is a targeted review, not proof that every route or visual state is defect-free. External SMS and ImageKit integration, real payment processing, production configuration, concurrency under load, and a full assistive-technology audit remain untested. Browser verification covered selected storefront and vendor-page paths. Placeholder demo images are an environment limitation rather than a newly discovered production defect. No new application fixes were applied.

