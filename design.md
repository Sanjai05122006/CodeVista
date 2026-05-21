# Design.md
## Shared Product UI System

**Primary source:** `vercel.md` in this repo  
**Component source:** `packages/ui/src/components/*`  
**Design direction:** exact Vercel-style discipline adapted to this shared UI library

---

## 1. Source Of Truth

This file should follow `vercel.md` first.

That means this design system is not a generic “modern SaaS UI” guide.
It should directly inherit the local reference file’s:

- typography posture
- radius system
- spacing rhythm
- color hierarchy
- surface treatment
- button behavior
- layout discipline

If this file conflicts with `vercel.md`, prefer `vercel.md`.

This file exists to convert that design language into a reusable shared-system guide for this repo and future projects built from `packages/ui`.

---

## 2. Core Visual Direction

The system should feel:

- stark
- quiet
- engineering-led
- highly intentional
- minimal
- text-first
- border-led

It should not feel:

- AI-generated
- glossy dashboard-heavy
- purple-gradient SaaS clone
- over-carded
- over-animated
- over-explained

The only decorative system allowed at brand scale is the atmospheric mesh gradient style described in `vercel.md`.

---

## 3. Typography

Follow the exact type direction from `vercel.md`.

### 3.1 Font stack

This repo has a locked product typography choice already present in the frontend.

Use:

- `Space Grotesk` for display
- `IBM Plex Sans` for body, buttons, labels, and operational UI text

Fallbacks:

- `system-ui`
- `sans-serif`

Mono fallback:

- `IBM Plex Mono`
- `JetBrains Mono`
- `monospace`

Do not replace these fonts with Geist or another substitute unless the design system is explicitly rewritten again.

### 3.2 Typography rules

- Headlines use sentence case.
- Headlines may end with a period when the page tone supports it.
- Display weights stop at `600`.
- Do not use `700+` for normal product headings.
- Display tracking is negative.
- Mono is reserved for technical labels only.
- Do not use uppercase except where mono-caption treatment is intentional.
- The current frontend font imports are locked and should not be changed during normal UI redesign work.

### 3.3 Default type tokens

Adopt the same scale as documented in `vercel.md`:

- `display-xl`: `48px / 600 / -2.4px`
- `display-lg`: `32px / 600 / -1.28px`
- `display-md`: `24px / 600 / -0.96px`
- `display-sm`: `20px / 600 / -0.6px`
- `body-lg`: `18px / 400`
- `body-md`: `16px / 400`
- `body-sm`: `14px / 400`
- `caption`: `12px / 400`
- `caption-mono`: `12px / 400`
- `code`: `13px / 400`

### 3.4 Product usage

Use:

- page titles: `display-lg` or `display-md` in `Space Grotesk`
- section headings: `display-md` or `display-sm` in `Space Grotesk`
- card titles: `body-md-strong` or `display-sm`
- normal CRM body copy: `body-sm` or `body-md` in `IBM Plex Sans`
- IDs, timestamps, machine-like context: `code` or `caption-mono`

---

## 4. Color System

Use the exact structure in `vercel.md`.

### 4.1 Base surfaces

- `canvas`: `#ffffff`
- `canvas-soft`: `#fafafa`
- `canvas-soft-2`: `#f5f5f5`
- `hairline`: `#ebebeb`
- `hairline-strong`: `#a1a1a1`

### 4.2 Text

- `ink`: `#171717`
- `body`: `#4d4d4d`
- `mute`: `#888888`
- `on-primary`: `#ffffff`

### 4.3 Primary color

- `primary`: `#171717`

This is the main CTA color.

Do not replace it with blue, purple, or another accent by default.

### 4.4 Accent palette

Allowed accent tokens from `vercel.md`:

- cyan
- highlight pink
- violet
- link blue
- warning
- error
- success/link

But product surfaces should still remain mostly neutral.

### 4.5 Gradient rule

The multi-stop mesh gradient is the only large-scale decorative system.

Use it:

- at hero scale
- as a background atmosphere
- as a wide band treatment

Do not use it:

- inside tiny badges
- as button backgrounds
- as small icon fills
- as card-level noise

For the CRM product shell, gradients should be softened into:

- white
- near-white
- faint blue-white transitions

so that the product remains usable and calm.

---

## 5. Spacing And Layout

### 5.1 Base unit

Use the exact 4px rhythm from `vercel.md`.

Default spacing scale:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `40`
- `48`
- `64`

### 5.2 Layout philosophy

Use:

- large whitespace between sections
- tighter whitespace inside sections
- compact action rows
- calm, centered content framing where needed

Do not use:

- random extra padding
- card-inside-card-inside-card layouts
- inconsistent section margins

### 5.3 Containers

Use restrained content width for:

- marketing page content
- hero copy
- settings screens
- reports

Use wider operational width for:

- customer lists
- queues
- lead boards
- management tables

### 5.4 Shell rules

Public site:

- top nav
- simple hero
- footer

Authenticated app:

- left sidebar
- page header inside content region
- operational content surfaces

---

## 6. Radius And Shape

Follow the radius logic from `vercel.md`.

### 6.1 Radius scale

- `rounded-sm`: `6px`
- `rounded-md`: `8px`
- `rounded-lg`: `12px`
- `rounded-xl`: `16px`
- `rounded-pill-sm`: `64px`
- `rounded-pill`: `100px`

