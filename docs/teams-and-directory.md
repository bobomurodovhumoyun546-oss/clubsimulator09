# Starter teams, crests and account directory

Local implementation only. Vercel deployment remains paused.

## Behavior

- Donation packages: 100,000 / 2,000 UZS; 500,000 / 5,000; 1,000,000 / 10,000; 10,000,000 / 20,000; 50,000,000 / 50,000. In-person payment notice remains. No automatic coin grants or online payment processing.
- A signed-in account with no matches and no previous starter choice can claim one team. The server chooses the squad from the maintained snapshot and writes the one-time choice and cloud save atomically. Old saves cannot overwrite the chosen starter identity.
- Claiming adds 26 starter cards, selects a valid XI and seven substitutes, and keeps coins, grants, original player IDs and existing inventory. Starter editions reuse existing player identities when names/birth dates match. Ratings are ClubSim game ratings clamped to 80–90; they are not official EA ratings. Historical starter cards remain resolvable after catalogue updates.
- Team and national-team search, league filters, squad preview and a separate reusable crest chooser work in UZ/EN/RU. Crest selection in the studio changes the crest without renaming the club or changing the kit. The crest reaches SVG kits and 3D shirt textures, including friend matches.
- The account directory lists other registered accounts, 40 per page, with name/club/username search, exact email search, field filters and name/club sorting. Emails are never returned. Literal wildcard characters are escaped.
- Accounts map deterministically into 64 tournament groups. A group has its own opponents/calendar and includes only accounts assigned to that group. A previous played season is archived when migrating groups; lifetime totals, coins and inventory remain. This is grouped local career simulation, not a globally authoritative live league.

## Data coverage and limits

Snapshot retrieval: 2026-11-17T14:03:06.526Z. Each team includes its source link. Source-backed complete squads may be claimed; incomplete squads are explicitly marked and cannot claim a fabricated 26-player squad. Missing crest files show a labeled temporary monogram. Transfers do not refresh automatically.

Sources:
- ESPN league/team roster endpoints, e.g. https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/83/roster
- TheSportsDB club metadata and badge assets where available.
- FIFA member association definition: https://inside.fifa.com/associations ; the member code snapshot from https://github.com/tanzhijian/fifacodes . The selection catalogue excludes ISR as requested.
- Selected European club identities were curated; logo files also use https://github.com/luukhopman/football-logos and source-linked Wikimedia pages. Some upstream artwork may be historical. Rights remain with original owners.

Upstream APIs rate-limited additional roster/artwork requests. This implementation does not claim that every requested club has a verified current 26-player squad or a complete crest asset. Completing those entries requires verified roster/crest data; the UI reports missing entries.

## Validation

The full regression suite passed (123 tests), followed by focused starter/catalogue checks after data updates. Tests cover concurrent claims, authentication, stale-save protection, restore/import compatibility, all complete squads fielding eleven players, crest file presence, directory pagination/filtering and tournament groups. UZ/EN/RU components were rendered with React SSR; actual phone/browser interactions have not been manually tested.
