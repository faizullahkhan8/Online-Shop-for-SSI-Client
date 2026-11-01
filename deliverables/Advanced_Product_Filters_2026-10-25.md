# Advanced All Products filters — 25 October 2026

Implemented for the existing pharmacy storefront using ui-ux-pro-max, frontend-design and web-design-engineer. The earlier business-integrity work remains intact. No Git push, live order mutation, test SMS or real catalog fixture insertion was performed for this task.

## Design direction and critique

- Extend the existing palette: forest `#1e4d28`, leaf `#4d8d3a`, pale green `#ebf7d9`, ink `#111827`, muted text `#6b7280`, paper `#ffffff`.
- Keep Plus Jakarta Sans for catalog headings, controls and body text; retain the site's existing display typography elsewhere.
- Use the existing site-shell, a 244px desktop filter rail and a flexible result column. Follow the existing 4/8px spacing rhythm with 12–16px product gaps and 24–36px major gutters.
- Left-align labels and results. Green communicates selected filters and primary actions; separators group controls. No new decorative imagery or font dependency.
- Design critique removed a decorative header badge and kept the focal area on actual search, selection and products. Grid/list controls and chips use practical touch targets; the drawer reuses the existing focus trap, Escape handling, background inertness and focus restoration.

```text
Desktop:  breadcrumb / title
          filter rail | search
                      | applied filters
                      | count / sorting / layout
                      | product results / pagination

Mobile:   title / search / Filters count
          applied filters / sorting / results
          drawer: filter groups + Reset / Apply filters
```

## Behavior

- Search product name, brand and variant SKU with escaped literal input.
- Select multiple categories, brands and suppliers. A parent category includes descendants. Brand and supplier controls are separate and appear when real options or active selections exist.
- Set a minimum/maximum effective price, availability, minimum review rating and offer-only selection.
- Sort by relevance, newest, effective price ascending/descending, sales or actual review rating.
- Filtering, sorting, counts and pagination execute on the backend. Results are not restricted to the previously loaded page.
- Effective prices account for active product variants and current eligible promotions, using the same rounding operation order as checkout. Cancelled/inactive promotions are excluded consistently from listing and checkout. Multiple eligible promotions have a deterministic ID ordering.
- A price range must contain an actual active option; a product with options priced 100 and 300 does not match 150–250. In-stock and price/offer constraints must be satisfied by the same option. Whole-product out-of-stock means no purchasable option has inventory. Legacy shared variant stock remains supported.
- Category counts include descendants; facets retain selected supplier labels even with zero results. Review filters use actual stored reviews, not the legacy display rating field.
- Applied selections live in URL parameters. Refresh and browser navigation restore them; filter/sort changes reset pagination. Clear all preserves presentation settings such as grid/list and sorting.
- Mobile selections remain draft until Apply filters. Price validation preserves input, reports invalid bounds and supports zero-price ranges. Desktop price inputs have an explicit Apply price action.
- Loading skeletons update the results without unmounting the controls. Empty/error states provide clear/retry actions. Main search applies on submit, avoiding an API request for every keystroke. Query cancellation prevents stale requests winning over later filters.

## API

`GET /api/products/all` retains the existing response fields and optional admin promotion-selection behavior. Supported parameters:

| Parameter | Values |
| --- | --- |
| search | Literal name, brand or SKU text |
| category, brand, vendor | Repeat the parameter for multiple selections; category IDs or legacy category labels are supported |
| minPrice, maxPrice | Finite non-negative bounds, including zero |
| availability | in_stock / out_of_stock |
| onSale | true / false |
| minRating | 0–5 |
| sort | relevance / newest / price_asc / price_desc / bestselling / rating |
| page, limit | Positive integers; existing maximum limit 1000 retained |
| facets | true to request category/brand/supplier options and counts |

Repeated parameters preserve brand punctuation, including commas and ampersands. Invalid ranges, IDs, sort values and malformed input return 400. Product aggregation is paginated on the server. A product-review lookup index was added; no benchmark or scalability score is claimed.

## Verification and limits

- **77 backend tests passed**, including combined selections, descendants, counts, sorting/pagination, archived exclusion, literal search, actual rating averages, correlated variant stock/prices, active/cancelled discounts and fractional price boundaries.
- **17 frontend tests passed**, including URL round trips, clear/reset behavior, zero/invalid prices, safe category hierarchy and a mobile panel interaction test proving draft isolation and price-input stability.
- Production build passed; exact-case import check passed (414 relative imports).
- Targeted ESLint passed for the new catalog page, controls, URL utilities and updated product card/list components.
- Local `/products` and filter/facet APIs were checked through the Vite proxy: successful requests returned 200; an inverted price range returned 400. The real catalog supplied separate brand and supplier options.
- The local backend preview runs with `NOTIFICATION_WORKER=off`. A normal startup was blocked by automatic approval review because it could send queued SMS; disabling that worker allowed the read-only catalog preview to proceed safely. The .env file was not changed.
- No browser control or viewport screenshot inspection was performed, following the user's constraint. Responsive styles, semantics, component interactions and builds were checked; this is not a claim of visual or manual keyboard verification.
