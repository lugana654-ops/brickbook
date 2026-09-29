# Component Map

## Pages

### 1. DashboardPage
- **File path:** `src/app/page.tsx`
- **Purpose:** Main landing page displaying production statistics.
- **Where it is used:** `/` route.
- **Reusable:** No.
- **Dependencies:** `useProduction`, `lucide-react`.
- **State used:** `stats` from `ProductionContext`.
- **Issues:** Contains a duplicated hardcoded bottom navigation bar.

### 2. ProductionPage
- **File path:** `src/app/production/page.tsx`
- **Purpose:** Menu page offering options to "Add Today Production" or view "Production History".
- **Where it is used:** `/production` route.
- **Reusable:** No.
- **Dependencies:** `lucide-react`.
- **State used:** None.
- **Issues:** Contains a duplicated hardcoded bottom navigation bar.

### 3. AddProductionPage
- **File path:** `src/app/production/add/page.tsx`
- **Purpose:** Form to add a new production record.
- **Where it is used:** `/production/add` route.
- **Reusable:** No.
- **Dependencies:** `useProduction`, `DatePickerModal`, `lucide-react`, `useRouter`.
- **State used:** Local state for form inputs (`brickType`, `steps`, `isPickerOpen`, `prodDateStr`), `addRecord` from `ProductionContext`.
- **Issues:** UI logic is heavily mixed with business logic (date calculation, step counting).

### 4. ProductionHistoryPage
- **File path:** `src/app/production/history/page.tsx`
- **Purpose:** Displays a searchable, filterable list of all production records.
- **Where it is used:** `/production/history` route.
- **Reusable:** No.
- **Dependencies:** `useProduction`, `DatePickerModal`, `lucide-react`.
- **State used:** Local state (`searchQuery`, `isPickerOpen`), `enrichedRecords` from `ProductionContext`.

## UI Components

### 1. DatePickerModal
- **File path:** `src/components/DatePickerModal.tsx`
- **Purpose:** A custom calendar modal for selecting dates.
- **Where it is used:** `AddProductionPage`, `ProductionHistoryPage`.
- **Reusable:** Yes.
- **Dependencies:** `lucide-react`.
- **Props:** `isOpen`, `onClose`, `selectedDate`, `onSelectDate`, `maxDate`.
- **State used:** Local state (`currentDate`, `tempDate`, `isInputMode`, `inputText`).

## Missing / Suggested Components
The following components are currently duplicated across pages and should be extracted into reusable components:
- **BottomNavigationBar:** Duplicated in `src/app/page.tsx` and `src/app/production/page.tsx`.
- **HeaderBar:** Similar header structures exist across all pages.
- **MetricCard:** The dashboard cards in `src/app/page.tsx` could be extracted.
