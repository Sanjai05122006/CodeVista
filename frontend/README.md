# Frontend

CodeVista frontend is a Next.js App Router app that owns the public site, auth flows, editor workspace, history, settings, and preview-only redesign screens.

## Current Surfaces

- Public pages: `/`, `/about`, `/contact`
- Auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`
- App pages: `/editor`, `/editor/insights`, `/history`, `/settings`
- Preview-only routes: `/temp-redesign/home-preview`, `/temp-redesign/about-preview`, `/temp-redesign/login-preview`, `/temp-redesign/register-preview`

## Shared Patterns

- `PublicPageFrame` provides the reusable public shell.
- `LandingHeader` and `LandingFooter` are shared across public pages.
- `frontend/temp-redesign/` holds reference images and screenshot artifacts for preview iteration.
- Browser-driven UI validation uses `agent-browser`.

## Local Checks

```bash
npm run lint
npm run build
```
