# $UP Uptime Board

A single-page instrument panel for `$UP`, a token mined by AI agents. The committed export works from a static host and uses relative asset paths.

## Install & Run

```sh
npm ci
npm run dev
```

Create a production export with `npm run build`. Preview it with `npm run dev -- --host 127.0.0.1` during development or `npm exec vite preview -- --host 127.0.0.1` after building. Publish the complete `dist/` directory to any static host; no rewrite rules or server runtime are required.

## Deployment Configuration

Every address is centralized in `src/config.ts`. `stateView` and `poolManager` are set to the supplied chain 4663 deployments. Replace the clearly marked `token`, `creator`, and `poolId` placeholders after deployment. Confirm `burnAddress`, token decimals, currency ordering, and the token contract's `currentDailyEmission()` ABI before publishing live values. The PoolManager address is retained as deployment metadata; spot state is read from StateView as required.

The browser reads JSON-RPC directly from `https://rpc.mainnet.chain.robinhood.com`. The RPC must allow browser CORS. When configuration or RPC access fails, the page displays an actionable status and retains a manual retry button; it never substitutes invented values.

## `stats.json` Schema

The agent snapshot is committed at `public/stats.json` and copied next to `index.html` during build. It is never requested from `api.imd.fun` in the browser.

```ts
type Stats = {
  period: { start: string; end: string; label: string }
  agents: Array<{
    id: string
    active: boolean // true only when the agent earned in this period
    tasks: number   // non-negative completed task count
    earned: string  // decimal $UP amount as a precision-safe string
  }>
}
```

Regenerate this file server-side, order agents however convenient, and preserve the schema. The UI derives the top 20 by sorting `tasks` descending. Use ISO 8601 dates for `start` and `end`.

## Validation Record

Validated on 2026-09-25 with Node 22.22.1:

- `npm run typecheck` — passed with no TypeScript diagnostics.
- `npm test` — passed: 1 file, 2 tests. The tests load the static snapshot, keyboard-activate an agent cell, verify its live readout and leaderboard row, and verify the recoverable deployment-configuration state plus chain refresh control.
- `npm run build` — passed with Vite 8.3.1; 165 modules transformed. Final output: 0.55 kB HTML, 5.64 kB CSS and 483.22 kB JavaScript (164.86 kB gzip), plus the snapshot.
- Static preview — `vite preview` served `/`, both relative hashed assets, and `/stats.json` with HTTP 200. The export check parsed all 96 agents and found no root-relative asset URLs in `dist/index.html`.

No browser automation binary was available, so there was no screenshot-based desktop/mobile visual pass, browser console inspection, or live RPC/CORS check. Responsive behavior is covered by CSS at 700 px and uses auto-fill grid columns rather than horizontal scrolling. Live chain values remain intentionally unavailable until the deployment placeholders are filled; the shipped UI exposes that limitation plainly.

### Vercel Web Interface Guidelines Review

Rules were retrieved from [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) on 2026-09-25. Reviewed `index.html`, `src/App.tsx`, `src/styles.css`, `src/chain.ts`, and `src/config.ts`.

- `src/App.tsx:57` — added a keyboard-visible skip link and semantic heading structure.
- `src/App.tsx:74` — cells are native buttons with descriptive labels, pressed state, keyboard activation, and a polite shared readout; removed conflicting gridcell roles.
- `src/App.tsx:94` — the refresh action uses a native button, busy copy ending in `…`, disabled in-flight state, and a polite actionable error region.
- `src/App.tsx:109` — leaderboard uses a semantic table with scoped headers and locale-aware, tabular numbers.
- `src/styles.css:26` — all interactive controls have visible `:focus-visible` treatment and explicit hover feedback.
- `src/styles.css:32` — heading anchors have scroll margin; `src/styles.css:75` disables smooth scrolling for reduced-motion preferences.
- `src/styles.css:58` — mobile rules reflow counters, controls, footer, and matrix without a sideways scroll surface.
- `index.html:6` — black theme color matches the page; `src/styles.css:1` declares the dark color scheme.

Remaining limitation: matrix cells are deliberately much smaller than conventional touch targets to preserve the requested dense one-cell-per-agent instrument view. Each remains focusable and labeled; selecting a precise cell on a phone may be harder than with a 44 px control. There are no forms, images, overlays, destructive actions, or long-running animations to review.
