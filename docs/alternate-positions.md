# FC Mobile alternate positions

Source: https://renderz.app/players
Retrieved: 2026-11-12T18:09:27.323Z

Reviewed 31802 FC Mobile cards and matched 815 catalogue records. The importer uses a matching primary position and identity (EA player ID or exact normalized name, plus birthday where present), selects the highest-rated card with alternate positions, and uses the newest source card to break ties. Different FC Mobile events can have different positions; this is a single documented ClubSim profile, not a claim that every event card has identical positions.

The importer only reads public data. Run node scripts/import-fc-mobile-positions.mjs to regenerate src/data/fcMobilePositions.json. Unmatched players keep their existing positions. IDs, ownership, copies, training, OVR and original attribute classification are preserved. Normal, Legendary, Ballon and Rivals editions inherit the profile. Market filters and squad selectors read the combined positions. Player details link to the exact source card.
