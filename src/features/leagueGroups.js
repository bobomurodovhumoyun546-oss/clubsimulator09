export function leagueGroup(userId){let n=2166136261;for(const c of String(userId||'guest'))n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n%64+1;}
