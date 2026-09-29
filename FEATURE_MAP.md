# Feature Map

## 1. Dashboard
- **Main page:** `src/app/page.tsx`
- **Related components:** None (cards are inline).
- **Related hooks/state:** `useProduction` (`stats`).
- **Related utilities/services:** None.
- **Important files:** `src/context/ProductionContext.tsx` (where stats are computed).

## 2. Production Menu
- **Main page:** `src/app/production/page.tsx`
- **Related components:** None.
- **Related hooks/state:** None.
- **Related utilities/services:** None.
- **Important files:** `src/app/production/page.tsx` (acts as a sub-menu).

## 3. Add Production
- **Main page:** `src/app/production/add/page.tsx`
- **Related components:** `DatePickerModal.tsx`.
- **Related hooks/state:** `useProduction` (`addRecord`), Local State (`brickType`, `steps`, `prodDateStr`).
- **Related utilities/services:** None.
- **Important files:** `src/components/DatePickerModal.tsx`, `src/context/ProductionContext.tsx`.

## 4. Production History
- **Main page:** `src/app/production/history/page.tsx`
- **Related components:** `DatePickerModal.tsx`.
- **Related hooks/state:** `useProduction` (`enrichedRecords`), Local State (`searchQuery`).
- **Related utilities/services:** None.
- **Important files:** `src/context/ProductionContext.tsx` (where enrichment happens).
