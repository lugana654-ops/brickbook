# Current Architecture

## Overview
The BrickBook application currently operates as a purely frontend-driven application utilizing Next.js App Router for routing, and React Context combined with `localStorage` for state management and persistence. There is no active backend or database, although legacy backend files exist in the codebase.

## Architecture Flow

The data flow in the current application follows a React Context Provider pattern:

```
Page (e.g., Dashboard, History)
       ↓
ProductionContext (useProduction hook)
       ↓
ProductionProvider (State & Logic Engine)
       ↓
localStorage (Persistence)
```

## Detailed Flow Breakdown

### 1. Pages (UI Layer)
- Pages are located in `src/app/`.
- They act as the primary views (Dashboard, Production Menu, Add Production, History).
- Pages contain UI layout, styling (Tailwind CSS), and consume data/actions from the `useProduction` hook.

### 2. State & Business Logic (Context Layer)
- **File:** `src/context/ProductionContext.tsx`
- **Ownership:** Owns the global `records` state.
- **Logic:** Contains business rules for enriching records (calculating `isGood`, `daysRemaining`) and computing dashboard stats (`computeStats`).
- **Persistence:** Synchronizes the `records` array with the browser's `localStorage` (`brickbook_production_records`).

### 3. Shared Components (Component Layer)
- **File:** `src/components/DatePickerModal.tsx`
- **Purpose:** A reusable custom date picker modal.
- **Usage:** Used by `AddProductionPage` and `ProductionHistoryPage` for date selection.

### 4. Legacy / Unused Backend (Service Layer)
- **Files:** `src/lib/productionService.ts`, `src/lib/prisma.ts`, `src/app/api/...`
- **Status:** Currently bypassed. The app relies entirely on `ProductionContext` instead of fetching from these API routes.

## Routing and Navigation
- Uses Next.js App Router (`src/app`).
- Navigation between pages is handled via the `<Link>` component.
- The bottom navigation bar is currently hardcoded and duplicated across multiple page files.
