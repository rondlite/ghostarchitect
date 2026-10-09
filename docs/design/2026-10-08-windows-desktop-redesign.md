# Ghost Architect — UI Beautification: "Windows Desktop" Redesign

**Date:** 2026-10-08
**Status:** Under discussion — design direction, not an owner decision until Ron approves
**Repo:** /opt/data/ghostarchitect (Next.js 15, App Router, Tailwind, TypeScript)

## Context (from code inspection)

Ghost Architect is a security-training simulation game. Single React page (`src/app/page.tsx`, 1049 lines) driven by a `GameStep` union: `start → login → mfa → onboarding-portal → breach-* → investigation-* → debrief`. No router. Theming via `data-theme` attribute (`corporate` | `breach`) and CSS variables in `src/app/globals.css` (538 lines). GSAP drives the Corporate→Breach transition overlay; Framer Motion for component animation.

The UI already gestures at a desktop metaphor (window chrome vars, taskbar vars, an `EmailClient`, `LogTerminal`, `TaskManagerView`) but reads as a generic dark SaaS dashboard rather than a believable OS. Ron's direction: **make it much more like a real Windows desktop.**

## Design goals

1. **Believable desktop OS shell** — draggable windows with real title bars (icon + title + minimize/maximize/close), a taskbar with Start button, open-window buttons, clock/tray, and a desktop area with icons.
2. **Dual-mode themes preserved** — `corporate` (professional, light windows) and `breach` (corrupted, green-on-black) must survive; the OS chrome itself changes character between modes (breach = glitched, hostile OS).
3. **Modern execution, not retro pastiche** — think Windows 11 (rounded corners, soft shadows, acrylic blur, centered taskbar, fluent-style controls) rather than Win98 chunky bevels. Precision dark-mode aesthetics à la Linear/Vercel for the breach layer.
4. **No functional regressions** — GameStep flow, stores, scoring, content, tests untouched. Design-layer only: CSS vars, layout shells, window components, animations.
5. **Accessibility** — prefers-reduced-motion respected, keyboard focus states, contrast maintained in both themes.

## Scope (what may change)

- `src/app/globals.css` — theme tokens, window/taskbar chrome, fonts
- Window/taskbar/desktop shell components (new or refactored under `src/components/os/`)
- Phase components' outer wrappers (`src/phases/**`) to sit inside the OS shell — internals and logic untouched
- `TransitionOverlay` corporate→breach transition (GSAP timeline) restyled
- Footer/start screen branding strings (currently "DEMANDCLUSTER" leftovers: `StartScreen.tsx:498`, `about/page.tsx:104-137`, `IncidentReport.tsx:197-203`)

## Out of scope

- Game logic, stores, scoring engine, content arrays, API routes, Prisma, auth
- `output: standalone`, no-Edge-runtime, invite-code charset, fake-PII rules (hard constraints)
- Real routing (stays single-page GameStep state machine)

## Design language (proposed)

- **Corporate mode:** light desktop wallpaper (subtle mesh gradient), white windows with rounded-lg corners, Windows 11-style centered taskbar, blue accent (current `#3b6ef8`), Inter/Segoe-like UI font, mica/acrylic material on window backgrounds.
- **Breach mode:** near-black desktop (`#050709`), green-on-black terminal windows with scanline/CRT hints, glitched taskbar, monospace-heavy typography (JetBrains Mono), red alert accents for compromise states.
- **Shared:** window control glyphs (minimize/maximize/close), drag-to-move windows (pointer events), z-index focus stacking, taskbar buttons reflect open windows, Start menu as phase navigator (dev/debug + trainer overview).
- Reference systems: **Windows 11 Fluent** (chrome, materials) + **Linear** (dark precision, breach mode) via the `popular-web-designs` skill catalog (`linear.app.md` for breach tokens; `vercel.md` typography discipline).

## Execution plan (staged, each stage shippable)

| # | Stage | Contents | Gate |
|---|-------|----------|------|
| 1 | Design spec + mock | Single-file HTML mock (standalone, no repo deps) of the desktop shell: wallpaper, 2 windows (email client + task manager), taskbar, both themes toggle. For Ron's approval before code. | Ron approves mock |
| 1b | Optional: @designer variants | 2–3 alternative directions on the same mock (e.g. Win11-clean vs. retro-terminal vs. hybrid) | Ron picks |
| 2 | Tokens & shell | CSS var overhaul in `globals.css` (theme blocks, window/taskbar tokens); build `src/components/os/` (Window, Taskbar, Desktop, StartMenu) as presentational components with no game logic | `npm run build` + type-check pass |
| 3 | Phase migration | Wrap each phase's screen in the OS shell; restyle TransitionOverlay; keep store wiring identical | build + `npm run test` green |
| 4 | Polish | Animations (window open/close/minimize), reduced-motion variants, focus rings, mobile/tablet fallback (windows → full-screen sheets below 768px) | full gates + Ron sign-off |

## Constraints & pitfalls (for implementers)

- **System Node (26.5.1) fails the engines check** — use Node 22 at `~/.local/node22/bin` if npm is invoked. Prefer `npx` from repo root.
- **No Edge runtime** anywhere; don't add `export const runtime = 'edge'`.
- **Prisma-less builds must pass** (`next build` without `DATABASE_URL`).
- GSAP for the transition timeline only; Framer Motion elsewhere (existing convention).
- Don't touch `src/engine/`, `src/stores/`, `src/services/`, `src/content/`, API routes.
- Fake-PII and "SIMULATION — NO REAL DATA" watermark rules still apply.
- Leftover "Demandcluster" branding strings (footer, about page) — replace with "Ghost Architect" branding as part of stage 3/4 (already de-B.V.'d in Terms; the remaining ones are decorative).

## Ownership (fleet routing)

- **@designer** — visual design authority: the stage-1 mock + optional variant set (delivered as HTML files in `docs/design/`).
- **@muse** — implementation: stages 2–4 in the repo (Codex CLI, gpt-6-astra), once Ron approves the mock.
- **@pmo** — kanban routing: create board/cards, gate stage 2 on stage 1 approval, assign muse/designer.
- **default (this session)** — brief authoring, verification of each stage on disk before reporting.
