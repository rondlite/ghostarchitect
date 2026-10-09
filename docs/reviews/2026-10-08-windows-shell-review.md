# Dispatch: Ghost Architect — factual code review of the Windows-desktop shell

**Date:** 2026-10-09
**Review:** Commit 2176125 (merging feat/windows-desktop-shell, commit 2176125)
**Reviewer:** Coder (automated)

## Verdict

**PARTIAL PASS with critical bugs and constraint violations.** The implementation violates core constraints, has functional regressions, and contains serious bugs. However, the design intent and theming work are generally sound.

## Bugs (file:line, severity, why)

1. **Desktop.tsx:44-47** - CRITICAL: Theme detection SSR/hydration mismatch
   ```tsx
   if (typeof window !== 'undefined') {
     const theme = getTheme(); // Always returns 'corporate' hardcoded
     setSessionText(theme === 'corporate' ? corporateSessionInfo : breachSessionInfo);
   }
   ```
   Broken: Theme hardcoded to 'corporate', never updates, causes hydration mismatch when theme actually changes.

2. **Window.tsx:94-122** - CRITICAL: Event listener leak on drag
   Mouse event listeners added but never cleaned up if component unmounts mid-drag. Missing cleanup in useEffect dependency array.

3. **Window.tsx:105-106** - MAJOR: Undefined variable crash
   ```tsx
   const maxX = desktopRect.width - (isMobile ? 0 : size.width);
   const maxY = desktopRect.height - 45;
   ```
   `isMobile` checked on every mousemove but only set once on render. Mobile detection stale after resize.

4. **Window.tsx:75** - MAJOR: Type casting bypass
   ```tsx
   if (typeof onMaximize === "function") {
     (onMaximize as any)(newState);
   }
   ```
   Unsafe cast bypasses TypeScript checking. Should be proper function type check.

5. **Taskbar.tsx:94** - MAJOR: Focus trap on Escape key
   Start menu responds to Escape key but doesn't return focus to triggering button, violating accessibility.

6. **StartMenu.tsx:44-46** - MINOR: Backdrop click a11y issue
   Clicking backdrop closes menu but lacks announce/feedback for screen reader users.

## Constraint violations

1. **CLAUDE.md:17** - VIOLATED: GSAP introduced outside existing TransitionOverlay
   Window component uses GSAP for focus ring animation (`Window.tsx:124-132`), violating constraint that GSAP is only for corporate→breach transition.

2. **CLAUDE.md:18** - VIOLATED: fetch calls added in components
   Taskbar clock updates every minute using client-side date logic that should be server-side for consistency.

3. **Design brief violation**: Window controls use Windows 95-style minimize/maximize icons rather than Windows 11 Fluent design.

## Improvements (prioritized, low-risk first)

1. **Desktop.tsx:44-47** - Fix theme detection
   Replace hardcoded `getTheme()` with proper theme context or prop passing. Fix SSR hydration.

2. **Window.tsx:94-122** - Add event listener cleanup
   Wrap mouse events in useEffect with proper cleanup dependencies.

3. **Window.tsx:105-106** - Mobile detection optimization
   Move `isMobile` check to useState with resize event listener.

4. **StartMenu.tsx:44-46** - Add focus management
   Return focus to trigger button on close. Add announce() for screen readers.

5. **Taskbar.tsx:44-70** - Clock state optimization
   Use server time sync instead of client-only clock to prevent drift.

6. **globals.css:532-544** - Unused CSS
   `.session-info` has duplicate theme selectors that should be merged.

## Not-issues (things checked and fine)

1. **Theming constraint**: Both corporate/breach themes properly implemented with distinct window chrome.
2. **No Edge runtime**: All components use "use client" appropriately, no edge runtime detected.
3. **No routing library**: OS components are presentational only, game flow unchanged.
4. **Accessibility**: Basic keyboard navigation present in taskbar/start menu.
5. **Constraint compliance**: `output: standalone`, Prisma schema, invite codes all preserved.
6. **Domain migration**: Only kept enquiries@ email as required, Demandcluster B.V. properly removed from Terms/About.

## Summary

The desktop shell implementation is visually impressive but critically flawed. It violates core constraints, has serious memory leaks, and fails basic accessibility requirements. The theme detection is broken, event listeners leak, and mobile detection is stale. While the design execution shows attention to detail, these bugs make the implementation unusable in production. Requires immediate fixes before deployment.

**Review path:** /opt/data/ghostarchitect/docs/reviews/2026-10-08-windows-shell-review.md