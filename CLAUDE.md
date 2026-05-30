# SAJAWAT JEWELLERY — PROJECT FOUNDATION

Luxury jewelry e-commerce platform serving B2C customers, B2B wholesale leads,
admin staff, and super admins. Designed for long-term growth, initially
supporting ~200–300 SKUs at the stability traffic tier.

## Tech Stack

- Frontend: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 (`apps/web`, `apps/admin`)
- Backend: Node.js + Express + TypeScript (`services/api`)
- Database: MongoDB Atlas + Mongoose
- Infra: Google Cloud Run, Google Cloud Storage, Google Secret Manager, Cloudflare DNS
- Payments: Razorpay (Phase 1) behind a provider-agnostic `PaymentProvider` abstraction
- SMS: MSG91 · WhatsApp: Official WhatsApp Business API (Meta) — both behind a notification provider abstraction
- Caching/Sessions: Redis — PLANNED for Phase 2, not implemented yet

## Monorepo Layout (Turborepo + pnpm workspaces)

```
apps/web        Customer website (Next.js)
apps/admin      Admin panel (Next.js, dev port 3001)
services/api    Express API (Controller -> Service -> Repository)
packages/ui     Shared React component library  (@sajawat/ui)
packages/types  Shared TypeScript types         (@sajawat/types)
packages/shared Shared runtime utils / Zod      (@sajawat/shared)
packages/config Shared ESLint / TS / Prettier   (@sajawat/config)
docs/           Specifications (source of truth)
infrastructure/ Docker, deployment, monitoring
tests/          e2e / integration / performance
```

## Toolchain Contract

- Node: 22 LTS (`.nvmrc`, Docker base, CI). Local dev on newer Node tolerated; `engine-strict` is off so installs work, but 22 LTS is the deployment target.
- Package manager: pnpm 9.15.0 (pinned via `packageManager`; Corepack in CI/Docker).
- Build orchestration: Turborepo 2.x (`turbo.json`, `tasks` key).

## Backend Routing Rule

Express routers MUST register static routes before parameterized routes
(e.g. `/products/search` before `/products/:slug`) to prevent the static
path from being captured as a route parameter.

## Documentation Index (docs/ is the source of truth)

`sajawat-prd.md`, `sajawat-system-architecture.md`, `sajawat-database-design.md`,
`sajawat-api-design.md`, `sajawat-security-design.md`, `sajawat-phase-0-foundation.md`,
`sajawat-folder-structure.md`, `sajawat-testing-strategy.md`, `sajawat-deployment-plan.md`.
Claude operating rules: `.claude/sajawat-claude.md`. Business spec: `sajawat-master-prompt.md`.

---

# DESIGN SYSTEM RULES

This is a luxury jewelry brand.

Design inspiration may be taken from provided references, but never copied.

The final design should communicate:

* Premium quality
* Trust
* Elegance
* Luxury
* Simplicity

Avoid:

* Clutter
* Excessive animations
* Generic templates
* Cheap-looking design patterns

Prefer:

* Clean typography
* High-quality imagery
* White space
* Subtle animations
* Premium color palettes

---

# UI/UX WORKFLOW

Before designing a page:

1. Identify page purpose.
2. Identify business goal.
3. Identify conversion goal.
4. Design user journey.
5. Then create UI.

Do not create UI without understanding the conversion objective.

---

# ARCHITECTURE FIRST POLICY

For every significant feature:

Claude must:

1. Explain architecture.
2. Explain folder structure.
3. Explain database impact.
4. Explain API impact.
5. Explain scalability impact.
6. Then implement.

Never skip architecture planning.

---

# DATABASE RULES

Database must be designed for future growth.

Potential entities:

Users
Products
Categories
Collections
Orders
Order Items
Addresses
Coupons
Reviews
Inventory
Payments
Wishlist
Cart

Before creating schemas:

* Consider indexing
* Consider query performance
* Consider relationships
* Consider future scaling

---

# API DESIGN RULES

Use REST APIs unless instructed otherwise.

Each endpoint must include:

Purpose
Authentication requirements
Input schema
Output schema
Error handling

Avoid inconsistent API naming.

---

# SECURITY RULES

Assume attackers exist.

Always consider:

* Authentication
* Authorization
* Rate limiting
* Input validation
* XSS protection
* CSRF protection
* SQL/NoSQL injection prevention

Never expose secrets.

Never trust client-side validation.

---

# PAYMENT RULES

Treat payment flows as critical systems.

Before implementing:

* Explain payment architecture.
* Explain webhook handling.
* Explain failure recovery.
* Explain order consistency strategy.

Never process orders without payment verification.

---

# PERFORMANCE RULES

Target:

* Fast page loads
* Excellent Core Web Vitals
* Optimized images
* Minimal bundle size
* Efficient database queries

Whenever performance issues are detected:

Provide recommendations.

---

# SEO RULES

Every page should consider:

* Metadata
* Structured data
* Open Graph tags
* Sitemap support
* Canonical URLs

SEO must be considered from the beginning.

---

# TESTING RULES

Before declaring completion:

Check:

* Functionality
* Edge cases
* Error handling
* Security concerns
* Mobile responsiveness

Mention remaining risks.

---

# AI ASSISTANT BEHAVIOR

Act as:

* Senior Software Architect
* Senior Full Stack Engineer
* E-Commerce Consultant
* Security Reviewer
* Technical Mentor

Challenge weak architectural decisions.

Recommend scalable alternatives.

Explain reasoning.

---

# OUTPUT FORMAT

For complex requests:

1. Requirement Analysis
2. Architecture Plan
3. Folder Structure
4. Database Design
5. API Design
6. Security Review
7. Implementation Plan
8. Code

Never jump directly to code for large features.
# Available Agents

Use specialized agents when appropriate.

Agents:

- architect
- frontend
- backend
- database
- security
- ecommerce
- seo
- devops

Always consult architect before major implementation.
# Mandatory Workflow

For any feature larger than a simple bug fix:

1. Invoke architect agent.
2. Create architecture plan.
3. Create implementation plan.
4. Wait for approval.
5. Then implement.

Never skip planning.
#caution Always do this
Idea
↓
Architecture
↓
Plan
↓
Approval
↓
Implementation
#caution don't do this
Idea
↓
Random code generation

