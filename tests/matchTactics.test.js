import test from 'node:test';
import assert from 'node:assert/strict';
import {supportPosition,keeperPosition,keeperSaveChances,matchQuality,isNearPostShot} from '../src/match/tactics.js';
import {matchKit,secondaryPanel} from '../src/match/three/kit.js';
import {attemptTackle} from '../src/match/rules.js';
const player=(overrides={})=>({id:'p',role:'ST',team:0,ovr:80,stats:{pac:90,def:90,dri:90,phy:90,ref:90,han:90},x:40,y:34,homeX:82,homeY:34,vx:0,vy:0,...overrides});
const state=()=>({players:[],ball:{x:52.5,y:34,vx:0,vy:0},time:0,minute:0,stats:[{fouls:0},{fouls:0}],rulesLog:[],discipline:{},mode:'auto'});
test('striker supports the ball instead of camping at the goal and mirrors after changing ends',()=>{
 const s=state(),p=player(),owner=player({id:'owner'});let target=supportPosition(s,p,owner);assert.ok(target.x>=60&&target.x<70);
 s.ball.x=25;assert.ok(supportPosition(s,p,owner).x<50);
 s.endsSwitched=true;s.ball.x=52.5;target=supportPosition(s,p,owner);assert.ok(target.x>35&&target.x<45);
});
test('defenders hold a compact line and stay goal-side of a nearby threatening attacker',()=>{
 const s=state(),defender=player({role:'CB',homeX:35}),owner=player({id:'owner',team:1,x:60}),runner=player({id:'runner',team:1,x:24,y:36});s.players=[defender,owner,runner];s.ball.x=60;
 const target=supportPosition(s,defender,owner);assert.ok(target.x<runner.x);assert.ok(Math.abs(target.y-runner.y)<3);
});
test('keeper holds the centre during buildup and reads both shot corners',()=>{
 const s=state(),p=player({role:'GK',x:3.2});s.ball.y=60;assert.equal(keeperPosition(s,p).y,34);
 s.last={kind:'shot',team:1};s.ball={x:20,y:34,vx:-40,vy:10};let target=keeperPosition(s,p);assert.ok(target.diving);assert.ok(target.y>34);
 s.ball.vy=-10;assert.ok(keeperPosition(s,p).y<34);assert.ok(keeperPosition({...s,last:null},p,true).x>3.2);
});
test('maximum OVR keepers save 70 percent of reachable shots and 85 percent while rushing',()=>{
 const p=player({role:'GK',ovr:110,stats:{ref:110,han:110}});
 for(const speed of [20,35,50,65]){const normal=keeperSaveChances(p,speed),rush=keeperSaveChances(p,speed,true);assert.ok(Math.abs(normal.catchChance+normal.parry-.7)<1e-10);assert.ok(Math.abs(rush.catchChance+rush.parry-.85)<1e-10);}
});

test('OVR differentiates identical catalogue attributes in movement, keeping and physical duels',()=>{
 const weak=player({ovr:60}),strong=player({ovr:99});assert.ok(matchQuality(strong,'pac')>matchQuality(weak,'pac')+15);
 assert.ok(keeperSaveChances(strong,30).catchChance>keeperSaveChances(weak,30).catchChance);
 const duel=ovr=>{const s=state(),p=player({id:'defender',role:'CB',x:51,ovr}),q=player({id:'carrier',team:1,x:50,vx:1,ovr:80});s.players=[p,q];s.owner=1;attemptTackle(s,0,false,()=>.72);return s.owner;};
 assert.equal(duel(99),0);assert.equal(duel(60),1);
});
test('match kit uses every colour, pattern, collar and sponsor from the saved club',()=>{
 const club={primary:'#123456',secondary:'#abcdef',pattern:'chevron',kitSleeves:'#111111',kitTrim:'#222222',kitShorts:'#333333',kitSocks:'#444444',kitTextColor:'#555555',kitCollar:'v',kitSponsor:'MY CLUB',badgeInitials:'MC'};
 assert.deepEqual(matchKit(club),{primary:'#123456',secondary:'#abcdef',pattern:'chevron',sleeves:'#111111',trim:'#222222',shorts:'#333333',socks:'#444444',text:'#555555',collar:'v',sponsor:'MY CLUB',badge:'MC'});
 for(const pattern of ['stripes','pinstripe','hoops','diagonal','halves','chevron']){const values=new Set();for(let x=-1;x<=1;x+=.05)for(let y=0;y<1;y+=.05)values.add(secondaryPanel(pattern,x,y));assert.equal(values.size,2,pattern);}
 assert.equal(secondaryPanel('solid',0,.5),false);
});

test('keeper quality monotonically improves save probability across supported OVR',()=>{
 let previous=0;for(const quality of [60,70,80,90,100,105,110]){const p=player({ovr:quality,stats:{ref:quality,han:quality}}),save=keeperSaveChances(p,40);assert.ok(save.catchChance+save.parry>=previous);previous=save.catchChance+save.parry;}
});

test('near-post saves total 80 percent for either corner, every quality and rushing state',()=>{
 assert.equal(isNearPostShot({originY:20,targetY:29}),true);
 assert.equal(isNearPostShot({originY:48,targetY:39}),true);
 for(const shot of [null,{originY:20,targetY:39},{originY:48,targetY:29},{originY:34,targetY:29},{originY:20,targetY:34}])assert.equal(isNearPostShot(shot),false);
 for(const q of [60,80,100,105])for(const rush of [false,true]){
  const save=keeperSaveChances(player({ovr:q}),55,rush,true);
  assert.equal(save.catchChance+save.parry,.8);
 }
});
