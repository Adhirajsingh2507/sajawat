# SAJAWAT API DESIGN

## PURPOSE

This document defines API standards, route structure, authentication, validation, error handling, pagination, and versioning.

All APIs must follow this specification.

---

# API PRINCIPLES

Rules:

* RESTful Design
* Consistent Responses
* Versioned APIs
* Validation First
* Security First

Base URL:

/api/v1

Future:

/api/v2

---

# RESPONSE FORMAT

Success:

{
"success": true,
"message": "Operation completed successfully",
"data": {}
}

Error:

{
"success": false,
"message": "Validation failed",
"errors": []
}

Never return inconsistent formats.

---

# AUTHENTICATION

Supported:

Email + Password

Google Login

SMS OTP

Authentication Method:

JWT Access Token

JWT Refresh Token

---

# AUTH ROUTES

POST

/api/v1/auth/register

POST

/api/v1/auth/login

POST

/api/v1/auth/google

POST

/api/v1/auth/send-otp

POST

/api/v1/auth/verify-otp

POST

/api/v1/auth/refresh-token

POST

/api/v1/auth/logout

GET

/api/v1/auth/me

---

# USER ROUTES

GET

/api/v1/users/profile

PATCH

/api/v1/users/profile

PATCH

/api/v1/users/change-password

GET

/api/v1/users/orders

GET

/api/v1/users/wishlist

---

# PRODUCT ROUTES

GET

/api/v1/products

GET

/api/v1/products/:slug

GET

/api/v1/products/search

GET

/api/v1/products/featured

GET

/api/v1/products/best-sellers

GET

/api/v1/products/new-arrivals

---

# CATEGORY ROUTES

GET

/api/v1/categories

GET

/api/v1/categories/:slug

---

# COLLECTION ROUTES

GET

/api/v1/collections

GET

/api/v1/collections/:slug

---

# WISHLIST ROUTES

GET

/api/v1/wishlist

POST

/api/v1/wishlist/:productId

DELETE

/api/v1/wishlist/:productId

---

# CART ROUTES

GET

/api/v1/cart

POST

/api/v1/cart/items

PATCH

/api/v1/cart/items/:itemId

DELETE

/api/v1/cart/items/:itemId

POST

/api/v1/cart/apply-coupon

---

# CHECKOUT ROUTES

POST

/api/v1/checkout

POST

/api/v1/checkout/verify-payment

POST

/api/v1/checkout/cod

---

# ORDER ROUTES

GET

/api/v1/orders

GET

/api/v1/orders/:id

POST

/api/v1/orders/:id/cancel

POST

/api/v1/orders/:id/return-request

---

# REVIEW ROUTES

GET

/api/v1/reviews/product/:productId

POST

/api/v1/reviews

PATCH

/api/v1/reviews/:id

DELETE

/api/v1/reviews/:id

---

# BLOG ROUTES

GET

/api/v1/blogs

GET

/api/v1/blogs/:slug

---

# CONTACT ROUTES

POST

/api/v1/contact

---

# B2B ROUTES

POST

/api/v1/b2b/inquiry

GET

/api/v1/b2b/company-information

---

# CUSTOMER NOTIFICATION ROUTES

GET

/api/v1/notifications

PATCH

/api/v1/notifications/read

---

# ADMIN ROUTES

Prefix:

/api/v1/admin

All routes require:

Authentication
+
Authorization

---

# ADMIN DASHBOARD

GET

/api/v1/admin/dashboard

GET

/api/v1/admin/dashboard/stats

---

# ADMIN PRODUCTS

GET

/api/v1/admin/products

POST

/api/v1/admin/products

GET

/api/v1/admin/products/:id

PATCH

/api/v1/admin/products/:id

DELETE

/api/v1/admin/products/:id

---

# ADMIN CATEGORIES

CRUD

/api/v1/admin/categories

---

# ADMIN COLLECTIONS

CRUD

/api/v1/admin/collections

---

# ADMIN INVENTORY

GET

/api/v1/admin/inventory

PATCH

/api/v1/admin/inventory/:productId

GET

/api/v1/admin/inventory/history

