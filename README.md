# BrickBook

**BrickBook** is a real-world business management and operational tracking system purpose-built for brick and block manufacturing enterprises. It streamlines daily production logging, automated 14-day curing tracking, FIFO-based inventory dispatch, Kerala motor vehicle transport logging, and customer financial ledgers.

---

## 1. Project Overview & Architecture Boundaries

BrickBook is structured as a decoupled full-stack architecture with strict folder isolation:

- **`frontend/`**: Mobile-first client application built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and managed via **pnpm**.
- **`backend/`**: High-performance modular API built with **NestJS**, **TypeScript**, **Prisma ORM**, and planned **PostgreSQL** storage.

```
C:\PROJECTBRICKBOOK\brick book\
├── .gitignore             # Root exclusions for dependencies, builds, and secrets
├── README.md              # Project overview, specifications, and setup instructions
├── DESIGN_SYSTEM.md       # Canonical design tokens, component rules, and UI spec
├── ARCHITECTURE.md        # Technical architecture, business logic, and security rules
├── AGENTS.md              # Antigravity agent operational guidelines and protocols
├── frontend/              # All frontend Next.js 16 application code (isolated)
└── backend/               # All backend NestJS application code (isolated)
```

---

## 2. Core Business Rules (Domain Source of Truth)

1. **Production Multipliers**:
   - Calculates total brick output from input raw material batches (e.g., cement bags, quarry dust, aggregates) based on configurable block type multipliers (e.g., 4" solid, 6" solid, 8" hollow blocks).
2. **14-Day Curing Tracking**:
   - Manufactured bricks must undergo a strict 14-day water-sprinkling and curing cycle before becoming eligible for sale.
   - Bricks in curing ($T < 14\text{ days}$) are marked as **Curing Stock** and are locked from dispatch.
   - On day 14 ($T \ge 14\text{ days}$), the batch automatically transitions to **Ready Stock**.
3. **Duplicate Production Date Guard**:
   - Prevents duplicate production run entries for the same brick category on the same date unless explicitly differentiated by batch number.
4. **FIFO Inventory (First-In, First-Out)**:
   - Dispatches automatically allocate and deduct stock from the oldest cured batches first, ensuring structural integrity and preventing aged inventory stagnation.
5. **Stock Validation**:
   - Dispatches and sales orders are strictly validated against available **Ready Stock**.
   - Negative inventory is strictly prohibited; orders exceeding ready stock are rejected with validation feedback.
6. **Kerala Vehicle Number Validation**:
   - Transport vehicle registrations must conform to Kerala Motor Vehicle Department standards (e.g., `KL-07-AB-1234`, `KL 01 CA 9999`, `KL-40-786`).
   - Inputs are validated via regex and normalized to standard uppercase hyphenated format (`KL-XX-YY-ZZZZ`).
7. **Financial Ledger & Payment Modes**:
   - Maintains an accurate running balance per customer (`Balance = Opening Balance + Invoiced Dispatches - Payments Received`).
   - Supports designated payment channels: **Cash**, **UPI** (`#4f46e5`), and **Bank Transfer / Cheque** (`#7e22ce`).

---

## 3. Design System & Application Shell

BrickBook implements a dedicated mobile-first viewport design system adhering strictly to the original palette:

- **Application Shell**:
  - Maximum container width: **`400px`** (centered horizontally on larger screens).
  - Outer viewport background: `#e5e7eb` (subtle contrast frame for desktop viewing).
  - Main application background: `#f3f4f6`.
  - Elevated surfaces: Rounded white cards (`#ffffff`) with subtle shadows.
- **Bottom Navigation**:
  - Fixed at the bottom of the 400px shell with background `#fde8d0`.
  - Exactly **three navigation tabs**:
    1. **Dashboard** (Summary metrics, ready vs curing stock, quick actions)
    2. **Production** (Daily batch entry, curing calendar, yield calculations)
    3. **Customers** (Customer directory, dispatch orders, financial ledgers)
- **Original Color Palette**:
  - **Navy**: `#213547` (Brand text, primary headings)
  - **Primary Amber**: `#d97706` (Primary action buttons, active indicators)
  - **Amber Hover**: `#b45309` (Hover & active button states)
  - **Peach Cream**: `#f7ebe1` (Card accents, notification callouts)
  - **Bottom Navigation**: `#fde8d0` (Bottom bar background)
  - **Main Background**: `#f3f4f6` (Inner view container)
  - **Outer Viewport**: `#e5e7eb` (Surrounding desktop backdrop)
  - **White Cards**: `#ffffff` (Elevated card containers)
  - **Text Colors**: `#111827` (Primary body) and `#1a2b3c` (Deep navy subtitle)
  - **Success**: `#059669` (Ready stock, paid invoices)
  - **Warning**: `#d97706` (Active curing, pending payments)
  - **Danger**: `#dc2626` (Overdue balances, stock errors)
  - **UPI**: `#4f46e5` (UPI payment badges)
  - **Bank**: `#7e22ce` (Bank transfer badges)

*Note: No dark mode or unauthorized color themes are permitted.*

---

## 4. Technology Stack Summary

| Layer | Technology | Version / Tooling |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | v16 |
| **Frontend UI Library** | React | v19 |
| **Frontend Styling** | Tailwind CSS | v4 |
| **Language** | TypeScript | Strict Mode |
| **Package Manager** | pnpm | v12+ |
| **Backend Framework** | NestJS | Node.js v24 LTS |
| **Database ORM** | Prisma ORM | PostgreSQL (Planned) |
| **API Validation** | Zod / class-validator | Strict DTO checking |

---

## 5. Environment Variables & Safe Secret Handling

Secrets must never be committed to source control. Each environment uses `.env.example` templates:

### Frontend (`frontend/.env.example`)
```env
NEXT_PUBLIC_APP_NAME="BrickBook"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"
```

### Backend (`backend/.env.example`)
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/brickbook?schema=public"
JWT_SECRET="replace-with-a-secure-random-secret"
CORS_ORIGIN="http://localhost:3000"
```

---

## 6. Implementation Roadmap

- [x] **Phase 1: Project Foundation & Specifications** (Documentation, `.gitignore`, design tokens, agent rules)
- [ ] **Phase 2: Frontend Scaffolding & Design System Tokens** (Next.js 16 in `frontend/`, Tailwind v4 configuration, color definitions)
- [ ] **Phase 3: Core UI Primitives & 400px Mobile Shell** (White cards, 3 bottom navigation tabs, typography, form controls)
- [ ] **Phase 4: Backend Scaffolding & Architecture** (NestJS in `backend/`, modular structure, health check)
- [ ] **Phase 5: Domain Logic & Business Rules** (Curing logic, FIFO stock engine, Kerala vehicle validator, ledger math)
- [ ] **Phase 6: Testing, Accessibility & Production Hardening** (WCAG 2.1 AA audits, unit & integration tests)
