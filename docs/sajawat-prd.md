# SAJAWAT PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Executive Summary

SAJAWAT is a luxury imitation jewelry brand operating as:

* B2C E-Commerce Platform
* B2B Wholesale Lead Platform
* Manufacturer Management Platform
* CRM-Enabled Business Platform

The objective is to create a scalable, secure, premium jewelry platform inspired by Illuminate Jewellery while maintaining a unique Sajawat identity.

Target launch catalog:

* 200–300 products

Primary goals:

* Product sales
* Brand building
* Lead generation
* Wholesale inquiries
* Customer retention

---

# 2. Stakeholders

## Customer

Can:

* Register
* Login
* Browse products
* Search products
* Add to wishlist
* Add to cart
* Checkout
* Track orders
* Submit reviews

---

## B2B Customer

Can:

* Browse products
* Submit wholesale inquiry
* Request quotations
* Contact business

Cannot:

* Place wholesale orders directly

---

## Admin

Can:

* Manage products
* Manage orders
* Manage inventory
* Manage CRM
* Manage customers
* Manage marketing
* Manage CMS

---

## Super Admin

Full platform access.

Can:

* Manage admin users
* Configure security
* Configure infrastructure
* Configure permissions

---

# 3. Authentication

Supported methods:

* Email + Password
* Google Login
* SMS OTP Login

Customer account required.

Guest checkout is not supported.

Admin requirements:

* 2FA
* RBAC
* IP Restrictions

---

# 4. Customer Website

## Homepage

Inspired by Illuminate Jewellery.

Components:

* Offer Slider
* Hero Banner
* Category Section
* Featured Collections
* Best Sellers
* New Arrivals
* Reviews
* Blog Section
* B2B Section
* Footer

Admin can configure:

* Slider Images
* Hero Images
* Hero Video
* Promotional Popups

---

## Product Listing Page

Features:

* Search
* Filters
* Sorting
* Pagination

Filters:

* Category
* Collection
* Price
* New Arrivals
* Best Sellers

---

## Product Detail Page

Contains:

* Product Name
* Product Images
* Product Video
* Description
* Pricing
* Reviews
* Related Products

Media:

* 9 Images
* 1 Video

Actions:

* Add To Cart
* Buy Now
* Add To Wishlist

---

## Wishlist

Private wishlist.

No sharing.

---

## Cart

Supports:

* Quantity Updates
* Coupon Application
* Shipping Estimation

---

## Checkout

Supports:

* Online Payment
* Cash On Delivery

Customer must be authenticated.

---

## Order Tracking

Customer can view:

* Order Status
* Shipment Status
* Timeline

---

# 5. Customer Profile

Sections:

* Personal Information
* Order History
* Wishlist
* Reviews

Single saved address model.

---

# 6. Reviews

Customers can submit:

* Rating
* Review Text
* Review Images

Admin approval required.

---

# 7. Product Catalog

Launch Scale:

200–300 Products

Per Product:

* 9 Images
* 1 Video

SEO Fields:

* Meta Title
* Meta Description
* Keywords
* Slug
* Open Graph Image

---

# 8. B2B Module

Wholesale inquiry form.

Fields:

* Name
* Company Name
* GST Number
* Phone
* Email
* City
* Expected Quantity
* Product Interest
* Message

Submission triggers:

* CRM Lead Creation
* Email Notification
* WhatsApp Notification

---

# 9. CRM

Lead Stages:

* Lead Created
* Contacted
* Follow Up
* Quotation Sent
* Negotiation
* Won
* Lost

Applicable To:

* B2B
* B2C

Features:

* Notes
* Follow-Up History
* Customer Timeline

---

# 10. Admin Dashboard

Modules:

* Dashboard
* Orders
* Products
* Inventory
* Customers
* Marketing
* Coupons
* Reviews
* CMS
* Analytics
* Payments
* Shipping
* Returns
* Notifications
* CRM
* User Management
* Settings
* Audit Logs

---

# 11. Inventory

Real-Time Inventory.

Features:

* Stock Tracking
* Inventory History
* Low Stock Alerts
* Out Of Stock Alerts

Customer Feature:

* Notify Me When Available

---

# 12. Marketing

Admin Controlled.

Supports:

* Discount Coupons
* Category Coupons
* Product Coupons
* User Coupons
* Festival Campaigns
* Promotional Popups

---

# 13. Blog

SEO-focused blog system.

Features:

* Categories
* Tags
* Featured Images
* SEO Metadata

---

# 14. CMS

Editable by admin.

Supports:

* Homepage
* Banners
* Collections
* Blogs
* Landing Pages
* Policies
* FAQs

No developer required.

---

# 15. Notifications

Customer:

* Email
* WhatsApp

Admin:

* Order Alerts
* Inventory Alerts
* CRM Alerts

---

# 16. Analytics

Integrations:

* Google Analytics
* Meta Pixel
* Google Search Console

Reports:

* Revenue
* Orders
* Conversion Rate
* Top Products
* Customer Retention
* Cart Abandonment

---

# 17. Security

Mandatory:

* RBAC
* 2FA
* Immutable Audit Logs
* Rate Limiting
* Input Validation
* Secure Authentication
* Secret Management

---

# 18. Infrastructure

Frontend:

* Next.js
* TypeScript
* Tailwind CSS

Backend:

* Node.js
* Express.js
* TypeScript

Database:

* MongoDB

Cloud:

* Google Cloud

Storage:

* Google Cloud Storage

---

# 19. Performance Targets

Mobile First.

Target:

* Fast Product Search
* Optimized Images
* Excellent Core Web Vitals
* Fast Checkout

---

# 20. Out Of Scope

Version 1 excludes:

* Mobile Applications
* Multi-Currency
* Multi-Language
* AI Features
* Product Comparison
* Wishlist Sharing
* Product Q&A
* Loyalty Program
* Referral Program

