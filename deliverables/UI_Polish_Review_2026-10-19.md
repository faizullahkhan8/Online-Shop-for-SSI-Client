# Zada Pharmacy — UI polish review

19 October 2026. Review only: no application code changed in this pass.

The app needs a focused polish pass, with mobile admin usability and shared controls first. Keep the existing green brand palette and typography; a complete visual redesign is unnecessary.

## Implementation status

The polish pass has now been implemented. See [implementation notes and verification](E:/Online-Shop-for-SSI-Client/deliverables/UI_Polish_Implementation_2026-10-19.md). The findings and screenshots below retain the original pre-polish assessment.

## Scope and evidence

Used ui-ux-pro-max, frontend-design, and web-design-engineer guidance. Scanned all 32 page source files for typography, layout, form-label, and styling patterns, with focused inspection of shared controls and page implementations. Live browser review covered the homepage, catalog, product detail, cart, checkout, admin dashboard, add-product form, and orders table. Desktop review used 1440px; mobile included a 390px override. The browser reported 385px usable content width on scrollable public pages.

Other routes were reviewed through source and shared-component patterns, not individually verified in every rendered state. The earlier login/dialog checks remain relevant, but this is not a full assistive-technology or contrast certification. Missing demo images and stale cart entries are demo-data limitations, not established production design defects.

## Findings and recommended finish

| Priority | Area | Evidence / observation | Recommended change |
| --- | --- | --- | --- |
| First | Mobile admin shell | At 390px, the sidebar occupied 250px and main content only 140px. Dashboard heading, cards, and filters were clipped. This shared shell affects every admin route. | Make the sidebar an off-canvas menu on small screens, with a compact top bar. Give main content the full viewport and preserve desktop collapse behavior. |
| First | Shared dropdown keyboard behavior | `UI/Select.jsx` renders clickable div options without a listbox/combobox contract or arrow-key selection. Its trigger does not expose expanded state. | Prefer a styled native select where suitable; otherwise implement a complete accessible combobox/listbox with keyboard selection, Escape, and focus handling. |
| First | Form labels | Live add-product inputs such as name, slug, price, and stock have IDs but no associated labels. Checkout name, phone, street, and city fields also lacked programmatic labels. Source shows the pattern in profile, prescription, contact, and admin forms. | Create a consistent FormField wrapper with linked labels, required/optional hints, nearby errors, and aria-describedby. Keep the visible labels. |
| First | Ratings and product-specific copy | A thermometer showed five stars alongside zero reviews. ProductCard defaults a missing rating to five. ProductDetail also has medicine-specific fallback text, including Paracetamol, for products without configured details. The current demo detail uses configured content, so that fallback was source-confirmed rather than rendered. | Show “No reviews yet” until real ratings exist. Use product-type-specific information, with an honest unavailable state when details are missing. |
| Next | Catalog mobile hierarchy | The heading/count, large search container, and separately wrapped view switcher take substantial vertical space before the first product. Desktop shows six columns, while many secondary labels are only 10px. | Compress the mobile toolbar, keep search and view actions together where practical, and use a consistent readable label scale. Check 4–5 desktop columns against realistic long product names before changing density. |
| Next | Buttons and icon actions | Catalog inspection found 12 visible icon buttons without an accessible name. Wishlist icons are 32px; several other utility actions use small icon-only targets. | Name every icon action. Use comfortably sized touch targets and clear disabled, selected, loading, and pressed states. A practical 40–44px target is a usability goal, not a claim that every smaller web target fails WCAG. |
| Next | Admin tables | Orders have many columns, small action icons, and totals that wrap the currency separately. Product-table headings use 10px uppercase labels with wide tracking. | Prioritize key columns, keep amounts on one line, right-align numeric values, add clear row actions, and provide compact mobile rows or a deliberate scroll region after fixing the admin shell. |
| Next | Visual consistency | The shared Button uses rounded-md while forms, inline buttons, and cards use rounded-xl/rounded-3xl. Large shadows, green borders, and hover lifts recur across cards and forms. | Establish a small set of button, input, card, and spacing variants. Reserve strong shadow/border emphasis for active or important content; keep operational forms visually calm. |
| Next | Brand and content consistency | Browser title and meta description say MediCare while the visible logo/site says Zada. Home/footer contain placeholder social links, app-download links, promotional claims, and repeated product sections. | Align page metadata with Zada, connect or hide unavailable destinations, verify displayed claims, and reduce repeated homepage content. Do not invent replacement metrics or promises. |
| Later | Forms and long-page flow | Add-product form density varies between columns; checkout places a map before much of the address form; persistent navigation competes with the narrow viewport. The public shell already has bottom padding, so missing padding is not established as the cause. | Group fields by task, offer map selection as a clear optional disclosure where appropriate, keep primary save/checkout actions easy to find, and verify focused controls remain above persistent navigation and the software keyboard. |
| Later | Loading, empty, and error presentation | P2 repairs added working error/loading branches, but some now display plain paragraphs while other routes use designed cards and spinners. | Provide reusable loading skeletons, empty states, and error/retry panels with consistent spacing, hierarchy, and recovery actions. |

