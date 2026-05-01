# Designer Modernization Progress

Date: 2026-04-30

Branch: `designer-editor`

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
- Added a shared designer API helper that validates session tokens, HTTP status, JSON responses, and canvas object payloads.
- Moved certificate/template/badge resource panels onto guarded async loading with unmount protection and session-expired feedback.
- Moved the main designer startup load and save/update flows onto the guarded API helper.
- Stopped mutating server-returned canvas object arrays before validation.
- Isolated custom HTML/CSS/JS element rendering and Ace previews inside sandboxed iframes instead of injecting into the app document.
- Removed raw HTML insertion from tooltips and context menus; React rendering now handles those surfaces directly.
- Added Fabric-safe SVG sanitization for pasted SVGs, SVG files, saved SVG payloads, and component SVG fetches before Fabric parsing.
- Added route smoke checks for all designer routes via `npm run smoke:routes`.
- Centralized editor route/query parsing so the main editor, header toolbar, properties, API helper, and resource panels share the same session interpretation.
- Tightened explicit save validation so Save & Close requires a non-empty design name and persists trimmed names.
- Added a central variable registry for designer variables.
- Added proof validation for object safe-area placement, unknown variable tokens, text overflow risk, QR source presence, and QR minimum scan size.
- Added guarded design JSON import failures instead of crashing on malformed files.
- Removed no-op canvas change listeners and fixed the preview overflow style typo.
- Added `DESIGNER_PRODUCTION_AUDIT_PLAN.md` for the remaining major dependency and server-owned work.
- Replaced deprecated `uuidv4` wrapper imports with `uuid` v4 imports and removed the unused `uuidv4` dependency.
- Removed stale commented console logging in touched editor/resource files.
- Gated audit output from source control via `.gitignore`.
- Re-enabled project lockfile usage in `.npmrc` so `npm install`, `npm ci`, and audit tooling honor `package-lock.json`.
- Added `audit:prod` and `verify` scripts for repeatable production-readiness checks.
- Removed the production `new Function` chart option path; chart options now accept JSON object payloads instead of executable code.
- Tightened external image URL validation to HTTPS, local HTTP, blob URLs, and image data URLs only.
- Added a CSP to sandboxed HTML previews.
- Replaced visible material-icon text in the alignment toolbar with bundled icon glyphs.
- Refined the designer shell with a cleaner top bar, proof action, artboard metadata, grid canvas background, and non-overlapping toolbar layout.
- Added production editor aid controls for grid, snap, and alignment guides, with auxiliary grid objects excluded from layer lists and exported template JSON.
- Made the left asset rail keyboard-accessible, searchable for components, and visually consistent with the premium editor shell.
- Added contextual inspector layer headers and clearer unsupported-selection empty states.
- Added visible ruler overlays and a non-exported Fabric safe-area overlay that can be toggled from the editor aid controls.
- Converted component palette tiles into semantic buttons while preserving click and drag-to-canvas behavior.
- Added accessible inspector color swatches, text style toggles, text alignment buttons, and image filter toggles with keyboard focus states.
- Added accessible names and titles for icon-only add, clear, edit, and delete controls in reusable editor panels.
- Tightened the selected-object toolbar by making Undo and Redo compact icon controls with accessible labels.

## Verified

- `npm run lint`
- `npm run build`
- Babel parsing for edited React/JS files
- Browser smoke for `/certificate-designer` and `/badge-designer` on local dev server with no runtime console errors, aside from expected API 400s for fake smoke design codes
- `npm run smoke:routes`
- `npm audit --omit=dev --audit-level=high`
- Browser smoke for `/certificate-designer` on local dev server with 0 console errors, aside from React Router future warnings.
- Browser smoke for rulers, safe-area overlay, component add flow, and inspector selection state.
- Browser smoke for asset search empty state, layer-list empty state, add-text selection, and compact mobile viewport footer layout.
- Browser smoke for certificate template empty state with optional session handling and no console errors.
- Browser smoke for keyboard-open layer list, layer filtering, and separate select/duplicate/delete controls.
- Browser smoke for admin certificate header actions, disabled Save & Close styling, and compact export/upload controls.
- Browser smoke for selected text toolbar priority, inspector collapse/expand behavior, and advanced alignment/group controls.
- Browser smoke for proof-passed modal state and clean preview/export framing without editor-only aids.
- Browser smoke for mobile asset drawer access to components and collapse behavior.
- Browser smoke for inspector color picker labels, typography toggle labels, keyboard toggle behavior, and clean console output.
- TypeScript lint for accessible panel action labels across animations, styles, data sources, code, URL, and custom property controls.
- Browser smoke for compact selected-object toolbar history controls with clean console output.

The production app entrypoint is now about 298 KiB, down from about 5.56 MiB before this optimization pass. Build still reports large asset warnings for deferred Fabric/AntD/editor chunks and bundled font SVG assets. Those warnings are real remaining performance work, not build failures.

Audit now reports 22 remaining production advisories. The high/critical paths are tied to Fabric 4's old `jsdom/request` chain, AntD 3's old editor dependencies, ECharts 4's zrender chain, and canvas/node-pre-gyp tar. `npm audit fix --omit=dev --package-lock-only --package-lock=true` could not resolve them without forced breaking upgrades, so these are tracked as planned major-upgrade work rather than hidden.

`npm audit fix` also still requires breaking upgrades for the dev toolchain, including Webpack/dev-server, Less, html-webpack-plugin, compression-webpack-plugin, Typedoc, and gh-pages. Those are not safe blind upgrades in this branch.

## Still Open

- Full TypeScript coverage for the Fabric canvas code. The current codebase has many legacy declaration gaps when all canvas sources are included.
- Signed server-issued editor session contract instead of client-only route/query inference.
- Server-side Fabric render worker for deterministic PDF/PNG outputs.
- Bulk generation queue.
- Advanced ruler calibration against zoomed artboard coordinates and automated visual regression coverage.
- Visual regression tests.
