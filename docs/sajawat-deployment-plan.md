# SAJAWAT DEPLOYMENT PLAN

Version: 1.0

---

# PURPOSE

This document defines:

- Infrastructure
- Hosting
- Deployment
- Monitoring
- Logging
- Backup Strategy
- Disaster Recovery
- Security Controls

for the Sajawat platform.

The infrastructure must be:

- Secure
- Scalable
- Cost Effective
- Maintainable

---

# DEPLOYMENT PHILOSOPHY

Rules:

1. Infrastructure must be reproducible.
2. No manual production changes.
3. Every deployment must be reversible.
4. Every environment must be isolated.
5. Production data must never be used in development.

---

# ENVIRONMENTS

Three environments are required.

## Development

Purpose:

Developer environment

Characteristics:

- Local machine
- Mock services allowed
- Test data

---

## Staging

Purpose:

Pre-production testing

Characteristics:

- Mirrors production
- Test payment accounts
- Test integrations

---

## Production

Purpose:

Real customers

Characteristics:

- Live traffic
- Real payments
- Real CRM data

---

# HIGH LEVEL INFRASTRUCTURE

Customer Website

↓

Load Balancer

↓

Next.js Application

↓

API Server

↓

MongoDB

↓

Google Cloud Storage

↓

External Services

Payment Gateway

Email Provider

SMS Provider

WhatsApp Provider

Analytics

---

# GOOGLE CLOUD SERVICES

Frontend:

Cloud Run

Backend:

Cloud Run

Database:

MongoDB Atlas

Storage:

Google Cloud Storage

Secrets:

Google Secret Manager

Monitoring:

Google Cloud Monitoring

Logging:

Google Cloud Logging

DNS:

Cloudflare

SSL:

Cloudflare + Google Managed SSL

---

# DOMAIN STRUCTURE

Production:

sajawat.com

www.sajawat.com

Admin:

admin.sajawat.com

API:

api.sajawat.com

Staging:

staging.sajawat.com

api-staging.sajawat.com

---

# SSL REQUIREMENTS

All traffic must use HTTPS.

Requirements:

- TLS Enabled
- Automatic Renewal
- HSTS Enabled

No HTTP traffic.

---

# APPLICATION DEPLOYMENT

Frontend:

Next.js

Backend:

Node.js + Express

Containerized:

Docker

Every service must have:

Dockerfile

Health Checks

Environment Variables

Logging

Monitoring

---

# DATABASE DEPLOYMENT

MongoDB Atlas

Requirements:

- Daily Backups
- Encryption At Rest
- Private Access
- IP Restrictions

Collections:

Managed through migrations.

No manual schema modifications.

---

# FILE STORAGE

Google Cloud Storage

Purpose:

- Product Images
- Product Videos
- Blog Images
- CMS Assets

Requirements:

- Versioning
- Secure Access
- CDN Delivery

---

# SECRET MANAGEMENT

Store in:

Google Secret Manager

Examples:

Database URI

JWT Secret

SMTP Credentials

SMS Credentials

WhatsApp Credentials

Google OAuth Credentials

Analytics Keys

Never store secrets in Git.

---

# CI/CD PIPELINE

GitHub

↓

Pull Request

↓

Lint

↓

Tests

↓

Build

↓

Deploy To Staging

↓

Approval

↓

Deploy To Production

---

# BRANCHING STRATEGY

main

Production Ready

develop

Active Development

