# Designer Modernization Progress

Date: 2026-04-30

Branch: `designer-modern`

## Direction

Fabric remains the canvas/editor foundation. The modernization path is to harden the current Fabric implementation, improve output quality around it, and add server/session/bulk workflows around the Fabric template schema instead of replacing Fabric.

## Completed In This Branch

- Created `designer-modern` from `solod` without touching `main`.
- Added deterministic `package-lock.json`.
- Kept Fabric at `4.6.0` as the active canvas/editor foundation.
- Updated the locked Webpack 4 line to `4.47.0` and lodash to `4.17.21`.
- Removed the unused Workbox production service worker plugin and switched the app to unregister old service workers.
- Removed inactive Google Analytics/Ads script loading and the dormant ad slot from the legacy title bar.
- Removed the unused `react-helmet` runtime dependency and moved static metadata into Webpack HTML generation.
- Removed the forced full AntD/Fabric/Lodash production vendor entry, stopped loading all of `core-js/stable`, and kept lazy editor vendor code out of the initial vendor chunk.
- Removed AntD `LocaleProvider` from the root because it pulled Moment into first load while the designer does not use AntD date/time controls.
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
- Added searchable resource panels for certificate templates, saved designs, badge templates, badge shapes, and variables.
- Replaced clickable thumbnails/labels with keyboard-focusable buttons and visible focus states.
- Lazy-loaded heavy non-default editors so the initial app chunk stays small while preserving all editor routes.
- Added lazy thumbnail loading for resource browsers.
- Tightened the chart script sandbox denylist and reject unsafe chart scripts with a user-facing error.
- Removed stale commented console logging in touched editor/resource files.
- Gated audit output from source control via `.gitignore`.

## Verified

- `npm run lint`
- `npm run build`
- Babel parsing for edited React/JS files
- `npm audit --omit=dev --audit-level=high`

The production app entrypoint is now about 298 KiB, down from about 5.56 MiB before this optimization pass. Build still reports large asset warnings for deferred Fabric/AntD/editor chunks and bundled font SVG assets. Those warnings are real remaining performance work, not build failures.

Audit now completes and reports 23 remaining production advisories. The high/critical paths are tied to Fabric 4's old `jsdom/request` chain and AntD 3's old editor dependencies. `npm audit fix --omit=dev --package-lock-only --package-lock=true` could not resolve them without forced breaking upgrades, so these are tracked as planned major-upgrade work rather than hidden.

## Still Open

- Full TypeScript coverage for the Fabric canvas code. The current codebase has many legacy declaration gaps when all canvas sources are included.
- Dependency security upgrade plan for Fabric 4, AntD 3, Webpack 4, old request/jsdom chains, and related transitive advisories.
- Fabric-safe SVG/HTML sanitization for production.
- Signed editor session contract instead of route/query inference.
- Server-side Fabric render worker for deterministic PDF/PNG outputs.
- Variable registry, proof validation, text overflow checks, QR validation, and bulk generation queue.
- Modern editor shell redesign: contextual inspector, rulers/guides/safe area, save status, proof/export workflow.
- Route smoke tests and visual regression tests.
