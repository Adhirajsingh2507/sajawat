# SAJAWAT DATABASE DESIGN

## PURPOSE

This document defines all database entities, relationships, indexes, constraints, and audit requirements.

All schema implementations must follow this design.

Database:

MongoDB

ODM:

Mongoose

---

# DATABASE PRINCIPLES

Design Priorities:

1. Maintainability
2. Performance
3. Scalability
4. Auditability
5. Security

Every business-critical action must be traceable.

---

# COLLECTION OVERVIEW

users

roles

products

categories

collections

inventory

inventory_movements

orders

order_items

payments

reviews

wishlists

carts

coupons

crm_leads

crm_activities

contact_requests

notifications

blogs

cms_pages

audit_logs

settings

---

# USERS

Purpose:

Authentication and customer profiles.

Fields:

_id

firstName

lastName

email

phone

passwordHash

googleId

isEmailVerified

isPhoneVerified

customerType        ('b2c' | 'b2b' — B2B is a customer segment, NEVER a seller)

status

role               (enum string per the code-canonical RBAC catalog in
                    @sajawat/shared — AD-20. Supersedes the original `roleId`
                    ref; a `roles` collection is deferred until an admin UI
                    manages custom roles. Defaults to 'customer'.)

address

createdAt

updatedAt

Address (single saved address — Phase 1, embedded):

address.fullName

address.phone

address.line1

address.line2

address.city

address.state

address.postalCode

address.country

Note:

Embedded single address for Phase 1. A dedicated `addresses`
collection (one-to-many) may be introduced in a later phase
without breaking existing orders, since orders snapshot the
address at purchase time.

Indexes:

email (unique, lowercased)

phone (sparse unique)

role

customerType

---

# ROLES (DEFERRED — RBAC is code-canonical)

Status:

Not implemented as a collection. Per AD-20, roles + the role→permission
matrix live in code (`@sajawat/shared`), the user stores a `role` enum,
and the access token carries the role only. A `roles` collection is
introduced only if/when an admin UI needs to manage custom roles.

Purpose (if later introduced):

RBAC

Fields:

_id

name

permissions

createdAt

updatedAt

Examples:

Super Admin

Admin

Manager

Inventory Staff

Marketing Team

Customer Support

---

# PRODUCTS

Purpose:

Product catalog.

Fields:

_id

name

slug

shortDescription

description

sku

price

salePrice

categoryId

collectionIds

images

video

seoTitle

seoDescription

seoKeywords

ogImage

status

isFeatured

isBestSeller

createdAt

updatedAt

Indexes:

slug

sku

categoryId

status

isFeatured

isBestSeller

---

# CATEGORIES

Purpose:

Product grouping.

Fields:

_id

name

slug

description

image

status

sortOrder

createdAt

updatedAt

Indexes:

slug

status

---

# COLLECTIONS

Purpose:

Marketing collections.

Examples:

Wedding Collection

Festive Collection

New Arrivals

Best Sellers

Fields:

_id

name

slug

description

bannerImage

status

createdAt

updatedAt

Indexes:

slug

status

---

# INVENTORY

Purpose:

Current stock status.

Fields:

_id

productId

quantity

reservedQuantity

availableQuantity

lowStockThreshold

status

updatedAt

Indexes:

productId

status

---

# INVENTORY MOVEMENTS

Purpose:

Audit inventory changes.

Fields:

_id

productId

type

quantity

reason

performedBy

createdAt

Movement Types:

Stock Added

Stock Removed

Order

Manual Adjustment

Return

Indexes:

productId

type

createdAt

---

# ORDERS

Purpose:

Order management.

Fields:

_id

orderNumber

userId

status

paymentStatus

paymentMethod

subtotal

discount

shipping

tax

total

address

notes

createdAt

updatedAt

Indexes:

orderNumber

userId

status

paymentStatus

createdAt

---

# ORDER ITEMS

Purpose:

Line items.

Fields:

_id

orderId

productId

productName

sku

price

quantity

subtotal

Indexes:

orderId

productId

---

# PAYMENTS

Purpose:

Payment tracking.

Fields:

_id

orderId

provider

transactionId

status

amount

currency

createdAt

Indexes:

orderId

transactionId

status

---

# REVIEWS

Purpose:

Customer reviews.

