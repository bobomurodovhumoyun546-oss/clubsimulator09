# ClubSim expansion: audit and implementation plan

## Existing architecture
React 19/Vite UI with UZ/RU/EN localization. Three.js renders the player match; Phaser remains available for other modes. `src/match/engine.js` owns 11v11 state and `rules.js` owns restarts, offside, discipline and clock. `tactics.js` already weights attributes by OVR. The renderer uses a baked skinned procedural rig; its seeded faces are not scanned likenesses. Player portraits are audited local WebP files. Express serves authenticated routes and Vercel uses the same Turso/libSQL account store as local development. Legacy club state is a revision-guarded JSON snapshot; its existing economy is client-controlled, so new financial operations must not pretend that snapshot balances are authoritative.

## File-level phases
1. Match presentation: extend `engine.js`, `tactics.js`, `three/footballer.js`, `scene3d.js`, `PlayerMatch.jsx`; add testable presentation helpers and localized scorer lower third. Freeze football during a short celebration, preserve scoring and restart, smoothly frame the scorer and restore camera. Aim rushing GK toward ball/intercept in both pitch directions. Recalibrate maximum-OVR reachable-shot save chance to 70%, rushing to 85%; preserve 80% near-post floor. These are conditional chances after reach/interception, not guaranteed whole-match percentages.
2. Face resources: replace random identity claims with portrait-derived face textures where real images exist; retain explicit procedural fallback for absent images. Need licensed, identity-specific rigged heads or multi-view scans for verified 80% resemblance. A portrait is not such a head; no numerical resemblance claim.
3. Persistent foundation: new versioned account-owned expansion state and deduplicated events, compare-and-swap writes, isolated authoritative ledger. Never import client balances as trusted funds. Preserve legacy squads and balances. Record server-generated matches/results only as reward-eligible.
4. Tactics/weather: validated presets, custom positions, captain and roles; deterministic forecast/modifiers shared with simulation.
5. Stadium/transfers: server-priced upgrades with completion/cancellation and prerequisites; valuation, offers/contracts and expiry, atomic budget and ownership changes.
6. Competition/highlights: persisted round-robin/group/cup fixtures and progression, seeded AI results, goal metadata/weighted rating, honest event replay.
7. Missions/skills: Tashkent daily IDs, authoritative progress, single claims; five server-validated skill sessions with bounded rewards.
8. Career/integration: event aggregation, historical data explicitly limited to recorded facts; responsive localized dashboard, regression/concurrency tests and production checks.

## Deployment and evidence
Run lint, relevant unit/integration tests, complete regression suite and production build. Publish through existing GitHub main → Vercel integration only after checks pass. Verify production bundle, API and face assets. No user data reset or destructive migrations. Report unfinished phases and face-resource limits explicitly.
