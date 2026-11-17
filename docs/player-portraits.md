# Player portraits

PlayerPhoto resolves source URLs through `src/data/portraitAssets.json` and serves the audited files from `public/game-data/portraits`. Existing event assets remain in their original local directories. Player IDs, ratings and original source metadata are preserved. A failed image is tracked by its URL, so it cannot hide another player's portrait when React reuses the component.

The audit covers all supplied image URLs in normal, legendary, Ballon and Rivals cards and the starter-team catalogue. Missing photo data remains the existing initials fallback; this does not fabricate photos for records without an image.

Rebuild the cache from the repository root:

```sh
node scripts/cache-player-portraits.mjs
python -m pip install Pillow
python scripts/optimize-player-portraits.py
node --test tests/playerPortrait.test.js
```

The downloader skips existing cache files, checks image payloads and records unresolved sources in `tmp/portrait-audit-failures.json`. Check that report before publishing. EA portrait IDs also have a FUTBIN mirror fallback. The original repair's alternate source URLs are recorded in `portrait-replacement-sources.json`; they are not new player identities. Optimized portraits retain transparency and aspect ratio, use WebP, and fit within 320 × 320 pixels. Source watermark content is not removed.

`portrait-cache-summary.json` records the published audit totals. Deployment uses ordinary Vercel static assets, so the browser no longer depends on the remote photo host's hotlink policy or availability.
