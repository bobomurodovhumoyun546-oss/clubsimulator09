# ClubSim 2.5D graphics

## Assets and provenance

`public/match/players-atlas.png` and `players-away-atlas.png` were created with the built-in ImageGen tool for this project. They are 1024 x 1536 transparent PNG sheets: eight directions per row, twelve rows, 128 x 128 cells (96 frames each). Blue/white home kit and red/white away kit. These are generic athletes, not likenesses of the named catalogue footballers. Names, identities, formations and ratings still come from the existing engine. Keep both PNG files when deploying.

Generation prompt: production game sprite atlas, exact eight columns by twelve rows; anatomically proportionate male football athlete; premium prerendered 3D appearance; elevated 35-degree orthographic camera; blue jersey, white shorts, navy socks, orange boots; consistent scale and transparent background. Column directions: right, down-right, down, down-left, left, up-left, up, up-right. Rows: idle, walk, four running phases, pass, shoot, slide, celebration, goalkeeper dive, goalkeeper catch. No text or grid. The away sheet was generated as an edit replacing blue jerseys/navy socks with red, preserving layout and poses.

## Renderer

- `rendering.js`: trapezoidal ground projection, depth scale, eight-way facing, pose state machine and non-overlapping label lanes.
- `stadium.js`: seeded grass detail and striped mowing pattern, stadium bowl/crowd, advertising, pitch markings and lights baked once into canvas textures. Goal frames/netting and a shared radial alpha shadow texture.
- `scene.js`: batched atlas images, short pose crossfades, foot-anchored movement, perspective scale and Y depth sorting. Ball height is separate from its ground shadow. Camera follow and zoom use time-based smoothing.
- Engine visual events are cosmetic: pass/shoot/tackle/slide/catch/dive/celebrate use actual match events. Idle/walk/run/sprint/turn use velocity/facing. They do not change ratings, scoring, physics, rules or rewards.
- Weather uses 28 (Low) or 95 (High) small primitives. Grass and crowds are not regenerated per frame. Labels are laid out at 10 Hz; React HUD updates at roughly 6 Hz. Simulation retains its fixed 60 Hz step regardless of render cap.
- Select High/Low and 30/60 FPS before kick-off. Lighting/weather/zoom/OVR can change during the same match. Frame cap is Phaser's `fps.limit`; no guaranteed device frame rate is claimed.
- Graphics resources/listeners are destroyed on match exit. Atlas load failures are surfaced to React.

## Scope and honest limitations

No reference screenshot was attached to the graphics-upgrade message, so exact visual comparison was unavailable. This is a 2D renderer using prerender-style raster athletes, not a 3D engine or FC Mobile assets. Running has four directional cycle frames; other actions use key poses, timed state transitions and crossfades, not full motion-capture cycles. Standing tackle reuses a forward action pose; walk/turn/sprint reuse the locomotion sheet. Keeper kit colors currently use tint on the shared athlete sheet. Player face/hair variations are not identity-specific. Stadium spectators are procedural, not individual animated characters. Lighting/weather are visual effects only.

For the next art-quality tier, replace these sheets with artist-reviewed, uniformly registered 8/16-direction atlases containing 8–12 unique frames for every action, dedicated goalkeeper/referee kits and diverse player appearances. `animationPose` isolates the frame mapping for that replacement. The prior engine's offside/cards/penalty/corner limitations remain; this graphics change does not claim to implement those rules.

## Verification

`npm run lint`, `npm test`, `npm run build`. `tests/matchRendering.test.js` checks direction/frame mapping, perspective and label layout; `tests/playerMatch.test.js` checks match identities, shots, pause, goal scoring, halftime/fulltime and goalkeeper distribution. Interactive screenshot capture was attempted twice using Computer Use but the host returned capture/request timeouts; visual browser acceptance and mobile device FPS measurements could not be completed in this session.

Production bundle verification completed with Vite `build({build:{outDir:"tmp/graphics-build",emptyOutDir:false,copyPublicDir:false}})`. The normal build was stopped during slow copying of the large public asset catalogue. Verified compiled files were restored to `dist`; missing public files were restored using local NTFS hard links (falling back to copies), avoiding duplicate image IO. The source remains under `public`; future ordinary builds still use the unchanged Vite configuration.
