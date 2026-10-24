# Antigravity Agent Guidelines & Project Operating Rules

This document establishes the mandatory operational rules, coding standards, architectural boundaries, security policies, and Git workflows for all Antigravity AI agents working on **BrickBook**.

---

## 1. Golden Rules & Architectural Boundaries

1. **Strict Folder Isolation**:
   - All frontend application code, UI components, pages, styles, and client utilities MUST reside exclusively inside `frontend/`.
   - All backend application code, NestJS modules, controllers, services, database models, and server utilities MUST reside exclusively inside `backend/`.
   - Never create cross-project files, mixed dependency packages, or root-level application components.
2. **Phase-by-Phase Execution**:
   - Never generate the entire website or backend in a single autonomous step.
   - Always stop, report completion of the agreed phase, list planned changes for the next phase, and await explicit user approval before proceeding.
3. **Never Make Destructive or Unapproved Changes**:
   - Do not delete files, overwrite existing work, execute destructive shell commands, or install unvetted dependencies without explicit approval.
   - Do not run Git commands (`git init`, `git branch`, `git commit`, `git push`) unless explicitly requested by the user.

---

## 2. Technology Stack Mandate

- **Frontend**:
  - Framework: **Next.js 16 (App Router)**
  - UI Library: **React 19**
  - Language: **TypeScript** (Strict Mode)
  - Styling: **Tailwind CSS v4** (with CSS custom properties)
  - Package Manager: **pnpm** (Version 12+)
- **Backend**:
  - Framework: **NestJS** (Modular architecture)
  - Language: **TypeScript** (Strict Mode)
  - Database ORM: **Prisma ORM** with **PostgreSQL** (Planned for persistent business data)
  - Validation: **Zod** or **class-validator** + **class-transformer**

---

## 3. Design System & Palette Constraints

> [!CAUTION]
> **Zero Tolerance for Unauthorized Color Schemes**:
> Under NO circumstances should an agent introduce dark mode, terracotta themes, generic blue/green palettes, or unapproved styling. The exact original palette is immutable:

- **Navy**: `#213547` (Header, primary brand text)
- **Primary Amber**: `#d97706` (Primary interactive buttons, key badges)
- **Amber Hover**: `#b45309` (Hover & active button states)
- **Main Background**: `#f3f4f6` (Inner app background within 400px container)
- **Outer Viewport**: `#e5e7eb` (Surrounding canvas backdrop on larger screens)
- **Peach Cream**: `#f7ebe1` (Card accents, alert callouts, curing highlights)
- **Bottom Navigation**: `#fde8d0` (Bottom tab bar background)
- **White Cards**: `#ffffff` (Elevated card containers with subtle shadows)
- **Primary Text**: `#111827`
- **Secondary / Navy Text**: `#1a2b3c`
- **Success**: `#059669` (Ready stock, settled accounts)
- **Warning**: `#d97706` (Curing batches, pending balances)
- **Danger**: `#dc2626` (Validation errors, overdue amounts)
- **UPI**: `#4f46e5` (UPI payment badges)
- **Bank**: `#7e22ce` (Bank transfer badges)

### Layout Shell Constraint:
- Mobile-first container with a strict **`max-width: 400px`** centered horizontally (`mx-auto`).
- Elevated surfaces must be **rounded white cards (`#ffffff`)**.
- Exactly **three bottom navigation tabs**:
  1. **Dashboard**
  2. **Production**
  3. **Customers**
- **Customer Details Action Button Layout**:
  - Row 1 (Grid 2-col): **Call Customer** (`bg-[#213547]`) | **Generate Bill** (white card `border-gray-300` with `FileText` icon)
  - Row 2: Full-width **Add Sale** button (`bg-[#d97706]`, `rounded-2xl`, links directly to add-sale)
  - No redundant bottom Add Sale or standalone Weekly Bill PDF buttons.
- **Sale Editing & Creation Form Reuse**:
  - Clicking the edit/pencil icon on a sales card must open the exact same Add Sale form component (`/customers/[id]/add-sale?editSaleId=[id]`) in edit mode rather than a separate modal.
  - In edit mode, the form pre-populates existing sale data (date, quantity, rate, discount, vehicle number, notes), displays "Edit Sale" as header, and displays "Update Sale" on the primary action button. In create mode, the header displays "Add Sale" and the button displays "Confirm Sale".

---

## 4. Business Domain Logic Invariants

Every agent implementing business logic must verify compliance with these rules:

1. **Production Multipliers**:
   - Calculate output from raw materials using calibrated block multipliers (e.g. 4", 6" solid, 8" hollow blocks per cement bag).
2. **14-Day Curing Tracking**:
   - $T < 14\text{ days}$: Tagged as `Curing`, displayed with Warning badge (`#d97706`), strictly locked from customer dispatch.
   - $T \ge 14\text{ days}$: Automatically transitions to `Ready` stock, displayed with Success badge (`#059669`).
3. **Duplicate Production Dates**:
   - Prevent duplicate production records for the same block type and date unless explicitly identified with a distinct batch/shift number.
4. **FIFO Inventory (First-In, First-Out)**:
   - Dispatches must automatically deduct inventory from the oldest cured batch first.
5. **Stock Validation**:
   - Dispatches cannot exceed available `Ready` stock. Negative inventory is strictly prohibited.
6. **Kerala Vehicle Number Validation**:
   - Validate and normalize transport vehicle plates using the Kerala regex pattern:
     `^KL[- ]?[0-9]{1,2}[- ]?[A-Z]{1,3}[- ]?[0-9]{1,4}$`
   - Normalize to uppercase `KL-XX-YY-ZZZZ`.
7. **Financial Ledger & Payment Modes**:
   - Maintain running balance: `Due = Opening + Invoiced Dispatches - Payments Received`.
   - Accurately tag payments by mode: **Cash**, **UPI** (`#4f46e5`), or **Bank** (`#7e22ce`).

---

## 5. Security & Safe Secret Handling

- **Never Commit Secrets**: Never write API keys, database credentials, or secret tokens into source files or git history.
- **Environment Templates**: Always document required variables in `.env.example` files.
- **Input Sanitization**: All user-provided strings, vehicle numbers, and monetary amounts must be strictly validated before processing.
- **Security Middleware**: Backend must always include `helmet`, CORS whitelisting, and rate limiting.

---

## 6. Git & GitHub Workflow for Future Tasks

When Git operations are authorized by the user:

- **Conventional Commits**:
  - `feat(frontend): implement 400px shell and 3 bottom tabs`
  - `feat(backend): add health endpoint and swagger setup`
  - `fix(business): enforce 14-day curing lock on dispatch`
- **Branch Strategy**:
  - `main`: Production-ready, locked.
  - `develop`: Primary integration branch.
  - `feat/*` and `fix/*`: Specific task branches.
- **Pre-commit Checklist**:
  - `pnpm lint` passes with 0 errors.
  - `pnpm type-check` (or `tsc --noEmit`) passes with 0 errors.
  - No secret tokens or `.env` files staged.
