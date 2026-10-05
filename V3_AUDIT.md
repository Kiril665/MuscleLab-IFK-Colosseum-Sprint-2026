# ForgeMuscle v3 — implementation audit

## Implemented
- Mobile viewport with `viewport-fit=cover`, 44px interactive targets and focus-visible states.
- PWA cache bumped to v4; `/api/` and WebSocket traffic bypass cache.
- Player search: `GET /api/players/search` with online presence.
- Online direct duel challenge: `POST /api/players/challenge` for real connected players.
- WebRTC signaling fixed: SDP is sent as strings, ICE candidates are queued until remote description exists, and signaling errors are surfaced.
- Solana wallet challenge/link/unlink/balance routes retained and hardened for multiple `signMessage` return shapes.
- Phantom/Solflare mobile deep-link/in-app-browser buttons added.
- Photo avatar component with emoji/URL fallback, lazy image loading and sizes sm/md/lg/xl.
- Client-side avatar crop to square and WebP compression before upload.
- Server avatar endpoint with 300 KB post-compression limit, MIME/magic-byte validation, replacement cleanup and static caching.
- Avatar rendering migrated in profile, app header, chat, battle voice and player search.
- `.env.example` expanded with v3 configuration flags.
- Unused `@google/genai` dependency removed from package metadata.
- Legacy boss wording removed from the battle UI.

## Not honestly verified in this environment
- `npm install`, `npm run lint`, `npm test`, `npm run build`, and `npm run dev` could not complete because the uploaded project has no `node_modules` and dependency installation timed out twice.
- Browser-level tests on Chrome Android, Safari iOS, Phantom/Solflare and two-device WebRTC were not available here.
- Real-money/mainnet betting is intentionally not enabled; `ENABLE_REAL_MONEY=false` remains the default.

## Static verification
- All `.ts`/`.tsx` files were transpiled with TypeScript 5.8.3 with **0 syntax diagnostics**.
- Package-lock JSON is valid.

## Audit notes — 2026-10-06

The audit found and fixed TypeScript errors, stale BattleStore engine access, duplicate battle tick serialization, unsafe client-side battle acceptance fields, reconnect replay of battle reps, and the old single-formula rep-counter behavior. Solana wallet identity remains separate from payment verification.
