export const USER_ROUTES = {
    REGISTER: "/users/register",
    LOGIN: "/users/login",
    LOGOUT: "/users/logout",
    GET_USER: "/users/get",
    UPDATE_USER: "/users/update",
    GET_ACCESS_TOKEN: "/users/getAccessToken",
    ADD_USER_FROM_ADMIN: "/users/add",
    VERIFY_PHONE: "/users/verify-phone",
};

export const PRODUCT_ROUTES = {
    CREATE: "/products/create",
    GET_ALL: "/products/all",
    UPDATE_PRODUCT: "/products/update",
    DELETE_PRODUCT: "/products/delete",
    GET_BY_ID: "/products/get",
};

export const CATEGORY_ROUTES = {
    CREATE: "/categories/create",
    GET_ALL: "/categories/all",
    UPDATE_CATEGORY: "/categories/update",
    DELETE_CATEGORY: "/categories/delete",
};

export const ORDER_ROUTES = {
    PLACE: "/orders/place-order",
    GET_ALL: "/orders/get-all",
    MY_ORDERS: "/orders/my-orders",
    GET_BY_ID: "/orders", // GET /orders/:id
    UPDATE: "/orders/update", // PATCH /orders/update/:id
    DELETE: "/orders/delete", // DELETE /orders/delete/:id
    DASHBOARD_STATS: "/orders/dashboard-stats", // GET /orders/dashboard-stats
    CANCEL: "/orders", // PUT /orders/:id/cancel
};

export const WISHLIST_ROUTES = {
    GET: "/users/wishlist",
    ADD: "/users/wishlist/add",
    REMOVE: "/users/wishlist/remove",
};

export const SETTINGS_ROUTES = {
    GET: "/settings",
    UPDATE: "/settings",
};

export const PROMOTION_ROUTES = {
    CREATE: "/promotions",
    GET_ACTIVE: "/promotions/active",
    GET_ALL: "/promotions",
    UPDATE: "/promotions",
    DELETE: "/promotions",
};

export const REVIEW_ROUTES = {
    ADD: "/reviews",
    GET_BY_PRODUCT: "/reviews", // GET /reviews/:productId
};

export const SMS_TEMPLATE_ROUTES = {
    GET_ALL: "/sms-templates",
    SEED: "/sms-templates/seed",
    UPDATE: "/sms-templates", // PUT /sms-templates/:id
};