### 6.2 Usage rules

Use:

- `6px` for compact in-app buttons and inputs
- `8px` for standard cards and tables
- `12px` for larger product panels
- `100px` only for marketing-scale pill CTAs

Do not mix:

- tiny-radius utility controls
- large marketing pill geometry

on the same interface without intent.

---

## 7. Elevation

Follow `vercel.md`:

- stacked subtle shadows
- inset hairline borders
- almost no heavy floating effect

### 7.1 Default product elevation

For most CRM surfaces:

- `1px` hairline border
- very soft shadow
- white or near-white fill

### 7.2 What to avoid

- large blur shadows
- glowing cards
- glass surfaces
- deep neumorphism

---

## 8. Shared UI Component Mapping

Use the shared UI package as the implementation layer.

### 8.1 Available shared components

From `packages/ui/src/components`:

- `alert`
- `avatar`
- `badge`
- `button`
- `card`
- `checkbox`
- `dialog`
- `dropdown-menu`
- `input`
- `label`
- `scroll-area`
- `select`
- `separator`
- `skeleton`
- `spinner`
- `switch`
- `table`
- `tabs`
- `toast`
- `tooltip`

Helper:

- `cn.ts`

### 8.2 Mapping to the Vercel-style system

- `button` → primary CTA, secondary CTA, ghost button, nav action
- `badge` → status pill, lead category, queue state, consent state
- `card` → CRM panels, summary cards, inspector blocks
- `table` → record lists, lead boards, customer grids
- `dialog` → approvals, edits, escalations, filters
- `input` / `label` / `select` / `checkbox` / `switch` → forms
- `tabs` → dense entity navigation within detail views
- `toast` → inline system feedback
- `tooltip` → technical explanation and audit hints
- `skeleton` / `spinner` → loading states
- `alert` → warnings, errors, compliance notices

### 8.3 Implementation rule

Do not create page-local primitive controls if a shared component already exists.

If a shared component is missing a required visual variant:

1. extend the shared component
2. document the variant
3. reuse it

Do not hand-roll another visual language inside a page.

---

## 9. Component Styling Rules

### 9.1 Buttons

Primary button:

- background `#171717`
- text white
- compact in-app radius
- larger pill only for marketing-scale CTA

Secondary button:

- white background
- dark text
- hairline border

Ghost button:

- transparent or near-white
- hairline border only when needed

### 9.2 Cards

Cards should be:

- flat-to-soft
- border-led
- lightly elevated
- structured by padding and typography

Avoid decorative cards with oversized gradients.

### 9.3 Tables

Tables should look technical and clean:

- mono or narrow meta labels in headers when helpful
- thin row dividers
- low-noise hover
- no excessive background striping

### 9.4 Badges

Badges should be:

- compact
- readable
- stateful
- not oversized

### 9.5 Forms

Inputs should follow:

- white fill
- hairline border
- compact height
- quiet focus ring

---

## 10. CRM-Specific UI Rules

### 10.1 Page headers

Keep page headers simple:

- title
- optional compact action
- optional compact subtitle only if it adds operational value

Do not render duplicate titles in both shell and content.

### 10.2 Queue pages

Queue screens should prioritize:

- state
- due time
- customer
- next action
- reason

### 10.3 Customer pages

Customer detail should show:

- core identity
- KYC/account state
- important context
- eligibility or workflow state

### 10.4 Lead pages

Lead pages should show:

- generated reason
- current state
- assigned owner
- action readiness
- caution/suppression signals

### 10.5 Empty states

Keep them short and operational.

Do not use filler product-marketing copy.

---

## 11. Responsive Rules

### 11.1 Breakpoints

Minimum review widths:

- `360px`
- `390px`
- `768px`
- `1024px`
- `1280px`

### 11.2 Mobile behavior

- tables collapse to cards
- paddings tighten
- actions stay tap-safe
- sidebar may stack or drawer depending on shell mode

### 11.3 Tablet behavior

- preserve structure
- reduce horizontal noise
- allow 2-column grids where useful

### 11.4 Desktop behavior

- maintain density
- keep operational surfaces wide enough for scanning

---

## 12. Motion

Motion should be minimal.

Allowed:

- hover fade
- dialog fade/scale
- subtle toast motion
- small loading transitions

Avoid:

- animated gradients
- exaggerated spring effects
- decorative floating motion

---

## 13. Accessibility

Must include:

- visible focus states
- keyboard-safe dialogs and menus
- clear button labels
- contrast-safe text
- semantic structure for forms and tables

State should never rely only on color.

---

## 14. Design Review Checklist

Before shipping a UI surface, check:

- Does it follow the type scale and negative-tracking headline discipline?
- Does it stay mostly neutral with restrained accent use?
- Does it reuse shared components?
- Does it avoid AI-generated-looking dashboard clutter?
- Does it preserve border-led structure instead of heavy shadow stacks?
- Does it keep gradients at structural scale instead of component noise?
- Does it remain readable on mobile?

If the answer is no, it is not aligned with `vercel.md`.

---

## 15. Final Rule

This repo’s UI system should be:

- based on `vercel.md`
- implemented through `packages/ui`
- quiet
- reusable
- product-grade

If a future screen looks like a random AI dashboard, it is wrong.
If it feels like a disciplined interface built from shared primitives with strong type, neutral surfaces, subtle borders, and controlled depth, it is right.
