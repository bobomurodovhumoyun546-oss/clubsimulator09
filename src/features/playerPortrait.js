import assets from '../data/portraitAssets.json' with { type: 'json' };

// Keep source metadata intact while serving audited portraits from our own host.
export const playerPortrait = url => assets[url] || url;
