# SAJAWAT ADMIN SPECIFICATION

## PURPOSE

This document defines all admin functionality, workflows, permissions, and operational tools available within the Sajawat platform.

The admin panel is a business operations platform, not merely a content management system.

---

# ADMIN PHILOSOPHY

The admin panel must enable:

* Business Growth
* Inventory Control
* Customer Management
* CRM Operations
* Marketing Operations
* Analytics
* Content Management

Every action must be:

* Auditable
* Secure
* Permission Controlled

---

# ADMIN ROLES

## Super Admin

Full Access

Can:

* Manage System
* Manage Users
* Manage Permissions
* Manage Settings
* View Audit Logs

---

## Admin

Operational Access

Can:

* Manage Products
* Manage Orders
* Manage Inventory
* Manage CRM
* Manage Marketing

Cannot:

* Modify Super Admin Accounts

---

## Inventory Staff

Can:

* Manage Inventory
* View Products
* View Orders

Cannot:

* Access CRM
* Access Marketing

---

## Marketing Team

Can:

* Coupons
* Popups
* Blogs
* CMS
* Analytics

Cannot:

* Access Security Settings

---

## Customer Support

Can:

* View Customers
* View Orders
* View CRM

Cannot:

* Modify System Settings

---

# DASHBOARD

Purpose:

Business Overview

Widgets:

Revenue

Orders

Inventory Alerts

CRM Leads

Top Products

Recent Orders

Conversion Metrics

Notifications

---

# PRODUCT MANAGEMENT

Features:

Create Product

Edit Product

Archive Product

Delete Product

Duplicate Product

Bulk Update Products

Bulk Import Products

Bulk Export Products

---

# PRODUCT FORM

Fields:

Name

Slug

SKU

Description

Category

Collections

Price

Sale Price

9 Images

1 Video

SEO Metadata

Status

Featured

Best Seller

---

# CATEGORY MANAGEMENT

Features:

Create

Edit

Delete

Sort

Enable

Disable

---

# COLLECTION MANAGEMENT

Features:

Create

Edit

Delete

Assign Products

Manage Banners

---

# INVENTORY MANAGEMENT

Features:

Current Stock

Stock Adjustments

Low Stock Alerts

Out Of Stock Alerts

Inventory History

Inventory Audit Trail

---

# INVENTORY ADJUSTMENTS

Reasons:

Stock Added

Stock Removed

Damaged

Returned

Manual Adjustment

All adjustments logged.

---

# ORDER MANAGEMENT

Features:

View Orders

Filter Orders

Update Status

Manage Returns

Manage COD Orders

View Timeline

---

# ORDER STATUSES

Created

Payment Pending

Paid

Processing

Packed

Shipped

Delivered

Cancelled

Refunded

---

# CUSTOMER MANAGEMENT

Features:

View Customers

Customer History

Order History

CRM History

Contact Information

---

# REVIEW MANAGEMENT

Features:

Approve Review

Reject Review

Delete Review

View Review Images

Moderation Queue

---

# CRM MODULE

Lead Sources:

B2B

Contact Form

Manual Entry

Customer Requests

---

# CRM PIPELINE

Lead Created

Contacted

Follow Up

Quotation Sent

Negotiation

Won

Lost

---

# CRM FEATURES

Lead Timeline

Activity Log

Notes

Assignments

Status Changes

Lead Search

Lead Filters

---

# CRM ACTIVITIES

Call

Email

WhatsApp

Meeting

Follow Up

Internal Note

Every activity logged.

---

# CMS MODULE

Editable:

Homepage

Hero Banner

Hero Video

Collections

Landing Pages

Policies

FAQs

B2B Pages

Footer Content

---

# BLOG MANAGEMENT

Features:

Create Article

Edit Article

Delete Article

Schedule Article

Manage SEO

Manage Tags

Manage Categories

---

# MARKETING MODULE

Features:

Coupons

Promotions

Popups

Campaign Tracking

---

# COUPON TYPES

Percentage

Flat Discount

Minimum Cart

Product Specific

Category Specific

User Specific

---

# POPUP MANAGEMENT

Popup Types:

Offer

Festival

Announcement

Lead Capture

Admin Configurable

---

# ANALYTICS MODULE

Metrics:

Revenue

Orders

Customers

Conversion Rate

Average Order Value

Cart Abandonment

Top Products

Lead Conversion

---

# USER MANAGEMENT

Features:

Create User

Edit User

Disable User

Assign Roles

Reset Password

Manage Permissions

---

# ROLE MANAGEMENT

Create Roles

Edit Roles

Assign Permissions

View Permission Matrix

---

# NOTIFICATION CENTER

Admin Notifications:

New Order

Low Inventory

New Lead

Review Pending

System Alerts

---

# SETTINGS MODULE

Business Settings

SMTP Settings

WhatsApp Settings

Payment Settings

Analytics Settings

SEO Settings

---

# SECURITY SETTINGS

2FA Configuration

IP Whitelisting

Session Controls

Access Policies

---

# AUDIT LOGS

Immutable

Read Only

Track:

Login Events

Order Changes

Inventory Changes

CRM Changes

User Changes

Settings Changes

---

# FILE MANAGER

Purpose:

Central Media Management

Features:

Upload

Delete

Tag

Search

Folder Organization

Image Optimization

Video Management

---

# SEARCH

Global Admin Search

Can Search:

Products

Orders

Customers

CRM Leads

Blogs

Coupons

Users

---

# ADMIN UX PRINCIPLES

Fast

Responsive

Search Driven

Keyboard Friendly

Minimal Clicks

Clear Information Hierarchy

---

# ADMIN RULE

Any business action that affects:

Revenue
Inventory
Customers
CRM
Security

must be:

Auditable
Permission Controlled
Recoverable
