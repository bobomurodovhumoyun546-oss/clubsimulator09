import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSeason,addSeasonMembers,recordSeasonMatch,seasonRows} from '../src/features/clubSeason.js';
import {initialClub,clubAction} from '../src/features/clubSimulator.js';
import {normalizePlayers} from '../src/games/core/players.js';
import {upcomingOpponent,expectedGoals} from '../src/features/footballMatch.js';
import {clubRecord} from '../src/features/clubLeague.js';
const drawn=()=>({home:1,away:1});
test('ten clubs play eighteen games, one home and one away against each opponent',()=>{
 let season=createSeason();assert.equal(season.fixtures.length,18);
 for(const opponent of season.opponents){assert.deepEqual(season.fixtures.filter(f=>f.opponentId===opponent.id).map(f=>f.venue).sort(),['away','home']);}
 for(let i=0;i<18;i++){season=recordSeasonMatch(season,2,0,drawn);for(const row of seasonRows(season,'My FC'))assert.equal(row.played,i+1);}
 assert.equal(season.complete,true);assert.equal(season.otherFixtures.length,0);
 const rows=seasonRows(season,'My FC');assert.equal(rows[0].points,54);
 for(const row of rows)assert.equal(row.played,18);
 assert.equal(rows.reduce((n,r)=>n+r.goalsFor,0),rows.reduce((n,r)=>n+r.goalsAgainst,0));
});
test('a new club adds two fixtures without changing played fixtures or resetting points',()=>{
 let season=createSeason();for(let i=0;i<5;i++)season=recordSeasonMatch(season,2,0,drawn);
 const prefix=season.fixtures.slice(0,5),stats={...season.table.you};
 season=addSeasonMembers(season,[{id:'new-user',name:'New FC'}]);
 assert.equal(season.fixtures.length,20);assert.deepEqual(season.fixtures.slice(0,5),prefix);assert.deepEqual(season.table.you,stats);
 assert.equal(addSeasonMembers(season,[{id:'new-user',name:'New FC'}]),season);
 while(!season.complete)season=recordSeasonMatch(season,1,1,drawn);
 for(const row of seasonRows(season,'My FC'))assert.equal(row.played,20);
});
test('season ends after eighteen games, pays trophy once, resets table on game nineteen and preserves club assets',async()=>{
 const players=normalizePlayers(JSON.parse(await readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8')));
 let club=initialClub(players);
 for(let i=0;i<18;i++){
  let calls=0;const result=clubAction(club,{type:'match'},players,()=>calls++===0?.999999:0);
  club=result.state;if(i<17)assert.equal(club.season.complete,false);
 }
 assert.equal(club.season.complete,true);assert.equal(club.trophies,1);assert.equal(clubRecord(club).played,18);
 assert.equal(upcomingOpponent(club).round,1);assert.equal(upcomingOpponent(club).season,2);
 const next=clubAction(club,{type:'match'},players,()=>0).state;
 assert.equal(next.season.number,2);assert.equal(next.season.played,1);assert.equal(next.season.table.you.draws,1);
 assert.equal(next.played,19);assert.equal(next.lastSeason.played,18);assert.equal(next.trophies,1);assert.deepEqual(next.owned,club.owned);
 assert.ok(expectedGoals(80,80,'balanced','away').home<expectedGoals(80,80).home);
});
