# BrickBook Technical Architecture & Business Domain Specification

This document details the software architecture, folder isolation boundaries, business domain logic, and validation rules for **BrickBook**.

---

## 1. System Architecture & Folder Isolation

BrickBook is structured as two cleanly decoupled applications within the workspace root:

```
brick book/
├── frontend/               # Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
└── backend/                # NestJS + TypeScript + Prisma ORM + PostgreSQL
```

### Architectural Principles:
1. **Strict Folder Boundaries**: No frontend code, components, or styles may exist outside `frontend/`. No backend controllers, services, or entities may exist outside `backend/`.
2. **Contract-Driven Communication**: Frontend communicates with the backend exclusively via RESTful JSON APIs.
3. **Type Safety**: Shared TypeScript interfaces, DTOs, and Zod validation schemas ensure end-to-end synchronization without tight coupling.

---

## 2. Core Business Domain Rules & Logic

### A. Production Multipliers & Yield Calculation
- **Concept**: In brick manufacturing, raw materials (cement bags, quarry dust, 6mm aggregate, chemical binders) are mixed in batches. Each brick specification has a calibrated output yield multiplier.
- **Formula**:
  $$\text{Total Produced Bricks} = \text{Input Cement Bags} \times \text{Multiplier}_{\text{Block Type}}$$
- **Standard Block Multipliers** (configurable per manufacturing unit):
  - **4-inch Solid Concrete Block**: e.g., $75 - 85\text{ bricks per 50kg bag of cement}$.
  - **6-inch Solid Concrete Block**: e.g., $50 - 55\text{ bricks per 50kg bag of cement}$.
  - **8-inch Hollow Block**: e.g., $40 - 45\text{ blocks per 50kg bag of cement}$.
- **Verification Rule**: The system validates that calculated output aligns with recorded physical pallet counts before committing the production batch.

---

### B. 14-Day Mandatory Curing Tracking
- **Engineering Principle**: Concrete blocks require a minimum 14-day water hydration/curing period to reach the required compressive strength ($M7.5$ / $M10$ / $M15$).
- **Lifecycle States**:
  $$\text{Days Elapsed} = \text{Current Date} - \text{Production Date}$$
  1. **`CURING`** ($\text{Days Elapsed} < 14$):
     - Batch is tagged with days remaining: $14 - \text{Days Elapsed}$.
     - Displayed with Warning badge (`#d97706`) and Peach Cream card accent (`#f7ebe1`).
     - **LOCKED FROM DISPATCH**: Curing stock cannot be selected or deducted for deliveries.
  2. **`READY`** ($\text{Days Elapsed} \ge 14$):
     - Batch automatically transitions to available ready stock.
     - Displayed with Success badge (`#059669`).
     - Eligible for FIFO customer dispatch.

---

### C. Duplicate Production Date Guard
- **Problem**: Plant operators often log shifts at the end of the day, leading to accidental duplicate submissions for the same calendar date.
- **Rule**: A production record is uniquely keyed by `(productionDate, blockTypeId, batchNumber)`.
- **Validation**:
  - If a production entry already exists for a specified date and block type without a distinct batch identifier (e.g. Batch 2 / Shift B), the system rejects the entry:
  - *Error*: `"A production entry for [Block Type] on [Date] already exists. Please specify a new batch number or edit the existing log."`

---

### D. FIFO Inventory (First-In, First-Out) Engine
- **Principle**: To prevent aged stock degradation and maintain uniform yard rotation, customer dispatches must exhaust the oldest cured stock first.
- **Algorithm**:
  1. Retrieve all batches matching the requested block type where $\text{status} = \text{'READY'}$ and $\text{remainingQuantity} > 0$.
  2. Order batches by `productionDate ASC` (oldest first).
  3. Sequentially allocate the required order quantity against batch `remainingQuantity`:
     - If $\text{Batch Quantity} \ge \text{Remaining Order}$, decrement batch quantity and complete allocation.
     - If $\text{Batch Quantity} < \text{Remaining Order}$, exhaust batch (`remainingQuantity = 0`), decrement remaining order, and continue to next batch.
  4. Record the specific batch allocations in the dispatch line item ledger for audit traceability.

---

### E. Stock Validation & Negative Inventory Guard
- **Rule**: Dispatch orders cannot exceed total unallocated `READY` inventory.
- **Validation Check**:
  $$\text{Available Ready Stock} = \sum_{\text{Batch } i \in \text{READY}} \text{Batch Quantity}_i$$
  $$\text{If } \text{Requested Quantity} > \text{Available Ready Stock} \implies \mathbf{REJECT}$$
