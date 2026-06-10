# Frontend Agent Notes - CodeVista

## Read First

Before editing frontend files, read:
- `docs/ui/design-system.md`
- `AGENTS.md`
- the relevant page or component you are changing

## Current Frontend Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth client
- Monaco Editor
- Framer Motion
- React Flow

## Frontend Rules

- Server Components by default.
- Use Client Components only when state, events, or browser APIs require them.
- Keep layout and visual language consistent with the design system doc.
- Use the existing CSS tokens from `frontend/app/globals.css`.
- Prefer absolute imports through `@/`.
- Do not introduce a second visual language for the same screen type.

## Common Page Families

- Landing pages
- Auth pages
- Editor workspace
- Session history and insights
- Settings and account flows

## Editing Notes

- Respect the current landing header and footer patterns.
- Keep auth pages focused and compact.
- Keep editor surfaces readable and technically dense, not decorative.
- Preserve mobile behavior while making desktop layouts feel intentional.
- For redesign previews, work in `frontend/app/temp-redesign/` and compare every capture against the matching reference image in `frontend/temp-redesign/ref/`.
- `frontend/temp-redesign/ref/about.png` is the about-page reference image.
- Keep iterating on preview screens until the browser screenshot matches the reference image exactly for that page at the target viewport.
- Do not consider a redesign complete until the browser screenshot is an exact match for the reference image.
- Save preview screenshots in `frontend/temp-redesign/images/` with zero-padded names like `0001-home.png` and `0002-home.png`.
- `frontend/temp-redesign/about-preview.tsx` and `frontend/app/temp-redesign/about-preview/` are the about-page preview assets.
- Temporary screenshots in the redesign workspace may be replaced or deleted during iteration without extra approval.
- On small screens, favor a text-first hero, full-width primary actions, shorter top padding, and footer groups that collapse or stack instead of forcing desktop columns into a phone viewport.

## Verification

When frontend files change, verify against:
- `docs/ui/design-system.md`
- `02-frontend-verify`
- `09-responsive-testing`
- `agent-browser` for browser-driven UI checks when the change affects rendered screens or temp-redesign previews
- Manual browser review is allowed alongside Agent Browser when it helps catch visual issues or confirms the final result
- `frontend/temp-redesign/README.md` for the reference-image comparison workflow and screenshot naming rules
