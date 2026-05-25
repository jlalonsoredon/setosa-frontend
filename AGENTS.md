# Setosa Frontend — Agent Instructions

All backend communication must be centralized in:

src/services/api.ts

Never place fetch logic directly inside Astro pages.

Use environment variables:

PUBLIC_API_URL=

Example:

const API_URL = import.meta.env.PUBLIC_API_URL;

---

## UI Guidelines

- Preserve the visual style of the sci‑fi theme.
- Reuse existing components whenever possible.
- Avoid replacing the theme layout.
- Maintain responsive design.
- Prefer subtle animations already present in the template.

---

## Cleanup Policy

Remove unnecessary starter/template content only if:

- it is not imported
- it is not referenced by layouts
- it does not break build output

After cleanup always validate:

npm run build

---

## Vercel Rules

- Keep frontend static when possible.
- Avoid unnecessary SSR.
- Prefer client-side React islands.
- Keep bundle size small.

---

## Documentation

Before modifying architecture:

- review the /docs folder from the template
- preserve conventions already used by the project

---

## Coding Standards

- Prefer readable code over abstraction.
- Avoid overengineering.
- Add comments only where necessary.
- Use async/await.
- Handle loading and error states.

---

## Expected Workflow

1. User clicks "Nuevo suceso"
2. Frontend requests /get_data
3. Form and table are populated
4. User clicks "Obtener severidad"
5. Frontend requests /get_prediction
6. Severity panel is updated

---

## Forbidden Changes

Do not:

- replace Astro with Next.js
- introduce heavy state libraries
- rewrite the theme entirely
- remove animations/styles globally
- hardcode API URLs
