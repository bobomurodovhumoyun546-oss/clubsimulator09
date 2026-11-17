import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import assets from '../src/data/portraitAssets.json' with {type:'json'};
import starters from '../src/data/starterPlayers.json' with {type:'json'};
import {playerPortrait} from '../src/features/playerPortrait.js';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards} from '../src/features/simulatorCards.js';

test('every cached portrait resolves to an existing valid image within the static directory',()=>{
 assert.ok(Object.keys(assets).length>1200);
 for(const [remote,local] of Object.entries(assets)){
  assert.match(remote,/^https:\/\//);
  assert.match(local,/^\/game-data\/portraits\/[a-f0-9]{24}\.(png|jpg|webp|gif)$/);
  const bytes=readFileSync(new URL('../public'+local,import.meta.url));
  assert.ok(bytes.length>250,local);
  assert.ok(bytes[0]===137||bytes[0]===255||bytes.toString('ascii',0,4)==='RIFF'||bytes.toString('ascii',0,3)==='GIF',local);
  assert.equal(playerPortrait(remote),local);
 }
});
test('Beckenbauer has a local portrait across every existing card edition without changing identity',()=>{
 const raw=JSON.parse(readFileSync(new URL('../public/game-data/players.json',import.meta.url),'utf8'));
 const cards=simulatorCards(normalizePlayers(raw)).filter(p=>/beckenbauer/i.test(p.fullName));
 assert.ok(cards.length>=3);
 for(const player of cards){assert.match(player.id,/legend-008-franz-beckenbauer/);assert.match(playerPortrait(player.image),/^\/game-data\/portraits\//);}
 assert.equal(new Set(cards.map(p=>playerPortrait(p.image))).size,1);
 assert.equal(playerPortrait('/existing-photo.png'),'/existing-photo.png');
 assert.equal(playerPortrait(undefined),undefined);
});
test('all supplied card and starter photos have a local asset, including event overrides',()=>{
 const raw=JSON.parse(readFileSync(new URL('../public/game-data/players.json',import.meta.url),'utf8'));
 for(const player of [...simulatorCards(normalizePlayers(raw)),...Object.values(starters)]){
  if(!player.image)continue;
  const url=playerPortrait(player.image);
  assert.ok(url.startsWith('/'),player.fullName);
  assert.ok(readFileSync(new URL('../public'+url,import.meta.url)).length>250,player.fullName);
 }
});
