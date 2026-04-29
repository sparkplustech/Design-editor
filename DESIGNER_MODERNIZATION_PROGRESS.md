# Designer Modernization Progress

Date: 2026-04-30

Branch: `designer-modern`

## Direction

Fabric remains the canvas/editor foundation. The modernization path is to harden the current Fabric implementation, improve output quality around it, and add server/session/bulk workflows around the Fabric template schema instead of replacing Fabric.

## Completed In This Branch

- Created `designer-modern` from `solod` without touching `main`.
- Added deterministic `package-lock.json`.
- Fixed the create-save crash caused by undefined `name`.
- Fixed the user badge detail endpoint double slash.
- Restored the TypeScript lint command from a no-input failure.
- Kept the production build from starting Bundle Analyzer unless `ANALYZE_BUNDLE=true`.
- Restored canvas viewport transform after preview/export generation.
- Removed the workarea/image production `console.log` paths found in the audit.
- Replaced `fetch(dataURL)` preview blob conversion with direct data URL to `Blob` conversion.
- Added one-in-flight save protection so autosave and manual save do not overlap.
- Improved upload validation and large-image optimization for designer use.
- Fit uploaded images into the Fabric workarea rather than dropping oversized assets onto the canvas.
- Added safer URL validation for image URL entry.
- Replaced several console-only template/design/badge loading failures with user-facing AntD messages.
- Fixed the one-item portrait design list visibility issue.
- Fixed the invalid `20x` canvas padding unit.
- Gated audit output from source control via `.gitignore`.

## Verified

- `npm run lint`
- `npm run build`
- Babel parsing for edited React/JS files

Build still reports large bundle warnings for Fabric/AntD/editor chunks. Those warnings are real remaining performance work, not build failures.

## Still Open

- Full TypeScript coverage for the Fabric canvas code. The current codebase has many legacy declaration gaps when all canvas sources are included.
- Dependency security upgrade plan for Fabric 4, AntD 3, Webpack 4, old request/jsdom chains, and related transitive advisories.
- Fabric-safe SVG/HTML sanitization for production.
- Signed editor session contract instead of route/query inference.
- Server-side Fabric render worker for deterministic PDF/PNG outputs.
- Variable registry, proof validation, text overflow checks, QR validation, and bulk generation queue.
- Modern editor shell redesign: searchable left resource browser, contextual inspector, rulers/guides/safe area, save status, proof/export workflow.
- Route smoke tests and visual regression tests.
