# Future Backend Integration

## Current State Assessment
The application currently uses `ProductionContext` to store records in the browser's `localStorage`. All calculations (`stats`, `daysRemaining`, `isGood`) are performed synchronously on the client side during render.

## Integration Strategy (When Backend is Added)

### 1. State Management Adjustment
Currently, the UI reads directly from `useProduction`. When a backend is introduced:
- **Loading States:** UI components currently assume data is instantly available. You will need to introduce `isLoading` and `error` states into the `ProductionContext`.
- **Async Actions:** The `addRecord` function in `ProductionContext` will need to become `async`. It should make a `POST` request to the API, wait for the response, and then update the local state.
- **Initial Fetch:** The `useEffect` that currently reads from `localStorage` will be replaced with an async `GET` request to the backend.

### 2. Service Layer
The existing `src/lib/productionService.ts` contains legacy logic that is well-structured for backend use. Once the database (Prisma) is ready to be re-activated:
- The UI should stop calculating `stats` locally and instead rely on the `getDashboardStats` function from the service layer via an API route.
- The UI should stop enriching records locally. The API (e.g., `src/app/api/production/route.ts`) already has logic to append `isGood` and `daysRemaining` before sending data to the client.

### 3. Database Readiness
- The project already has `@prisma/client` installed and a `schema.prisma` file (though unused by the active frontend).
- The data structure used in `ProductionContext` exactly matches the expected schema in Prisma (`brickType`, `quantity`, `productionDate`, `goodDate`). This means the transition will be seamless.

### 4. UI Component Readiness
- **Dashboard:** Will need a skeleton loader while stats are fetched.
- **History List:** Will need a loading spinner and error handling if the fetch fails.
- **Add Form:** The submit button will need a `disabled` or loading state to prevent double submissions during the API call.

## Recommendations for Transition
1. **Do not mix patterns:** When you are ready to implement the backend, completely remove `localStorage` logic from `ProductionContext`. 
2. Use a data-fetching library like React Query (TanStack Query) or SWR inside the context to handle caching, loading, and error states automatically, rather than building it manually with `useEffect`.
