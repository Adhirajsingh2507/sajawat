# SAJAWAT SYSTEM ARCHITECTURE

## PURPOSE

This document defines the high-level architecture of the Sajawat platform.

All implementation must follow this architecture unless explicitly approved through an architecture review.

The architecture is designed for:

* Scalability
* Maintainability
* Security
* Extensibility
* Performance

Initial Scale:

* 200–300 Products
* Stability Tier Infrastructure
* Growth Ready

---

# HIGH LEVEL SYSTEM

Platform Components:

Customer Website
+
Admin Platform
+
CRM System
+
CMS System
+
Inventory System
+
Marketing System
+
Analytics System

All systems share a common backend.

---

# ARCHITECTURE STYLE

Frontend:

Next.js Application

Backend:

Express API Server

Database:

MongoDB

Storage:

Google Cloud Storage

Authentication:

JWT + Refresh Tokens

External Services:

Payment Gateway
Email Service
SMS Provider
WhatsApp Provider
Google Analytics
Meta Pixel

---

# PROJECT STRUCTURE

root/

apps/
├── web
├── admin

services/
├── api

packages/
├── ui
├── shared
├── types
├── config

docs/

.claude/

---

# CUSTOMER WEBSITE ARCHITECTURE

Pages:

Home

Collections

Categories

Product Listing

Product Details

Wishlist

Cart

Checkout

Orders

Profile

Blog

Contact

B2B

Policies

Authentication

All pages must be SEO optimized.

---

# ADMIN PLATFORM ARCHITECTURE

Modules:

Dashboard

Orders

Products

Inventory

Customers

CRM

Marketing

Coupons

Reviews

CMS

Analytics

Payments

Shipping

Notifications

User Management

Audit Logs

Settings

Each module should be isolated.

No module should directly depend on another module's internal implementation.

---

# BACKEND ARCHITECTURE

Pattern:

Controller
→ Service
→ Repository
→ Database

Rules:

Controllers:

Request Handling Only

Services:

Business Logic

Repositories:

Database Logic

Never mix responsibilities.

---

# DOMAIN MODULES

Auth

Users

Products

Categories

Collections

Inventory

Orders

Payments

Coupons

Reviews

Wishlist

CRM

CMS

Marketing

Notifications

Analytics

Shipping

Audit Logs

Settings

Each module owns:

Routes

Controllers

Services

Repositories

Validation

Types

---

# DATABASE ARCHITECTURE

Collections:

users

products

categories

collections

inventory

orders

order_items

payments

reviews

wishlists

crm_leads

crm_activities

coupons

notifications

blogs

cms_pages

audit_logs

settings

Relationships should be designed for future scale.

Use indexing from day one.

---

# AUTHENTICATION ARCHITECTURE

Customer:

Email Password

Google Login

SMS OTP

Admin:

Email Password

2FA

IP Restrictions

Session Management

Refresh Tokens

Role Validation

---

# ROLE BASED ACCESS CONTROL

Roles:

Super Admin

Admin

Manager

Inventory Staff

Marketing Team

Customer Support

Permissions should be centralized.

Never hardcode role checks.

---

# CRM ARCHITECTURE

Lead Sources:

B2B Form

Contact Form

Manual Entry

Lead Stages:

Lead Created

Contacted

Follow Up

Quotation Sent

Negotiation

Won

Lost

CRM must maintain complete activity history.

---

# CMS ARCHITECTURE

Editable Content:

Homepage

Banners

Collections

Blogs

Policies

FAQs

Landing Pages

Hero Video

Hero Slider

CMS should be schema driven.

Avoid hardcoded content.

---

# INVENTORY ARCHITECTURE

Real-Time Inventory

Features:

Stock Tracking

Stock History

Low Stock Alerts

Out Of Stock Alerts

Inventory Adjustments

Inventory Auditing

Inventory changes must be logged.

---

# ORDER ARCHITECTURE

Order Lifecycle:

Created

Payment Pending

Paid

Processing

Packed

Shipped

Delivered

Cancelled

Refunded

All state transitions should be auditable.

---

# PAYMENT ARCHITECTURE

Payment Layer should be provider independent.

Supported:

COD

Online Payments

Future providers should be pluggable.

Never tightly couple business logic to a payment provider.

---

# SEARCH ARCHITECTURE

Version 1:

MongoDB Search

Search By:

Product Name

Category

Collection

Filters

Architecture should support future search upgrades without rewriting business logic.

---

# REVIEW ARCHITECTURE

Customer Review

Rating

Review Text

Images

Admin Moderation

Approval Workflow

Review Audit Trail

---

# ANALYTICS ARCHITECTURE

Internal Analytics

Google Analytics

Meta Pixel

Search Console

Track:

Revenue

Orders

Conversion

Cart Abandonment

Top Products

Customer Retention

---

# NOTIFICATION ARCHITECTURE

Channels:

Email

WhatsApp

SMS

Notifications should be event driven.

Examples:

Order Placed

Order Shipped

Lead Created

Inventory Low

Coupon Created

---

# CACHING ARCHITECTURE (PHASE 2 — PLANNED)

Status:

PLANNED. Not implemented in Phase 0 or Phase 1.

Technology:

Redis

Intended Use:

Product / listing response caching

Search result caching

Session and refresh-token store

Rate-limit counters

OTP storage with TTL

Design Rule:

Application code must access caching through an abstraction so the
platform runs correctly with the cache absent (cache-aside pattern).
Redis is introduced as a performance/scaling optimization, never as a
correctness dependency.

---

# SECURITY ARCHITECTURE

Mandatory:

Input Validation

Rate Limiting

CSRF Protection

XSS Protection

Secure Headers

RBAC

2FA

Immutable Audit Logs

Secret Management

IP Restrictions

Security must be reviewed for every major feature.

---

# DEPLOYMENT ARCHITECTURE

Client Owned Infrastructure

Client Owned:

Domain

Hosting

Database

Payment Accounts

Email Accounts

SMS Accounts

Deployments should support:

Development

Staging

Production

Environments must remain isolated.

---

# SCALING STRATEGY

Validation Tier

100 Users

↓

Growth Tier

500 Users

↓

Stability Tier

1,000 Users

↓

Scaling Tier

5,000 Users

↓

Advanced Tier

10,000 Users

Architecture must support horizontal and vertical growth without major rewrites.

---

# ARCHITECTURE REVIEW RULE

Before implementing any major feature:

1. Architecture Review
2. Database Review
3. API Review
4. Security Review
5. Scalability Review

Only then begin implementation.
