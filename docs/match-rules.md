# Match rules and corner-directed shooting

## Shooting

The shot target is no longer centred on Y=34. `shooting.js` chooses a goal corner, looks for the side away from the goalkeeper, and supports an explicit left/right choice. The HUD has Auto / Left corner / Right corner controls; movement toward a side also influences automatic aiming. Left/right are relative to the attacker's direction and remain correct after half-time and camera rotation. OVR/shooting quality, distance and charge affect placement error, so shots can still miss. Goalkeepers can catch, parry or miss; a missed attempt has a reaction cooldown rather than retrying a save every physics frame.

## Authoritative rules

`rules.js` is shared by the existing simulation, while `scene3d.js` displays the consequences. Both teams are treated the same.

- Offside position is snapshotted when the ball is played, using the ball, opponents' half and the second-last active opponent. An offence is enforced when a flagged player touches the ball, not merely because they stood offside. Deflections/saves preserve the snapshot. Goal kicks, corners and throw-ins are exempt on direct receipt. Restart is an indirect free kick at the involvement location. The defender line briefly appears in 3D after an offside call.
- Goal line / touchline crossing uses the whole ball and the first crossed boundary. Last touch determines corner versus goal kick and throw-in ownership. Posts/crossbar rebound the ball. Direct goals from throw-ins or indirect free kicks, and direct own goals from restarts, are disallowed. A restart taker's double touch awards an indirect free kick.
- Both human and AI tackles can win possession, miss, or cause a foul. Reckless/excessive-force and goal-opportunity checks feed yellow/direct red decisions. Two yellows send a player off. A dismissed player stops participating and is hidden by the renderer, cannot be selected or replaced. Fewer than seven active players abandons the match. If a goalkeeper is dismissed, an active teammate is nominated as emergency keeper.
- Fouls outside the offender's penalty area produce free kicks with a wall; fouls inside/on its boundary produce penalties from eleven metres. Other players are repositioned outside the penalty area/behind the spot. The defending goalkeeper remains on the line before the kick; a user defending a penalty can move their keeper laterally. A penalty already awarded extends the period until the attempt is completed.
- Set pieces stop physics/movement, reposition participants and enforce spacing, then genuinely release the ball from the restart point. AI takes them automatically; manual mode allows five seconds after readiness for user input before assisted completion. This is an arcade assistance timer, not a full referee delay-sanction implementation.
- A keeper handling an opponent's ball in their own area has an eight-second limit; exceeding it gives a corner. Deliberate teammate back-passes/throw-ins are controlled with feet, not automatically handled.
- Half-time switches ends/attack directions. Time lost to restarts/substitutions generates actual added playing time at 45/90 minutes. Pausing the game does not count as football added time.
- Substitutions requested in open play queue until a stoppage; they can be performed during half-time. Bench membership, positional fit, player identity, sent-off status and the five-change limit are enforced.
- Own goals count for the correct team and persist through the league/reward transaction without crediting the defender in the scorer leaderboard. Rules log, discipline, match statistics and added time are stored in the match report/history. The existing manager match remains available.

## Scope

This is an arcade rules implementation, not complete IFAB/VAR simulation. Offside uses player centre positions and touching involvement; body-part margins, blocking a goalkeeper's view and all opponent-interference nuances are not modelled. No VAR, advantage system, general handball detection, detailed penalty encroachment/retakes, throw-in foot/arm legality, referee five-second countdown sanctions or multi-match card suspensions are claimed. Referee card/throw animations are procedural poses. Abandoned fixtures preserve the current score and abandonment timestamp; competition-level administrative forfeits are not assigned. Regulation minute 90 is used in the saved result for legacy compatibility, with separate actual abandonment/added-time fields.

## Sources consulted

- [IFAB Law 11: Offside](https://www.theifab.com/laws/latest/offside/)
- [IFAB Law 12: Fouls and misconduct](https://www.theifab.com/laws/latest/fouls-and-misconduct/)
- [IFAB Law 15: Throw-in](https://www.theifab.com/laws/latest/the-throw-in/)
- [IFAB Law 16: Goal kick](https://www.theifab.com/laws/latest/the-goal-kick/)
- [IFAB Law 17: Corner kick](https://www.theifab.com/laws/latest/the-corner-kick/)

## Verification

`tests/matchRules.test.js` checks placement, offside snapshots/exemptions/rebounds, boundaries, restarts, posts, free kicks, penalties, cards, substitutions, half-time/added time, keeper misses/holding, own goals, full seeded AI match progression and persistence through the real catalogue/league/reward flow. Run the complete `npm test` suite and `npm run lint`. Production bundling uses the unchanged Vite config, with a temporary output directory and `copyPublicDir:false` to avoid duplicating the existing large static catalogue; compiled index/assets can then be copied to the existing `dist`.
