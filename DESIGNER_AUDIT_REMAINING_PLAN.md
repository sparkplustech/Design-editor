# Designer Audit Remaining Plan

Date: 2026-04-30

Branch: `designer-modern`

## Constraints

- Fabric remains the active canvas implementation.
- This repository is the frontend designer only. Server-issued sessions, render workers, and bulk generation queues need backend/API changes outside this project.
- Current AntD/Webpack/Fabric dependency advisories cannot be fully removed with non-breaking `npm audit fix`.

## Dependency Security Plan

1. Fabric line
   - Current: Fabric 4.6.0.
   - Blocking advisories: Fabric SVG export and old `jsdom/request` transitive chain.
   - Required path: build a Fabric 7 compatibility branch with explicit QA for template import/export, SVG import, image upload, grouping, crop, preview, and server output parity.
   - Current mitigation in this branch: sanitize all user/component SVG before Fabric parsing and isolate HTML/script previews in sandboxed iframes.

2. AntD line
   - Current: AntD 3.15.0.
   - Blocking advisories: old draft-js/rc-editor-mention/fbjs/immutable chain.
   - Required path: migrate to AntD 5 or newer component APIs, replacing legacy Form decorators and modal/table usage incrementally.

3. Webpack line
   - Current: Webpack 4.47.0.
   - Required path: migrate to Webpack 5 or Vite after AntD/Form migration to avoid bundler/plugin churn during UI migration.

4. ECharts line
   - Current: ECharts 4.7.0.
   - Blocking advisory: zrender prototype pollution chain.
   - Required path: upgrade to ECharts 6 and verify chart object serialization and sandboxed chart option execution.

5. Canvas/node-pre-gyp/tar chain
   - Source: old server-side canvas dependency under Fabric tooling.
   - Required path: resolve during Fabric major upgrade or remove unused Node canvas paths if the app never renders Fabric on Node.

## Backend-Owned Work

- Signed editor session contract: replace `designCode` query inference with a server-issued short-lived editor session payload containing design type, edit mode, permissions, redirect targets, and allowed template/design IDs.
- Server-side Fabric render worker: render PDF/PNG proofs from the same template schema in a controlled worker so exports are deterministic and independent from browser state.
- Bulk generation queue: add backend queueing, retry, storage, and progress APIs; keep the frontend designer as the template authoring surface.

## Frontend-Owned Next Steps

- Add automated visual regression once the project accepts a browser test dependency or CI-provided browser runner.
- Continue shell modernization around the existing Fabric editor: contextual inspector, rulers, guide toggles, proof panel, and denser save/export status.
