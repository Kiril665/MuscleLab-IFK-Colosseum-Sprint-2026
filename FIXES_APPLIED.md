# ForgeMuscle — audit and fixes

## Authentication
- Removed all application Google OAuth / Google Sign-In UI, routes, callbacks and authentication dependencies.
- Email/password registration and login use server-side `scrypt` hashing with per-user salts.
- Password hashes/salts are never returned to the client.
- Sessions use an HttpOnly `forgemuscle_session` cookie.
- Guest sessions create a separate `is_guest=1` database user, receive the same core authenticated API shape, and are deleted on logout.
- Guest creation is rate-limited.
- Legacy `auth_identities` is removed during database migration because authentication is now represented directly by `users.password_hash/password_salt`.
- Password recovery has a real reset-token flow in the UI; reset tokens expire, are single-use, and terminate existing sessions.
- Password change requires the current password and an 8-character minimum.
- Login failures are rate-limited.

## White-screen / startup stability
- Development Service Worker registration is disabled.
- Existing ForgeMuscle development Service Worker registrations/caches are automatically removed before the app boots.
- Production Service Worker was bumped to v5 and uses network-first navigation to prevent stale `index.html` deployments from producing blank screens.
- App import failures are caught and rendered as a visible boot error instead of leaving a white page.
- React render failures are caught by an Error Boundary with console diagnostics.

## Camera
- Camera startup waits for real video metadata before playback/analysis.
- `video.play()` has a safe second attempt after the browser attaches the stream.
- Permission, missing-device, busy-device and insecure-context errors receive explicit messages.
- Camera tracks are stopped on unmount, inactive state and page visibility changes.
- Selected-camera and facing-mode switching use a safe fallback.
- Pose filter/framing state is reset on camera restart.
- Device enumeration is refreshed after a successful connection.
- Async camera initialization is lifecycle-safe so an obsolete stream cannot overwrite a newer stream.

## Verification
- Node 22.16.0 is available in this environment.
- Server `.ts` syntax checks pass with Node's built-in TypeScript stripping.
- Relative import audit found no obvious missing local imports.
- Google-auth code/dependency search is clean (remaining Google references are font/CDN/MediaPipe infrastructure, not authentication).
- Full npm install/build/browser test could not be completed here because registry installation timed out and no local `node_modules` cache was available.

### Guest mode UI
- The authentication screen now presents «Увійти як гість» as a primary, explicit entry option instead of any Google sign-in flow.
- The button calls the real `/api/auth/guest` endpoint and creates a server-side guest session.

## Post-audit hotfix (2026-10-06)
- Fixed a fatal React render error in `src/components/battle/CameraEngine.tsx`: the JSX referenced `handleToggleFacingMode` without declaring it.
- Added the missing front/rear camera toggle handler and clear `selectedCameraId` when switching facing mode so `deviceId` does not override the requested camera direction.
- Hardened camera cleanup by clearing track `onended` handlers and pausing/detaching the `<video>` element before releasing the MediaStream.
- Verified all direct `handle*` event handlers used by TSX files have local declarations (no missing local direct handlers found).
- Parsed all 57 TypeScript/TSX source files plus `server.ts` with the TypeScript parser: 0 syntax parse errors.

## 2026-10-06 audit pass

- MediaPipe now tracks up to 4 poses using continuity (previous center + body size + visibility) instead of selecting the first/highest-visibility pose. Short tracking gaps no longer silently switch people.
- View estimation now exposes UNKNOWN and uses temporal hysteresis before changing FRONT/BACK/SIDE/OBLIQUE.
- Rep counting is confidence-gated, uses a phase state machine, minimum ROM, tempo limits, and rejects technique/tracking failures.
- Camera UI updates are throttled instead of writing React state on every video frame.
- Competitive `manualAddRep()` no longer injects a fake camera repetition. Disconnected battle reps are not queued for replay by the WebSocket client.
- Battle server validates participant, nonce, sequence, finite ROM/accuracy, tempo, range and duplicate events. Client accuracy/ROM are not trusted as authoritative values.
- Added separate Solana payment/order/entitlement layer. Wallet linking remains identity-only. Orders are server-priced, receive unique references, and are marked PAID only after server-side RPC verification.
- Added SOL/USDC configuration, payment URLs with Solana Pay references, duplicate transaction protection and entitlement records.
- Added checkout UI that consumes server-generated order data.
- TypeScript check passes and the test suite passes 12/12 in the audit environment.
- Build remains environment-blocked when the supplied archive's `node_modules` is incomplete and the local MediaPipe task model is absent; production dependencies/model assets must be installed/provisioned before Vite build.
