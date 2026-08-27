# Ecommerce Fullstack Design

This repository is a fullstack ecommerce sample app with a Node/Express backend and a React + Vite frontend. It demonstrates common ecommerce features from simple UI components to admin dashboards and full API flows (auth, CRUD, orders, wishlist, file upload, and dashboard stats).

---

## High-level Overview

-   Backend: Express.js with modular routers/controllers, JWT-based auth, cookie-based tokens, file upload (multer), and simple local DB model wiring via `config/localDb.js`.
-   Frontend: React + Vite, Tailwind CSS classes, Redux toolkit, react-router, and a set of pages/components for customer and admin experiences.

---

## Main Features (from small → complex)

-   Reusable UI components: `ProductCard`, `Pagination`, `LoadingSpinner`, `DialogBox`, `Input`, `Select`, etc.
-   Product listing and detail views with images and descriptions.
-   Category listing and hierarchical categories support.
-   Search and filtering (client-side components + product hooks).
-   User authentication: register, login, logout, refresh access token via cookies.
-   Profile management: view and update user info and addresses.
-   Wishlist: add, remove, and fetch wishlist items per user (persisted server-side).
-   Cart & Checkout flow: place orders and store order items, recipient, payment and grand total.
-   Orders: users can fetch their orders; admins can fetch, update status, and delete orders.
-   Admin dashboard: products, categories, users, orders management, and dashboard stats (total sales, orders, products, users).
-   Product image upload when creating/updating products (multer + server storage).
-   Server-side validation and centralized error handling via `ErrorHandler` and `ErrorResponse` utilities.
-   Dashboard statistics aggregation endpoint for admin insights.

---

## Backend - API Endpoints (summary)

Base path: `/api`

-   Users (`/api/users`)

    -   `POST /register` : Register a new user
    -   `POST /login` : Login (sets cookies: `accessToken`, `refreshToken`)
    -   `POST /logout` : Logout (clears cookies) — protected
    -   `GET /get/:id` : Get user by id — protected
    -   `PUT /update/:id` : Update user profile — protected
    -   `GET /getAccessToken` : Refresh/generate access token from refresh token cookie
    -   `GET /all` : Admin only — get all users
    -   Wishlist:
        -   `GET /wishlist` : Get current user's wishlist — protected
        -   `POST /wishlist/add` : Add product to wishlist — protected
        -   `DELETE /wishlist/remove/:productId` : Remove from wishlist — protected

-   Products (`/api/products`)

    -   `POST /create` : Admin only — create product (multipart/form-data: `image`, `data` JSON)
    -   `PATCH /update/:id` : Admin only — update product with optional new image
    -   `GET /all` : Get all products
    -   `GET /get/:id` : Get product by id
    -   `DELETE /delete/:id` : Admin only — delete product (removes image file)

-   Categories (`/api/categories`)

    -   `POST /create` : Admin only — create category
    -   `GET /all` : Get all categories
    -   `PATCH /update/:id` : Admin only — update category
    -   `DELETE /delete/:id` : Admin only — delete category

-   Orders (`/api/orders`)
    -   `POST /place-order` : Place a new order — protected
    -   `GET /my-orders` : Get orders for the signed-in user — protected
    -   `GET /get-all` : Admin only — get all orders
    -   `GET /:id` : Get order by id — protected
    -   `PATCH /update/:id` : Admin only — update order status
    -   `DELETE /delete/:id` : Admin only — delete order
    -   `GET /dashboard-stats` : Admin only — compute totalSales, totalOrders, totalProducts, totalUsers

---

## Backend - Important Implementation Details

-   JWT tokens: `utils/jwt.js` generates/ verifies tokens and helper `setCookie` stores cookies.
-   Authentication middleware: `middlewares/auth.middleware.js` exposes `isAuth` (requires cookie token) and `authorize` (role-based guard).
-   Error handling: `middlewares/ErrorHandler.js` centralizes error responses; `utils/ErrorResponse.js` generates consistent errors.
-   File upload: `middlewares/multer.middleware.js` stores product images under `public/images/product-images` and controllers handle unlinking old files on update/delete.
-   Local DB: `config/localDb.js` wires models (User, Product, Category, Wishlist, Order) — models are in `models/`.

---

## Frontend - Pages & Major Components

-   Public / Shopping

    -   `HomePage` — hero, grids, deals, recommended items
    -   `ProductListPage` — paginated product listings
    -   `ProductDetailPage` — product detail + add to wishlist/cart
    -   `CartPage` & `CheckoutPage` — cart UI and place order flow
    -   `LoginPage` / `RegisterPage` — authentication UI
    -   `ProfilePage` — user profile and addresses
    -   `WishlistPage` — user wishlist view

-   Admin

    -   `AdminPage` — single-route admin container that toggles subviews via `tab` query param
    -   Subviews in `Components/Admin/`: `DashboardHome`, `ProductList`, `AddProduct`, `CategoryList`, `AddCategory`, `OrdersList`, `OrdersDetails`, `UserComponents` (list/add)
    -   `AdminSidebar` — admin navigation (collapsible; responsive changes in progress)

-   Shared UI

    -   `Breadcrumb`, `Pagination`, `ProductCard`, `ProductListItem`, `LoadingSkeleton`, `DialogBox`, `Input`, `Select`, `Button`, `SearchInput`

-   API hooks
    -   `frontend/src/api/hooks/*` contains hooks for products, categories, orders, users, dashboard that call backend endpoints using `axios` via `apiClient.js`.

---

## Development — run locally

1. Backend

```bash
cd backend
npm install
# add environment variables (see below)
npm run dev
```

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Default CORS origin in backend is `http://localhost:5173` (Vite dev server).

---

## Environment / Recommended `.env` variables (backend)

-   `PORT` (optional)
-   `JWT_ACCESS_SECRET` — secret for access tokens
-   `JWT_REFRESH_SECRET` — secret for refresh tokens
-   `BACKEND_SERVER_IMAGE_PATH` — optional base path used when storing image URLs

Note: Tokens are stored as cookies named `accessToken` and `refreshToken`.

---

## Models (high level)

-   User: name, email, password (hashed), phone, role, addresses, wishlist ref
-   Product: name, price, description, category ref, stock, image path
-   Category: name, optional parentId, isActive
-   Order: userId, items (product + qty), grandTotal, recipient, payment, status
-   Wishlist: userId, items -> product refs

---

## Known UX / Implementation Notes

-   Image deletion on product update includes file system checks to avoid errors when file missing.
-   Dashboard stats are computed server-side by summing orders and counting documents for products/users.
-   Admin API routes are protected with role-based checks via `authorize(["admin"])`.

---

## Next / Optional Improvements

-   Add unit/integration tests for backend controllers and frontend hooks
-   Add DB persistence example (e.g., MongoDB connection config and migration seeds)
-   Improve frontend responsiveness across admin screens (mobile drawer, collapse behavior)
-   Add pagination, sorting, and server-side filtering for product lists
-   Add payment integration (stripe/payments) for real checkout flows

---

If you'd like, I can:

-   generate a minimal `.env.example` with recommended variables
-   add a scripts section to `package.json` to run frontend + backend concurrently
-   create README badges and quick screenshots for the UI

---

Created automatically from repository inspection.

# ecommerce-fullstack-design

A Internship task for the DevelopersHub Corporation
