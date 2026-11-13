# ClubSim real-time 3D renderer

The default Player Match now uses **Three.js + WebGL 2** through `src/match/scene3d.js`. React still owns match setup, HUD, substitutions and completion. `engine.js` remains the authoritative 105 x 68 football simulation; this change does not introduce a second player database, rating system or scoring engine.

## Real 3D

- Athletes are actual vertex-coloured `SkinnedMesh` models with a skeleton: body, head, shoulders, elbows, hips and knees. Smooth body surfaces, shirt/shorts/socks, skin/hair variation, facial details, boots and back numbers are geometry/materials. Each athlete's rigid parts are merged into one skinned draw call, plus a number decal.
- Idle/walk/run/sprint/pass/shot/tackle/slide/celebration/dive/catch use bone poses blended over time. Facing rotates continuously rather than selecting 2D directions.
- The football is a rotating 3D mesh with panels; its height uses the existing ball physics directly. The field is a lit textured plane with 3D goalposts/net lines, flags, advertising, stepped stands, instanced spectators and floodlight towers.
- High graphics uses a directional shadow map. Low graphics reduces crowd/weather density, disables expensive shadow maps and limits device pixel ratio; contact shadows remain. Three.js rendering is capped at the selected 30/60 FPS independently of the fixed simulation step. Actual device FPS has not been benchmarked.
- Perspective camera presets: Broadcast, Goal view, Tactical, Free orbit. In Free orbit, drag the pitch to rotate and use wheel/pinch or the HUD zoom controls. The other views follow the ball smoothly. WASD and mobile movement are transformed into the current camera's screen directions.
- Labels use the real player names/OVR projected from 3D positions to the overlay, then arranged to reduce overlap.
- Day/night lighting and rain/snow stay adjustable. WebGL context failures show an error; no sprite fallback is silently presented as 3D.

## Preserved behaviour

Starting XI, bench substitutions, existing player IDs/training/stats, Auto/Manual/Hybrid, AI, passing/shooting/defending, goalkeeper logic, score, timer, pause and match rewards/results still use the existing integration. Sold/bought cards flow through the same club inventory. The subsequent rules update adds offside, fouls/cards, penalties and set pieces; see [match-rules.md](match-rules.md) for the exact supported rules and limitations.

The old `scene.js`, 2.5D rendering helpers and PNG atlases remain as legacy source/assets, but the active Player Match imports `scene3d.js`; player sprites are not used by the new renderer. Phaser remains installed for the preserved legacy renderer.

## Art quality and verification

These are original procedural, stylized 3D athletes with an articulated skeleton, not photorealistic scanned footballers or FC Mobile assets. Named footballers share a generic mesh family; individual facial likenesses and motion-capture animation are not included. A higher realism tier needs artist-reviewed rigged GLB characters, detailed kit/hair/face textures, full animation clips and stadium art. The renderer/engine separation allows a future GLB character implementation to replace `three/footballer.js` without rewriting match logic.

Run `npm run lint` and `npm test`. `tests/match3d.test.js` validates 3D world coordinates, camera presets, camera-relative controls, action state expiry and a real skinned character's bones/geometry. Production code bundling is verified with Vite build to `tmp/three-build` with `copyPublicDir:false`, avoiding a redundant copy of the large existing image catalogue. Copying the compiled index/assets to `dist` updates the local production code while retaining existing public resources.

A disposable real-catalogue preview exists at `/tmp/match-3d-preview.html` in the Vite dev server. It does not save to the user's club. The computer/browser automation service returned unavailable/timeouts during this change, so no successful interactive GPU screenshot or mobile-device visual acceptance is claimed.


