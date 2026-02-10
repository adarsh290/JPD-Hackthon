# Front‑end UX & Error‑handling Audit

## Current observations
1. **API calls lack UI feedback** – Services (e.g., `createLink`, `register`) are called directly in components without a loading spinner or error toast.
2. **Form validation** – The forms rely on server‑side validation only; users see generic error messages after a failed request.
3. **404 / fallback** – The router redirects unknown routes to the home page without a user‑friendly “Not found” page.
4. **Global error boundary** – No React error boundary is present; a component error crashes the whole UI.

## Suggested improvements
| Area | Recommendation |
|------|----------------|
| Loading state | Introduce a `useLoading` hook that returns `{isLoading, start, stop}` and wrap async calls with it. Show a `<Spinner />` component from `ui` library. |
| Toast notifications | Use the existing `sonner` library to display success/error toasts (`toast.success`, `toast.error`). |
| Form validation | Leverage `react-hook-form` together with the Zod schemas already defined in `src/utils/validation.ts` via `zodResolver`. |
| 404 page | Add a `<NotFound />` component under `src/pages/NotFound.tsx` and configure `react-router` with `<Route path="*" element={<NotFound />} />`. |
| Error boundary | Create a `ErrorBoundary` component (class component with `componentDidCatch`) that wraps the top‑level `<App />`. |

## Quick win implementation plan
1. Add a `src/components/ui/Spinner.tsx` (simple CSS animation).
2. Update a sample page (e.g., `Dashboard.tsx`) to use `toast.error` on catch blocks.
3. Add `NotFound.tsx` and update router.
4. Write a unit test for the new `Button` component (already added).

---
**Next steps:** Add this audit as `docs/UX-AUDIT.md` and create a PR to implement the first two items.