## Source anchors

- [Admin sidebar](E:/Online-Shop-for-SSI-Client/frontend/src/Components/Admin/AdminSidebar.jsx:87), [admin content shell](E:/Online-Shop-for-SSI-Client/frontend/src/Layout/AdminLayout.jsx).
- [Shared Select](E:/Online-Shop-for-SSI-Client/frontend/src/UI/Select.jsx:37), [Input](E:/Online-Shop-for-SSI-Client/frontend/src/UI/Input.jsx), [Button](E:/Online-Shop-for-SSI-Client/frontend/src/UI/Button.jsx:38).
- [Product rating fallback](E:/Online-Shop-for-SSI-Client/frontend/src/Components/ProductCard.jsx:76), [product labels/icons](E:/Online-Shop-for-SSI-Client/frontend/src/Components/ProductCard.jsx:110), [detail fallback copy](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductDetailPage.jsx:713).
- [Catalog toolbar](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductListPage.jsx:79), [catalog columns](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/ProductListPage.jsx:142).
- [Checkout fields](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/CheckoutPage.jsx), [product form](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/AddProductPage.jsx).
- [Product table labels](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/ProductsListPage.jsx:72), [orders table](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/Admin/OrdersListPage.jsx).
- [Brand metadata](E:/Online-Shop-for-SSI-Client/frontend/index.html:7), [homepage](E:/Online-Shop-for-SSI-Client/frontend/src/Pages/HomePage.jsx), [footer](E:/Online-Shop-for-SSI-Client/frontend/src/Components/Home/Footer.jsx).

## Route coverage by shared pattern

Public source pass: Home, Products, Product Detail, Cart, Wishlist, Checkout, Orders, Order Success, Profile, Upload Prescription, Promotions, Staff Tree, About, Contact.

Admin source pass: Dashboard, Products, Add Product, Categories, Vendors, Orders, Add Manual Order, Order Details, Prescriptions, Users, Add User, Promotions, Promotion Builder, Menu Builder, Homepage Builder, Staff Tree Builder, SMS Templates, Tax & Shipping.

## Suggested implementation order

1. Fix mobile admin shell and shared form/dropdown accessibility.
2. Correct ratings, product-specific defaults, and brand metadata.
3. Standardize buttons, fields, table rows, spacing, and text sizes.
4. Refine catalog/checkout mobile hierarchy and homepage content.
5. Verify representative populated, empty, loading, error, and long-content states at mobile, tablet, and desktop widths.

No changes should be made to backend pricing, access controls, or stock logic during a visual polish pass unless a separately confirmed functional defect requires them.

## Visual evidence

The mobile admin clipping is directly reproduced below; the underlying data is temporary local demonstration data.

![Mobile admin sidebar leaves only 140px for content](E:/Online-Shop-for-SSI-Client/.presentation-build/ui-audit-admin-mobile.png)
