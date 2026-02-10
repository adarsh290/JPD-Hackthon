# Documentation Review Checklist

## OpenAPI / API Docs
- Verify that an OpenAPI (Swagger) spec exists in the repository (e.g., `openapi.yaml`).
- If missing, add a generated spec using **tsoa** or **swagger-jsdoc** based on the Express routes (`authRoutes`, `hubRoutes`, etc.).
- Ensure the spec includes request/response schemas for all endpoints (auth, link, resolver, analytics).

## README Improvements
- Add a **Quick‑Start** section that lists required environment variables (refer to `backend/.env.example`).
- Provide example `curl` commands for the main public endpoints (`/api/auth/register`, `/api/resolve/:slug`).
- Show how to run the backend tests (`npm test` in `backend`).
- Link to the generated OpenAPI UI (e.g., `/api-docs` route).

## Inline Code Documentation
- Add JSDoc comments to exported service classes (`AuthService`, `LinkService`, `ResolverService`).
- Document error codes (`AppError` usages) and expected HTTP status responses.

## Types & Validation
- Ensure all request DTOs (`RegisterData`, `LoginData`, etc.) are exported from a `types/` folder and referenced in the OpenAPI spec.
- Verify Zod schemas in `src/utils/validation.ts` have matching TypeScript types.

## Contribution Guide
- Add a `CONTRIBUTING.md` outlining how to run tests, lint, and submit PRs.
- Specify the code‑style (Prettier, ESLint) and include the `npm run lint` command.

---
**Next steps:** PR the above checklist as `docs/REVIEW-DOCS.md` and reference it in the project README.