## November 12 gameplay adjustments
- Opening and subsequent kickoffs use separated own-half formations. The initial countdown now leads to an actual kickoff restart.
- A successful tackle transfers manual selection to the winner, preserves movement and grants 0.9 seconds of possession protection against immediate counter-tackles. Normal receptions grant 0.8 seconds. Failed standing tackles mostly miss instead of becoming fouls; reckless slides remain punishable.
- Through passes (E / Through touch button) lead an onside receiver 8-15 metres into space and trigger a timed sprint. Attacking off-ball players, including the selected player, receive offside positioning assistance before the pass. Offside rules still apply; the assist does not teleport players or guarantee immunity.
- Keeper reach, catch probability and parry probability are reduced. Stamina drains more slowly and recovers faster.
- The pitch viewport is larger (up to 1660px wide and 72vh high on desktop); football dimensions remain 105 x 68 metres. Match notices appear at the top of the pitch.
- Every athlete has deterministic procedural head proportions, eyes, eyebrows, nose, mouth, hair style and optional beard derived from the existing base identity. Card editions retain the same appearance. These are varied fictional faces, not scanned likenesses of real footballers. No external face assets were added.


## Positioning, ratings and custom kits
- ST/CF/wingers now support the ball 8-11 metres ahead instead of following a fixed advanced anchor. Defenders protect a compact line, mark nearby threats goal-side, and send one presser to anticipate the carrier while teammates cover.
- Match-only quality combines 60% of the existing attribute with 40% OVR. Acceleration, pace, pass precision, shooting range/power, tackle success and keeping use this weighting; catalogue values and IDs are unchanged. Physical strength is compared with the carrier's dribbling during duels.
- Keepers return to the centre in buildup, predict shot intersection, react according to REF and move/dive toward either corner. Holding G closes down to 12 metres. For a reachable shot while more than seven metres off the line, failure probability is multiplied by 0.875 (12.5% relative reduction). This is conditional save tuning, not a guarantee that whole-match goal totals fall by exactly that amount.
- The saved ClubStudio design now drives the 3D outfield kit: primary/secondary colours, all seven patterns, sleeves, trim, collar, shorts, socks, text colour, sponsor and initials. Actual player names and individual squad numbers appear on backs. Keepers retain contrasting shirt colours with club shorts/socks/trim. Patterns use baked vertex colours; text uses small transparent decals. No new external assets are required.


The kit preview now reuses the complete ClubBadge SVG, including the selected circle/shield/diamond/hexagon/rounded outline. The 3D shirt decal uses the same shared outline definitions and saved badge colours/style/initials. Changing a badge shape in ClubStudio therefore updates the shirt preview and subsequent 3D matches.

Gameplay tuning: player movement is 18% faster, including sprint, with pace and stamina still applied. Pitch viewport grows to 1920px / 80vh (68vh mobile); regulation simulation dimensions remain 105 x 68m. For reachable shots, effective keeper quality 100 has 22.5% higher relative save probability than quality 80 at the same shot speed. Near-post shots (same lateral side as release, outer goal area) use 80% total saves, including parries, overriding quality and rush modifiers. Unreachable shots still require keeper movement and contact.

Keeper possession and skills: while a goalkeeper holds the ball inside their area, tackles cannot take it, all other active players are excluded from that area, and the ball is rendered at hand height. Enter punts immediately on keyboard; the touch Shoot button releases a punt. The airborne punt counts as distribution, preserves offside rules, and releases keeper protection. The eight-second holding rule remains active. ArrowUp Rainbow, ArrowDown Fake shot, ArrowRight Lane change, ArrowLeft Elastico trigger only for the selected outfield ball carrier in manual control; touch buttons provide the same actions. Skills have distinct ball trajectories, bone poses, movement, a stamina cost and a recovery cooldown. They cannot be chained or interrupted by kicking mid-action; opponents can still tackle the carrier.

Opening control fix: keyboard events are handled for the active match even when the canvas has not received a click, with text/select inputs excluded and held keys cleared on window blur. Enter (including numpad Enter) replaces J for charged shots and keeper punts. At a ready manual kickoff, directional input triggers a short pass to a centrally placed nearby teammate; opening passes have no random lateral error. The normal restart preparation remains in force.

WASD correctness: absent touch-control properties must be converted to Boolean before Number. The previous false || undefined expression produced NaN on an unpressed axis and could corrupt movement on the first key. movementInput now guarantees finite independent axes for keyboard and touch. In manual mode the first directional input takes the opening kickoff and advances movement in the same simulation tick. Regression tests cover each of W, A, S and D from a fresh engine for 90 ticks.