feature/*

New Features

hotfix/*

Emergency Fixes

---

# DEPLOYMENT CHECKLIST

Before Deployment:

✓ Tests Pass

✓ Build Passes

✓ Security Review Complete

✓ Documentation Updated

✓ Environment Variables Valid

✓ Database Migration Reviewed

---

# MONITORING

Monitor:

Website Availability

API Availability

Database Health

Storage Health

Order Processing

CRM Activity

Notifications

---

# ALERTING

Send Alerts For:

Server Down

API Failure

Database Failure

Payment Failure

Storage Failure

Backup Failure

High Error Rate

---

# LOGGING

Centralized Logging Required.

Log:

Authentication Events

Order Events

Inventory Events

CRM Events

Errors

Warnings

Never Log:

Passwords

OTP Codes

Secrets

Payment Credentials

---

# BACKUP STRATEGY

Database:

Daily

Retention:

30 Days

Storage:

Daily Snapshots

Retention:

30 Days

Configuration:

Version Controlled

---

# DISASTER RECOVERY

Recovery Objectives:

RPO:

24 Hours Maximum

RTO:

4 Hours Maximum

Recovery Process:

1. Restore Database
2. Restore Storage
3. Verify Services
4. Verify Orders
5. Verify CRM
6. Re-enable Traffic

---

# PERFORMANCE TARGETS

Homepage:

< 2 Seconds

Product Page:

< 2 Seconds

Checkout:

< 3 Seconds

Admin Dashboard:

< 3 Seconds

API:

< 500ms Average

---

# SECURITY CONTROLS

Required:

WAF

Rate Limiting

RBAC

2FA

IP Restrictions

Audit Logs

Secrets Management

TLS

---

# SCALING STRATEGY

Tier 1

100 Users

↓

Tier 2

500 Users

↓

Tier 3

1000 Users

↓

Tier 4

5000 Users

↓

Tier 5

10000 Users

Infrastructure should scale without major rewrites.

---

# POST DEPLOYMENT VALIDATION

Verify:

Homepage

Authentication

Products

Search

Cart

Checkout

Orders

CRM

Admin Panel

Analytics

Notifications

Only mark deployment successful after validation.

---

# DEFINITION OF SUCCESS

A deployment is successful when:

- System is available
- Orders can be placed
- CRM works
- Admin works
- Monitoring works
- Backups work
- No critical errors exist

---

# PRODUCTION PROMOTION & ROLLBACK RUNBOOK (Milestone 0.10b.3)

> Operator runbook for the `deploy-production.yml` pipeline. API-only (AD-54).
> Keyless WIF; no long-lived keys; no secrets in logs.

## One-time activation (closes D16 once complete)

1. **Provision both projects:** `./provision.sh staging && ./verify.sh staging`,
   then create the production project and `./provision.sh production && ./verify.sh production`.
2. **Inject rotated secrets** (`MONGODB_URI`, `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET`) via stdin into **both** projects' Secret Manager
   (see `infrastructure/scripts/gcp/README.md`).
3. **Cross-project reader grant** — production deployer SA gets repo-scoped
   `artifactregistry.reader` on the **staging** repo (promotion source; README §"Production promotion").
4. **`staging` GitHub Environment:** populate all non-secret variables (see §17 of
   `sajawat-current-architecture.md`). Push to `develop` → confirm **one green
   staging deploy** (this produces the promotable digest).
5. **`production` GitHub Environment:** create with a **required reviewer**, set
   deployment policy to **tags `v*`**, and add all variables including
   `STAGING_AR_IMAGE_PREFIX`.

## Cutting a production release

```bash
# Tag a commit that has ALREADY been deployed to staging (digest must exist):
git tag -a v0.10.1-phase0 <commit-sha> -m "Phase-0 closeout: production CD"
git push origin v0.10.1-phase0
```

This fires `deploy-production.yml`: quality gate → resolve staging digest →
**copy digest into prod AR** → **[REQUIRED REVIEWER GATE — approve in the Actions
UI]** → deploy `--no-traffic --tag=candidate --min-instances=1` → readiness gate
(candidate URL) → 100% traffic shift → post-shift validation (live URL).

To redeploy an existing tag without re-tagging: **Actions → Deploy (production) →
Run workflow → enter the tag**.

## Failure & rollback behaviour

- **Tag not built in staging** → job fails at digest resolution with a clear
  message; nothing deploys. Fix: deploy that commit to staging first.
- **Readiness gate fails (pre-shift)** → traffic never moves; prior revision keeps
  serving; no rollback needed. Inspect the candidate revision logs.
- **Post-shift validation fails** → **automated rollback (AD-57)**: traffic is
  restored to the previously-serving revision and re-health-checked; the job ends
  red with a `::warning::`. The bad candidate is left in place for post-mortem.
- **First-ever prod deploy fails post-shift** → no prior revision exists to roll
  back to; the job emits `::error::` demanding manual intervention (redeploy a
  known-good image or fix secrets/data plane).

## Rollback drill (required for D16 closure)

After the first successful prod deploy, prove AD-57 once: temporarily point
`APP_API_BASE_URL`/health to force a post-shift failure (or deploy a deliberately
unhealthy candidate via `workflow_dispatch` on a bad tag in a throwaway window),
confirm traffic auto-restores to the prior revision, then revert. Record the run
URL in `sajawat-open-debt.md` when moving D16 to Resolved.