Fields:

_id

productId

userId

rating

title

comment

images

status

createdAt

Indexes:

productId

userId

status

rating

---

# WISHLISTS

Purpose:

Saved products.

Fields:

_id

userId

productIds

createdAt

updatedAt

Indexes:

userId

---

# CARTS

Purpose:

Persistent customer cart (server-side, survives sessions and devices).

Fields:

_id

userId

items

couponCode

subtotal

total

updatedAt

Item Shape (items[]):

items[].productId

items[].quantity

items[].priceAtAdd

Notes:

One active cart per authenticated user (no guest checkout).

`subtotal` / `total` are persisted for fast reads but MUST be
recomputed server-side at checkout against live product prices
and coupon validity. Never trust client-supplied totals.

Indexes:

userId (unique)

updatedAt

---

# PROMOTIONS (supersedes the original code-only "coupons")

Purpose:

Admin-configurable discount engine for Model A (B2C retail). Supports BOTH
automatic cart-value rules (no code, applied when conditions match) and
coupon codes — the admin chooses which to run. Replaces the original
code-only `coupons` design, which could not express automatic
spend-threshold discounts.

Fields:

_id

name                 (admin label)

trigger              ('automatic' | 'coupon')

code                 (required when trigger='coupon'; null for automatic)

rewardType           ('percentage' | 'fixed')

value                (percent or fixed amount)

minimumCartValue     (condition: subtotal threshold; the "cart over X" rule)

maximumDiscount      (cap for percentage rewards)

startDate

endDate

usageLimit           (global)

perCustomerLimit

status               ('active' | 'inactive')

createdAt

updatedAt

Integrity:

The applicable discount is ALWAYS recomputed server-side at cart/checkout
against the live cart subtotal and active promotions. Client-supplied
discounts/totals are never trusted.

Indexes:

code (sparse unique — only coupon-trigger promotions)

trigger

status

startDate

endDate

---

# CRM LEADS

Purpose:

Lead management.

Fields:

_id

source

type

name

companyName

gstNumber

phone

email

city

message

status

assignedTo

createdAt

updatedAt

Lead Stages:

Lead Created

Contacted

Follow Up

Quotation Sent

Negotiation

Won

Lost

Indexes:

status

assignedTo

phone

email

createdAt

---

# CRM ACTIVITIES

Purpose:

Lead timeline.

Fields:

_id

leadId

type

notes

performedBy

createdAt

Indexes:

leadId

createdAt

---

# CONTACT REQUESTS

Purpose:

Website inquiries.

Fields:

_id

name

email

phone

subject

message

status

createdAt

Indexes:

status

email

createdAt

---

# NOTIFICATIONS

Purpose:

Notification tracking.

Fields:

_id

channel

recipient

template

status

payload

createdAt

Indexes:

channel

status

createdAt

---

# BLOGS

Purpose:

SEO content.

Fields:

_id

title

slug

excerpt

content

featuredImage

seoTitle

seoDescription

seoKeywords

status

publishedAt

createdAt

Indexes:

slug

status

publishedAt

---

# CMS PAGES

Purpose:

Editable content.

Fields:

_id

pageType

title

slug

content

seoTitle

seoDescription

status

updatedAt

Indexes:

pageType

slug

status

---

# AUDIT LOGS

Purpose:

Immutable system history.

Fields:

_id

userId

action

module

entityId

before

after

ipAddress

createdAt

Indexes:

userId

module

action

createdAt

Audit logs are immutable.

No delete operations allowed.

---

# SETTINGS

Purpose:

Platform configuration.

Fields:

_id

key

value

updatedBy

updatedAt

Examples:

Payment Settings

SMTP Settings

WhatsApp Settings

Google Analytics

Meta Pixel

Business Information

Indexes:

key

---

# RELATIONSHIP RULES

Users
→ Orders

Orders
→ Order Items

Products
→ Reviews

Products
→ Inventory

CRM Leads
→ CRM Activities

Categories
→ Products

Collections
→ Products

All relationships must be documented before implementation.

---

# INDEX REVIEW RULE

Before creating any collection:

Review:

1. Query Patterns
2. Growth Expectations
3. Read Frequency
4. Write Frequency
5. Reporting Requirements

No collection should be implemented without index analysis.