---

# ADMIN ORDERS

GET

/api/v1/admin/orders

GET

/api/v1/admin/orders/:id

PATCH

/api/v1/admin/orders/:id/status

PATCH

/api/v1/admin/orders/:id/payment

---

# ADMIN REVIEWS

GET

/api/v1/admin/reviews

PATCH

/api/v1/admin/reviews/:id/approve

PATCH

/api/v1/admin/reviews/:id/reject

---

# ADMIN COUPONS

CRUD

/api/v1/admin/coupons

---

# ADMIN CRM

GET

/api/v1/admin/crm/leads

POST

/api/v1/admin/crm/leads

PATCH

/api/v1/admin/crm/leads/:id

GET

/api/v1/admin/crm/leads/:id

---

# ADMIN CRM ACTIVITIES

POST

/api/v1/admin/crm/activities

GET

/api/v1/admin/crm/activities/:leadId

---

# ADMIN CMS

CRUD

/api/v1/admin/cms

---

# ADMIN BLOGS

CRUD

/api/v1/admin/blogs

---

# ADMIN USERS

CRUD

/api/v1/admin/users

---

# ADMIN SETTINGS

GET

/api/v1/admin/settings

PATCH

/api/v1/admin/settings

---

# ADMIN AUDIT LOGS

GET

/api/v1/admin/audit-logs

Read Only

No Delete Routes

---

# PAGINATION STANDARD

Query Parameters:

?page=1
&limit=20

Response:

{
"success": true,
"data": [],
"pagination": {
"page": 1,
"limit": 20,
"total": 100,
"pages": 5
}
}

---

# FILTERING STANDARD

Example:

/products?category=necklaces

/products?collection=wedding

/products?featured=true

/products?bestSeller=true

---

# SORTING STANDARD

Example:

?sort=price

?sort=-price

?sort=createdAt

---

# VALIDATION

All requests must validate:

* Body
* Query Params
* Route Params

Recommended:

Zod

---

# ERROR CODES

400

Validation Error

401

Unauthorized

403

Forbidden

404

Not Found

409

Conflict

429

Rate Limited

500

Internal Error

---

# RATE LIMITING

Public APIs:

Strict

Authentication APIs:

Very Strict

Admin APIs:

Protected

---

# VERSIONING POLICY

All APIs:

/api/v1

Breaking changes require:

/api/v2

Never break existing clients.

---

# API REVIEW RULE

Before adding any endpoint:

1. Business Justification
2. Security Review
3. Validation Review
4. Permission Review
5. Performance Review

Only then implement.

---

# ADDENDUM — Storefront experience layer (2026-07-04)

Public, read-only additions made during the client-showcase storefront redesign
(develop, PRs #3–#10). No auth; consumed by `apps/web`.

## Public offers

`GET /api/v1/offers`

- **Purpose:** advertisable, store-wide promotions for the PDP "Available offers"
  box. Promotions are **not per-product** — they apply to any SKU gated by
  `minCartValue` — so the storefront lists the active offers a product qualifies
  for.
- **Auth:** none.
- **Output:** `{ "data": { "items": PublicOffer[] } }`, where `PublicOffer` =
  `{ id, name, trigger: 'automatic'|'coupon', code?, rewardType: 'percentage'|'fixed', value, minCartValue, maxDiscount?, endDate? }`.
- **Security:** usage limits (`usageLimit`, `perCustomerLimit`) and internal
  fields are **never** exposed. Only `status:'active'` promotions within their
  date window are returned (`promotionService.listActivePublic`).

## Product listing filters (extends `GET /api/v1/products`)

New optional query params (validated in `product.validation.ts`, applied in
`product.service.listPublic`):

- `minPrice` / `maxPrice` — numeric range on the **base list price** (`price`);
  operators marked `mongoose.trusted` per AD-9. Not the discounted `salePrice`
  (deliberate, predictable behaviour).
- `inStock=true` — restricts to purchasable products via an inventory join
  (`inventoryService.getInStockProductIds` → `_id $in`).

Existing params unchanged: `page, limit, sort, category, collection, featured,
bestSeller`.