- **Result**:
  - Rejects transaction with an explicit error: `"Insufficient ready stock. Requested: X, Available: Y (Z units currently in curing)."`.
  - Negative inventory is strictly prohibited across all operations.

---

### F. Kerala Vehicle Number Validation
- **Requirement**: Transportation of construction materials within Kerala must comply with Kerala Motor Vehicle Department (MVD) registration formats for tippers, trucks, and multi-axle lorries.
- **Standard Kerala Vehicle Registration Patterns**:
  - `KL` followed by 1 or 2 digits (RTO code, e.g. `KL 07`, `KL-7`, `KL 40`).
  - Optional series code (1 to 3 alphabetic letters, e.g. `A`, `AB`, `CA`, `ZZ`).
  - Registration number (1 to 4 digits, e.g. `1234`, `786`, `9`).
- **Regular Expression**:
  ```regex
  ^KL[- ]?[0-9]{1,2}[- ]?[A-Z]{1,3}[- ]?[0-9]{1,4}$
  ```
- **Normalization Pipeline**:
  - Strip excessive whitespace.
  - Transform to uppercase.
  - Format into canonical string: `KL-XX-YY-ZZZZ` (e.g., `KL-07-AB-1234`).
  - Rejection message: `"Invalid vehicle number. Must be a valid Kerala registration (e.g., KL-07-AB-1234)."`

---

### G. Customer Financial Ledger & Payment Modes
- **Ledger Model**: Each customer maintains a consolidated debit/credit running balance ledger:
  - **Debits (+)**: Value of dispatched bricks/goods invoiced to the customer.
  - **Credits (-)**: Payments received from the customer.
  - **Running Balance**: $\text{Current Due} = \text{Opening Balance} + \sum \text{Invoiced Deliveries} - \sum \text{Payments}$.
- **Payment Modes**:
  1. **Cash**: Directly recorded to daily register.
  2. **UPI** (`#4f46e5`): Requires UPI reference / UTR number for verification.
  3. **Bank Transfer / Cheque** (`#7e22ce`): Requires bank name, transfer date, and transaction/cheque ID.
- **Status Indicators**:
  - **Settled / Zero Balance**: Success (`#059669`).
  - **Pending / Active Balance**: Primary Amber (`#d97706`).
  - **Overdue Balance**: Danger (`#dc2626`).

---

## 3. Frontend Architecture (`frontend/`)

- **Framework**: **Next.js 16** (App Router) + **React 19**
- **Styling**: **Tailwind CSS v4** with HSL CSS custom property tokens
- **Layout Shell**:
  - Enforced `max-width: 400px` container centered horizontally (`mx-auto`).
  - Outer background `#e5e7eb` framing the inner `#f3f4f6` container.
- **Three Core Tabs**:
  1. `/dashboard`: Key business metrics (ready stock, curing stock, pending balances, recent activity).
  2. `/production`: Daily production logger, curing schedule calendar, batch yield calculator.
  3. `/customers`: Customer directory, dispatch management with vehicle logging, and financial ledgers.

---

## 4. Backend Architecture (`backend/`)

- **Framework**: **NestJS** (TypeScript)
- **Database & ORM**: **PostgreSQL** + **Prisma ORM** (planned for persistent storage)
- **Modular Boundaries**:
  - `HealthModule`: Liveness and readiness endpoints (`/api/health`).
  - `ProductionModule`: Batch logging, multiplier calculations, 14-day curing queries, duplicate date guards.
  - `InventoryModule`: FIFO stock allocation, stock queries, reserve locks.
  - `CustomersModule`: Customer profiles, ledger balances, dispatch logging with Kerala vehicle verification.
  - `PaymentsModule`: Multi-channel payment recording (Cash, UPI, Bank).

---

## 5. Security & Safe Environment Configuration

- **Zero Hardcoded Secrets**: Secrets must never be committed. `.env` files are ignored in `.gitignore`.
- **CORS Policy**: Backend will enforce strict CORS origins (`http://localhost:3000` in local development).
- **Helmet**: Secures HTTP headers on all API responses.
- **Rate Limiting**: Protects financial and dispatch submission endpoints from duplicate submissions and abuse.
- **Input Validation**: All incoming requests pass through strict validation pipes utilizing Zod or class-validator to reject malformed payloads.
