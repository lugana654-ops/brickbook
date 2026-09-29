# Frontend Technical Debt

## CRITICAL

### 1. Mixed Architecture / Legacy Backend Code
- **File/path:** `src/app/api/*`, `src/lib/prisma.ts`, `src/lib/productionService.ts`, `prisma/*`
- **Problem:** The codebase contains an unused Prisma setup and legacy API routes. The current frontend is completely disconnected from this and uses `ProductionContext` and `localStorage` instead.
- **Why it matters:** Causes build warnings, increases project complexity, and creates confusion about the source of truth.
- **Impact:** High. Future developers will be confused about whether to use context or APIs.
- **Recommended solution:** Since the project is purely frontend right now, either fully remove the Prisma/API files or move them to a `.legacy` folder until a real backend is implemented.
- **Fix now / fix later:** Fix now (Cleanup).

## HIGH

### 1. Duplicated Navigation Bar
- **File/path:** `src/app/page.tsx`, `src/app/production/page.tsx`
- **Problem:** The exact same `<nav>` element (bottom navigation bar) is duplicated across multiple pages.
- **Why it matters:** If a new route is added or a style changes, it must be updated in multiple places.
- **Impact:** Medium.
- **Recommended solution:** Extract the `<nav>` into a `BottomNav.tsx` component and include it in the layout or individual pages.
- **Fix now / fix later:** Fix now.

### 2. Duplicated Header Layouts
- **File/path:** All pages in `src/app/`
- **Problem:** The top header bar with the back arrow/menu icon is re-implemented on every page.
- **Why it matters:** Leads to inconsistent spacing and styling if one page is updated but others are not.
- **Impact:** Medium.
- **Recommended solution:** Create a reusable `Header.tsx` component.
- **Fix now / fix later:** Fix later.

## MEDIUM

### 1. Business Logic Inside UI Components
- **File/path:** `src/app/production/add/page.tsx`
- **Problem:** The calculation for `goodDate` (13 days logic) and brick counting is directly inside the Add Production UI component.
- **Why it matters:** Business rules should be centralized. If the curing time changes from 13 days to 15 days, it must be hunted down in UI files.
- **Impact:** Medium.
- **Recommended solution:** Move date calculation and quantity multipliers into utility functions or the `ProductionContext`.
- **Fix now / fix later:** Fix later.

### 2. Hardcoded Values & Magic Numbers
- **File/path:** Multiple UI files
- **Problem:** Colors like `#213547`, `#fde8d0`, and `#d97706` are hardcoded repeatedly using arbitrary values.
- **Why it matters:** If the theme needs to change, every file must be manually searched and updated.
- **Impact:** Low.
- **Recommended solution:** Define these colors in `globals.css` or as Tailwind configuration variables (e.g., `bg-primary`, `text-accent`).
- **Fix now / fix later:** Fix later.

## LOW

### 1. Missing Error Boundaries
- **File/path:** Global
- **Problem:** No global error boundary. If `localStorage` parsing fails catastrophically or a render errors out, the app will crash white.
- **Why it matters:** Poor user experience on crash.
- **Impact:** Low.
- **Recommended solution:** Add an `error.tsx` file in the app router.
- **Fix now / fix later:** Fix later.
