# Club Simulator

Standalone football management browser game, extracted from BallIQ. The game owns its source, player catalogue, assets, account server and saved games. BallIQ is unchanged.

## Run

Requires Node.js 24 or newer.

```powershell
npm install
npm run dev
```

Open **http://127.0.0.1:5180**. This starts the game and its account API on port 5050. Login and signup use the local API automatically; no MongoDB or external authentication service is required.

## Included

- Starting XI, formations, tactics, training and a separate seven-player bench.
- Transfer market with name, OVR, nationality and precise position filters.
- Base, Legendary Prime and Ballon d’Or cards; the full 84-player event.
- OVR/popularity-based market prices and 14 foil-style packs: reveal five cards, choose one.
- Duplicate picks become separate reserve copies with independent training and manual selling.
- Resale prices depend on the card's current OVR, shared across footballers; top market cards stay in the 150,000?170,000 range.
- Real coaches and a design studio: five signature collections, seven kit patterns, three collars, sleeves, shorts, socks, sponsor, player name and number.
- Crests with five shapes, patterns, initials, symbols, crowns, stars, colour controls and SVG export.
- Four AI difficulty levels, full two-leg seasons, expanding leagues, scorers and assists.
- 90-second live matches, attack/defence choices, substitutions and injuries.
- Uzbek, English and Russian; day/night themes with matching backgrounds. Fullscreen hides the game toolbar; Escape restores it.
- Guest play, signup, login, manager profiles and account-specific club saves.
- JSON export/import for transferring a career, including BallIQ club saves.

## Saved games and accounts

Guest progress is saved in the browser. Signed-in careers are also saved to the account API and restored when signing in from another browser connected to the same server. The server stores accounts and careers in `backend/runtime/accounts.sqlite`. Keep that directory when updating or hosting the game. `CLUB_ACCOUNT_DB` can point to another persistent SQLite file.

These are separate accounts from BallIQ. BallIQ's account database and previous bonuses are not copied. To move a BallIQ club, import its saved club JSON using the game's Import control. Existing BallIQ localStorage can be exported in that app or from its browser developer tools.

Player metadata and the existing photo credits are preserved. Many player images are bundled; some original EA/remote portraits require internet access. The game itself and account server do not depend on the old BallIQ installation.

## Production

```powershell
npm run build
npm start
```

The server serves both the built game and account API at **http://localhost:5050**. Put it behind HTTPS when public. This is a persistent Node application: deploy with a persistent `backend/runtime` directory, rather than as a frontend-only static site.

```sh
docker build -t club-simulator .
docker run -p 5050:5050 -v clubsim-data:/app/backend/runtime club-simulator
```

## Verify

```powershell
npm run lint
npm test
npm run build
```

`tmp/template-backup` preserves the original Vite starter files from this folder. It is excluded from builds and version control.


### Player Match ? first playable stage

Use **PLAYER MATCH ? 11 v 11** on the squad dashboard. The original manager match remains available. Phaser 3 and the engine load only when the new match opens. Both teams use existing catalogue identities, attributes, formation slots and training levels.

WASD moves, Shift sprints, Space passes/presses, E plays through balls/tackles, Q plays long passes, J charges a shot (1.2 seconds), K switches players and G rushes your keeper. Touch controls appear on mobile. Auto, Manual and Hybrid share the same running simulation. Click the pitch after changing a control to restore keyboard focus. A match lasts six active minutes with a paused half time. Full time requires Save result to apply the existing league/reward transaction. Leaving early discards the game.

Includes stamina, acceleration, player separation, independent ball physics, AI formation movement, goalkeeper interceptions, basic throw-ins/goal kicks, bench substitutions, zoom, names/OVR and match statistics saved in history. Offside, fouls/cards, penalties, corners, replays, audio commentary and persistent injury/development mechanics are not implemented in this first stage. The engine is arcade football, not a complete rules simulation.


### 2.5D graphics upgrade

Player Match now loads two 8-direction raster athlete atlases, textured perspective turf, goal nets, soft shadows, stadium seating/advertising, camera smoothing and deconflicted labels. Lighting and weather can change during play; graphics quality and the 30/60 FPS cap are selected before kick-off. Art provenance, frame mapping and limitations: [docs/match-graphics.md](docs/match-graphics.md).


### Real-time 3D Player Match (current renderer)

The squad dashboard's **3D PLAYER MATCH** button now opens the Three.js/WebGL 2 match. Athletes are rigged 3D meshes, with a real perspective camera, lit field, goal meshes and instanced stadium crowd. Existing match state and rewards remain shared with the club. Choose Broadcast / Goal view / Tactical / Free orbit in the match settings. The preceding 2.5D section describes the retained legacy renderer. See [3D implementation and limitations](docs/match-3d.md).


### Shooting and football rules

3D Player Match now supports corner-directed shots with Auto/Left/Right aiming, offside snapshots, fouls/cards, penalties/free kicks, corners/throws/goal kicks, genuine stoppages, changing ends and added time. Substitutions queue for stoppages. See [implemented rules and limits](docs/match-rules.md).
