import {migrateRivalsClub} from '../features/rivalsMigration.js';
import {inventoryPlayers} from '../features/cardInventory.js';
import {initialClub,formations} from '../features/clubSimulator.js';
import {benchSlots} from '../features/squadBench.js';
export function restoreClub(input,players){
 const club=migrateRivalsClub(input?.format==='club-simulator-save'?input.club:input,players);
 const lookup=new Map(inventoryPlayers(players,club||{}).map(p=>[p.id,p]));
 if(!club||club.version!==1||!Array.isArray(club.owned)||club.owned.length>10000||club.owned.some(id=>typeof id!=='string'||!lookup.has(id))||!Array.isArray(club.lineup)||club.lineup.length!==11||!Object.hasOwn(formations,club.formation)||!Number.isSafeInteger(club.coins)||club.coins<0||typeof club.name!=='string'||club.name.length<1||club.name.length>24)throw new Error('invalidSave');
 const owned=[...new Set(club.owned)],identities=new Set();
 for(const id of club.lineup){if(id==null)continue;const p=lookup.get(id);if(!p||!owned.includes(id)||identities.has(p.basePlayerId||p.id))throw new Error('invalidSave');identities.add(p.basePlayerId||p.id);}
 if(club.season&&(!Array.isArray(club.season.opponents)||!Array.isArray(club.season.fixtures)||!Array.isArray(club.season.otherFixtures)||!club.season.table?.you||!Number.isInteger(club.season.played)||!Number.isInteger(club.season.number)))throw new Error('invalidSave');
 const initial=initialClub(players),next={...initial,...club,owned,training:Object.fromEntries(Object.entries(club.training||{}).filter(([id,n])=>owned.includes(id)&&Number.isInteger(n)&&n>=0&&n<=5)),history:Array.isArray(club.history)?club.history:[]};
 for(const field of ['played','wins','draws','losses','trophies','goalsFor','goalsAgainst'])if(!Number.isSafeInteger(next[field])||next[field]<0)throw new Error('invalidSave');
 next.bench=benchSlots(next,inventoryPlayers(players,next));return next;
}
export function exportClub(club){return JSON.stringify({format:'club-simulator-save',version:1,exportedAt:new Date().toISOString(),club},null,2);}
