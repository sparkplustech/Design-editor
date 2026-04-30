# Designer Production Audit Plan

Date: 2026-04-30

Branch: `designer-modern`

## Dependency Upgrade Path

Fabric stays on 4.6.0 in this branch. The remaining `npm audit` production advisories are not resolvable with a safe patch-only update because npm requires forced breaking upgrades:

- Fabric 4 pulls old `jsdom/request` chains. The safe remediation is a separate Fabric 7 migration branch with import/export parity tests for existing template JSON.
- AntD 3 pulls old editor dependencies through `rc-editor-mention` and `draft-js`. The safe remediation is an AntD 5/6 migration with a full pass over form, modal, upload, select, and message APIs.
- ECharts 4 pulls vulnerable zrender. The safe remediation is an ECharts 6 migration and chart element compatibility test.
- Canvas/node-pre-gyp pulls vulnerable tar in the install chain. The safe remediation is to validate whether browser-only builds can remove Node canvas from production install, or upgrade the package chain in the Fabric migration branch.
- Webpack 4 remains functional after the 4.47.0 update, but the long-term path is Webpack 5 or Vite after AntD/Fabric compatibility is proven.

## Server-Owned Work

These items need API/backend contracts and cannot be completed only inside this frontend package:

- Signed editor session: issue a short-lived signed editor session object from the API, then have the designer consume that contract instead of inferring state from route/query values.
- Server-side render worker: add an isolated Fabric render worker service that accepts signed template JSON, validates variables, renders deterministic PNG/PDF output, and stores artifacts.
- Bulk generation queue: enqueue credential/badge render jobs server-side, store job state, retry failed renders, and expose progress polling to the frontend.

## Frontend Completion Criteria

The frontend side now has the production checks needed before those server contracts land:

- Central variable registry used by the variable panel and proof validation.
- Proof validation for unknown variable tokens, object safe-area placement, text box overflow risk, QR source presence, and QR minimum scan size.
- Guarded JSON import with user-facing failures for malformed designer files.
- Route smoke checks for public/admin certificate and badge designer routes.
