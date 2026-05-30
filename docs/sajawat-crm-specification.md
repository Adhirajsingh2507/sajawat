# SAJAWAT CRM SPECIFICATION

## PURPOSE

This document defines the CRM system used by Sajawat.

The CRM is a core business system.

Its purpose is to manage:

* B2B Leads
* B2C Leads
* Customer Relationships
* Sales Activities
* Follow Ups
* Business Growth

The CRM must function as a business operations platform rather than a simple contact database.

---

# CRM OBJECTIVES

Primary Goals:

* Increase Lead Conversion
* Improve Customer Retention
* Improve Sales Visibility
* Improve Follow-Up Consistency
* Centralize Customer Information

---

# CRM ENTITY TYPES

## B2B Lead

Source:

Wholesale Inquiry Form

Characteristics:

Business Customer

Expected Bulk Orders

Requires Follow-Up

---

## B2C Lead

Source:

Contact Form

Product Inquiry

Customer Requests

Manual Entry

Characteristics:

Individual Customer

Potential Purchase

---

## Existing Customer

Source:

Completed Orders

Characteristics:

Purchase History Exists

Customer Relationship Must Be Maintained

---

# LEAD SOURCES

Possible Sources:

B2B Inquiry Form

Contact Form

Phone Call

WhatsApp

Manual Entry

Referral

Social Media

Email

Each lead must track its source.

---

# LEAD PIPELINE

Stages:

Lead Created

↓

Contacted

↓

Follow Up

↓

Quotation Sent

↓

Negotiation

↓

Won

or

Lost

Every lead must always belong to a stage.

---

# LEAD PROFILE

Each lead contains:

Lead ID

Name

Company Name

GST Number

Phone

Email

City

Lead Source

Lead Stage

Assigned User

Created Date

Updated Date

---

# LEAD DETAILS

Store:

Products Interested In

Expected Quantity

Business Notes

Internal Notes

Communication History

---

# LEAD ASSIGNMENT

Leads can be assigned to:

Admin

Sales Manager

Customer Support

Assignments should be visible in CRM dashboards.

---

# LEAD TIMELINE

Every lead should maintain a timeline.

Examples:

Lead Created

Call Made

Email Sent

WhatsApp Sent

Quotation Sent

Status Changed

Follow Up Scheduled

Won

Lost

Timeline entries are immutable.

---

# CRM ACTIVITIES

Activity Types:

Call

Email

WhatsApp

Meeting

Follow Up

Internal Note

Quotation

Every activity should include:

Date

Time

User

Notes

---

# FOLLOW UPS

Users should be able to create:

Future Follow Ups

Fields:

Date

Time

Notes

Assigned User

Status

Open

Completed

Missed

---

# REMINDERS

CRM should generate reminders for:

Pending Follow Ups

Overdue Follow Ups

Uncontacted Leads

---

# QUOTATION MANAGEMENT

CRM should support:

Quotation Number

Lead Reference

Notes

Status

Sent Date

Future integrations may generate PDF quotations.

Architecture should remain extensible.

---

# CUSTOMER PROFILE

For existing customers track:

Personal Information

Order History

Total Orders

Total Revenue

Last Order Date

CRM Notes

Customer Timeline

---

# CUSTOMER TIMELINE

Track:

Registration

Orders

Returns

Reviews

Contact Requests

CRM Activities

Timeline should provide a complete customer history.

---

# B2B WORKFLOW

Visitor

↓

Wholesale Form

↓

CRM Lead Created

↓

Admin Assigned

↓

Contacted

↓

Negotiation

↓

Won / Lost

---

# B2C WORKFLOW

Visitor

↓

Contact Form

↓

CRM Lead Created

↓

Admin Assigned

↓

Follow Up

↓

Purchase

or

Lost

---

# SEARCH

CRM Search Must Support:

Name

Phone

Email

Company Name

Lead ID

City

Status

Assigned User

---

# FILTERS

Filter By:

Lead Source

Lead Stage

Assigned User

Date Range

Status

City

---

# DASHBOARD

CRM Dashboard Widgets:

New Leads

Open Leads

Won Leads

Lost Leads

Follow Ups Today

Overdue Follow Ups

Lead Sources

Conversion Rate

---

# REPORTS

Lead Reports

Sales Reports

Conversion Reports

Source Reports

Follow Up Reports

Performance Reports

---

# PERFORMANCE METRICS

Track:

Lead Count

Won Count

Lost Count

Conversion Rate

Average Follow Up Time

Lead Source Performance

---

# PERMISSIONS

Role Based Access

Examples:

Super Admin

Admin

Sales Manager

Customer Support

Permissions should be configurable.

---

# AUDIT REQUIREMENTS

Log:

Lead Creation

Lead Updates

Lead Assignment

Stage Changes

Activity Creation

Follow Up Completion

Audit entries cannot be deleted.

---

# NOTIFICATIONS

Notify Users When:

Lead Assigned

Follow Up Due

Follow Up Overdue

Lead Updated

Quotation Sent

---

# CRM RULES

Every lead must have:

Owner

Stage

Timeline

History

Activity Log

No lead should exist without accountability.

---

# SUCCESS CRITERIA

A user should be able to:

1. See every lead.
2. Understand lead status instantly.
3. View complete history.
4. Schedule follow ups.
5. Track conversions.
6. Improve sales performance.

The CRM must improve business operations, not merely store contact information.
