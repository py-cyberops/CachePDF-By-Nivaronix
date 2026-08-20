# CachePDF Launch-Hardening Baseline

**Recorded from repository state:** `24a886cd7282ffd1797f061c6c4fba5d86e87269` on branch `main`.

| Baseline area | Finding |
| --- | --- |
| TypeScript | `pnpm check` passed. |
| Production build | `pnpm build` passed. |
| Tests | No `test` script or dedicated test suite was present in `package.json`. |
| Routes | Public routes, tool directory, and `/tools/:slug` workbench routes were present. |
| PDF workflows | Browser-local pdf-lib, PDF.js, Tesseract.js, dnd-kit, and fflate workflows were present. |
| Local Session dialog | Portal containment, responsive layout, and light-mode contrast were already present; keyboard focus trapping, Escape handling, and focus restoration were not yet verified. |
| Privacy audit | Client source showed local file processing and no client fetch/XHR/WebSocket/beacon APIs involving documents. Local storage held only theme/density preference. Service-worker registration and app-shell cache behavior required further verification. |
| Performance | The initial build included a 1.6 MB JavaScript chunk (approximately 516 KB gzip) and emitted Vite’s chunk-size warning, indicating that the heavy workbench stack was not yet route-split. |

The hardening pass preserves the existing browser-local architecture, retains the experimental PDF-to-text state, and avoids back-end, account, cloud-storage, or server-processing additions.
