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
 s.ball.vy=-10;assert.ok(keeperPosition(s,p).y<34);assert.equal(keeperPosition({...s,last:null},p,true).x,12);
});
test('closing down lowers reachable-shot failure probability by exactly 12.5 percent',()=>{
 const p=player({role:'GK'}),normal=keeperSaveChances(p,40),rush=keeperSaveChances(p,40,true);
 assert.ok(Math.abs((1-rush.catchChance-rush.parry)/(1-normal.catchChance-normal.parry)-.875)<1e-10);
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

test('elite keepers save 22.5 percent more reachable shots than ordinary keepers',()=>{
 const keeper=q=>player({role:'GK',ovr:q,stats:{ref:q,han:q}});
 for(const speed of [20,35,50,65]){
  const ordinary=keeperSaveChances(keeper(80),speed),elite=keeperSaveChances(keeper(100),speed);
  assert.ok(Math.abs((elite.catchChance+elite.parry)/(ordinary.catchChance+ordinary.parry)-1.225)<1e-10);
 }
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
