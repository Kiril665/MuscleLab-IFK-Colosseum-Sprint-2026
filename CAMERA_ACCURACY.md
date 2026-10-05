# ForgeMuscle camera accuracy

The camera pipeline now uses MediaPipe image + world landmarks, adaptive One Euro smoothing, view-quality gating, exercise-specific candidate signals, hysteresis and server-authoritative `RepEvent` acknowledgement.

This repository does not contain real recorded fixtures yet, so a measured exercise × view accuracy matrix cannot honestly be claimed. The required synthetic generator/replay matrix remains a validation task after MediaPipe assets are prepared.

Important limitation: monocular 3D pose is approximate. The system pauses counting when confidence or view quality is too low instead of inventing repetitions.

## Audit notes — 2026-10-06

Tracking is now continuity-based rather than selecting the first pose. Camera processing keeps real-time pose state separate from throttled UI state, uses adaptive One Euro smoothing, and applies view hysteresis. Required landmarks are exercise-specific; missing landmarks are treated as a tracking/framing problem rather than a technique failure.
