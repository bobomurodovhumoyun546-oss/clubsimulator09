# Rivals event

The event has 56 existing footballer identities with separate Rivals card IDs. Base ratings remain capped at 105, with five training levels (maximum 110).

## User roster and colours

Kompany is explicitly blue. The first eight existing colours stay unchanged. Starting with Vidic, all subsequent cards alternate red, blue in the user's supplied order. Legend cards retain white accents; current-player cards use their catalogue legend status. The 15 new user-supplied photos were downloaded unchanged to public/player-headshots/rivals (24 supplied photos total); original URLs are preserved. Players without supplied photos inherit catalogue portraits, licensing metadata and portrait styles.

| OVR | Ordered roster |
| --- | --- |
| 105 | Pele, Maradona, Van der Sar, Cech, Maldini, Zanetti |
| 104 | Gerrard, Lampard, Kompany, Vidic, Pique, Varane, Eden Hazard (blue, LW), Gareth Bale (red, RW) |
| 103 | Luis Diaz, Kvaratskhelia, Bellingham, Pedri, Bergkamp, Zola |
| 102 | Osimhen, Lukaku, Fermin Lopez, Arda Guler, Matheus Cunha, Joao Pedro |
| 101 | Eze, Morgan Rogers, Singo, Skriniar, De Ketelaere, Woltemade |
| 100 | Cody Gakpo / Jeremy Doku, Dejan Kulusevski / Noni Madueke |
| 99 | Benjamin Sesko / Hugo Ekitike, Amad Diallo / Savinho |
| 98 | Manuel Ugarte / Joao Palhinha, Rodrigo Bentancur / Martin Zubimendi |
| 97 | Piero Hincapie / Levi Colwill, Leny Yoro / Manuel Akanji |
| 96 | Malo Gusto / Destiny Udogie, Diogo Dalot / Rico Lewis |
| 95 | Kobbie Mainoo / Nico Gonzalez, Curtis Jones / Oscar Bobb |

Each 95-100 OVR tier has exactly four players: two red and two blue. Rival pairs remain metadata; no VS opponent line is displayed on the cards. All identities, positions and existing portraits come from the catalogue; no parallel player database is created.

## Packs and saves

- Rivals 95+ costs 35,000 coins. Per-card odds: 95-99 60%, 100-102 25%, 103-104 12%, 105 3%.
- Rivals 100-105 costs 75,000 coins, 102-105 costs 95,000 coins, and 103-105 costs 115,000 coins. Each matches the corresponding Ballon pack price and odds; source pools remain Rivals-only.
- Rivals 104+ costs 140,000 coins, with 104 OVR 70% and 105 OVR 30%.
- Both follow reveal-five/select-one and exclude duplicates/copies from the source pool. Other pack editions stay isolated.
- Gerrard, Lampard, Kvaratskhelia, Bellingham and Pedri are removed only from the Ballon d'Or event roster/new draws. Normal and legendary editions remain available. The Ballon roster now has 79 named entries.
- Restore/import migrates previously owned Ballon editions for those five to Rivals, preserving coins, training, XI, bench, copies and pending pack references. If the replacement is already owned, the old card becomes an independent copy. Migration is idempotent.


## Regular 95-100 replacement

The 24 lower-tier active Rivals cards are current, non-legend catalogue players and none is on the Ballon event roster. Their card OVRs and five-level training limits stay as before, while attributes retain source-player weaknesses and are capped at base OVR minus seven before training. No legend-specific statistical floors are applied to these 24 cards.

Former lower-tier Rivals editions remain resolvable as `rivalsLegacy` with their original IDs, training, ownership and copies, preventing old save imports from failing. They are absent from active Rivals market listings and every pack pool. The active event remains 56 cards, 28 red / 28 blue, with four cards per OVR from 95 through 100.

Eight event portraits use the user's latest image URLs: Maldini, Kompany, Fermin Lopez, Cunha, Van der Sar, Lampard, Varane and Zanetti. Images are downloaded unchanged under unique user-* filenames; current source URLs and credits accompany each card. No watermarks are erased or retouched.

Pedri has a card-specific centred frame and an object-position adjustment for the subject's location in the supplied photograph. All active Rivals cards with base OVR 95-101 have their portrait frame raised 12 pixels, including after training. These presentation adjustments do not affect other editions or player statistics.
