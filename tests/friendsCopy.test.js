import test from 'node:test';
import assert from 'node:assert/strict';
import {friendsCopy,friendCopy,friendError} from '../src/data/friendsCopy.js';
import {onlineNotice} from '../src/match/onlineCopy.js';
test('all three languages cover every friend, invitation and online match message',()=>{
 const keys=Object.keys(friendsCopy.en).sort();for(const language of ['uz','en','ru']){assert.deepEqual(Object.keys(friendsCopy[language]).sort(),keys);for(const value of Object.values(friendsCopy[language]))assert.ok(typeof value==='string'&&value.trim());assert.ok(friendCopy(language).newInvites.includes('{count}'));}
 assert.equal(friendCopy('unsupported'),friendsCopy.en);assert.equal(friendError('needXI','generic'),'needXI');assert.equal(friendError('unknown','generic'),'generic');
});
test('connection states and match notices translate without changing names or player data',()=>{
 for(const language of ['uz','en','ru']){const w=friendCopy(language);assert.equal(onlineNotice('WAITING FOR FRIEND',language),w.waitingFriend);assert.equal(onlineNotice('WAITING FOR CONNECTION',language),w.waitingConnection);assert.equal(onlineNotice('FAKE SHOT',language),w.fakeShot);}
 assert.equal(onlineNotice('KICK OFF','ru'),'НАЧАЛЬНЫЙ УДАР');assert.equal(onlineNotice('KICK OFF','uz'),'MARKAZDAN BOSHLASH');assert.equal(onlineNotice('OFFSIDE - Ronaldinho','ru'),'ОФСАЙД - Ronaldinho');
});
