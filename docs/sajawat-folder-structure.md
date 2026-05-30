# SAJAWAT FOLDER STRUCTURE

## PURPOSE

Defines the official repository structure.

No developer should create arbitrary folders.

---

root/

├── apps/
│
│   ├── web/
│   │
│   ├── admin/
│
├── services/
│
│   ├── api/
│
├── packages/
│
│   ├── ui/
│   ├── shared/
│   ├── types/
│   ├── config/
│
├── docs/
│
├── scripts/
│
├── tests/
│
├── .claude/
│
└── infrastructure/

---

# WEB APP

apps/web/

src/

├── app/
├── components/
├── features/
├── hooks/
├── services/
├── lib/
├── types/
├── constants/
├── utils/
├── styles/

---

# ADMIN APP

apps/admin/

src/

├── app/
├── components/
├── features/
├── hooks/
├── services/
├── lib/
├── types/
├── constants/
├── utils/

---

# API

services/api/src/

├── modules/
│
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── collections/
│   ├── inventory/
│   ├── orders/
│   ├── payments/
│   ├── coupons/
│   ├── reviews/
│   ├── crm/
│   ├── cms/
│   ├── blogs/
│   ├── notifications/
│   ├── analytics/
│   ├── settings/
│   └── audit/
│
├── middleware/
├── config/
├── database/
├── shared/
├── utils/

---

# MODULE STRUCTURE

module/

├── controllers/
├── services/
├── repositories/
├── validators/
├── routes/
├── types/
├── constants/
├── tests/

---

# UI PACKAGE

packages/ui/

├── button/
├── input/
├── modal/
├── card/
├── table/
├── badge/
├── form/
├── layout/

---

# DOCUMENTATION

docs/

Contains all Sajawat documentation.

No implementation code.

---

# TESTS

tests/

├── e2e/
├── integration/
├── performance/

---

# INFRASTRUCTURE

infrastructure/

├── docker/
├── deployment/
├── monitoring/
├── backups/
├── scripts/

---

RULE:

New features must fit existing architecture.

Never create feature-specific folder structures.
