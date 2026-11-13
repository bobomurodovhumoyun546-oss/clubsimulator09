import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine,kick,stepEngine,engineResult,queueMatchSubstitution} from '../src/match/engine.js';
import {attackDirection,offsidePlayers,snapshotOffside,legalTouch,awardRestart,awardFoul,attemptTackle,disciplinePlayer,handleBoundary,advanceClock,accountStoppage} from '../src/match/rules.js';
import {movementInput} from '../src/match/keyboard.js';
import {shotTarget} from '../src/match/shooting.js';
import {addScoringEvents} from '../src/features/seasonScorers.js';
const roles=['GK','LB','CB','CB','RB','CM','CM','CAM','LW','ST','RW'];
const players=Array.from({length:24},(_,i)=>({id:`p${i}`,fullName:`Player ${i}`,positions:[i>21?'ST':roles[i%11]],cardOverall:80,careerClubs:[]}));
function create(){const s=createEngine({lineup:players.slice(0,11).map(p=>p.id),training:{},bench:['p22','p23']},players,roles,players.slice(11,22).map((p,i)=>({id:p.id,role:roles[i]})));s.restart=0;return s;}
function placeOffside(s){s.players.forEach(p=>{p.x=p.team?70:30;p.y=60;});s.players[11].x=101;s.players[1].x=60;s.players[1].y=34;s.players[9].x=90;s.players[9].y=34;s.owner=1;}
function ready(s){for(let i=0;i<24;i++)stepEngine(s,.05,{},()=>.5);assert.ok(s.setPiece?.ready);}
test('shots aim at both corners, respond to manual aim and choose space away from keeper',()=>{const s=create(),p=s.players[9];for(const aim of [-1,1]){const t=shotTarget(s,p,.7,{aim},()=>.5);assert.ok(Math.abs(t.y-34)>4);assert.equal(Math.sign(t.y-34),aim);}s.players[11].y=29;assert.ok(shotTarget(s,p,.7,{},()=>.5).y>38);s.players[11].y=39;assert.ok(shotTarget(s,p,.7,{},()=>.5).y<30);});
test('shot aim mirrors correctly after changing ends and still allows misses',()=>{const s=create();s.endsSwitched=true;const t=shotTarget(s,s.players[9],1,{aim:-1},()=>.5);assert.ok(t.x<0);assert.ok(t.y>34);const weak={...s.players[9],x:80,stats:{sho:15}};const wide=shotTarget(s,weak,1,{aim:-1},()=>1);assert.ok(wide.y>41);});
test('offside uses ball, second-last opponent and opponents half, not simply the last defender',()=>{const s=create();placeOffside(s);assert.ok(offsidePlayers(s,s.players[1]).ids.includes('p9'));s.players[9].x=70;assert.ok(!offsidePlayers(s,s.players[1]).ids.includes('p9'));s.players[9].x=49;assert.ok(!offsidePlayers(s,s.players[1]).ids.includes('p9'));s.players[9].x=80;s.players[1].x=85;assert.ok(!offsidePlayers(s,s.players[1]).ids.includes('p9'));});
test('offside is frozen at pass time and only penalised on involvement',()=>{const s=create();placeOffside(s);kick(s,'pass',.6,{x:1},()=>.5);assert.equal(s.setPiece,null);s.players[9].x=65;assert.equal(legalTouch(s,s.players[9]),false);assert.equal(s.setPiece.kind,'indirect');assert.equal(s.setPiece.team,1);assert.equal(s.stats[0].offsides,1);assert.equal(s.score[0],0);});
test('a player onside at the pass may run beyond the defensive line to receive it',()=>{const s=create();placeOffside(s);s.players[9].x=69;snapshotOffside(s,s.players[1]);s.players[9].x=95;assert.equal(legalTouch(s,s.players[9]),true);assert.equal(s.setPiece,null);});
test('direct goal kicks, throw-ins and corners are exempt, while free kicks are not',()=>{for(const kind of ['goalKick','throwIn','corner']){const s=create();placeOffside(s);awardRestart(s,kind,0,60,34);s.setPiece.ready=true;s.owner=s.setPiece.taker;const passer=s.players[s.owner];s.players[9].x=100;s.players[9].y=60;s.players.filter(p=>p.team===1).forEach(p=>p.x=70);s.players[11].x=101;assert.ok(offsidePlayers(s,passer).ids.includes('p9'));kick(s,'pass',.6,{},()=>.5);assert.equal(s.offside,null,kind);}const s=create();placeOffside(s);snapshotOffside(s,s.players[1]);assert.ok(s.offside.ids.includes('p9'));});
test('a goalkeeper save/deflection does not erase an attacking offside snapshot',()=>{const s=create();placeOffside(s);snapshotOffside(s,s.players[1]);legalTouch(s,s.players[11],{controlled:false});assert.ok(s.offside.ids.includes('p9'));assert.equal(legalTouch(s,s.players[9]),false);});
test('last defender touch produces corner; last attacker touch produces goal kick',()=>{for(const team of [0,1]){const s=create();s.lastTouch={id:`p${team*11+2}`,team};s.ball={x:106,y:10,z:0,vx:20,vy:0,vz:0};handleBoundary(s,{x:104,y:10,z:0},()=>assert.fail('not a goal'));assert.equal(s.setPiece.kind,team===1?'corner':'goalKick');assert.equal(s.setPiece.team,team===1?0:1);}});
test('whole-ball touchline crossing awards throw-in to the opposite last-touch team',()=>{const s=create();s.lastTouch={id:'p5',team:0};s.ball={x:48,y:68.1,z:0,vx:0,vy:4,vz:0};assert.equal(handleBoundary(s,{x:48,y:67.9,z:0},()=>{}),false);s.ball.y=68.4;handleBoundary(s,{x:48,y:68.1,z:0},()=>{});assert.equal(s.setPiece.kind,'throwIn');assert.equal(s.setPiece.team,1);});
test('restart freezes movement/ball, excludes opponents, then actually restarts with a kick',()=>{const s=create();s.mode='auto';awardRestart(s,'freeKick',0,60,34);const before={...s.ball};stepEngine(s,.05,{x:1},()=>.5);assert.deepEqual(s.ball,before);assert.equal(kick(s,'shot'),false);for(let i=0;i<45;i++)stepEngine(s,.05,{},()=>.5);assert.equal(s.setPiece,null);assert.ok(s.rulesLog.some(e=>e.type==='restartTaken'));});
test('free-kick wall is outside the exclusion radius for a central free kick',()=>{const s=create();awardRestart(s,'freeKick',0,70,34);for(const p of s.players.filter(p=>p.team===1))assert.ok(Math.hypot(p.x-70,p.y-34)>=9.15);});
test('direct throw-in and indirect free kick cannot score without another touch',()=>{for(const kind of ['throwIn','indirect']){const s=create();s.lastTouch={id:'p9',team:0};s.restartTouch={id:'p9',team:0,kind};s.ball={x:106,y:34,z:0,vx:20,vy:0,vz:0};handleBoundary(s,{x:104,y:34,z:0},()=>assert.fail('illegal direct goal'));assert.equal(s.setPiece.kind,'goalKick');assert.equal(s.score[0],0);}});
test('a restart taker cannot touch the ball a second time before another player',()=>{const s=create();s.restartTouch={id:'p9',team:0,kind:'freeKick'};assert.equal(legalTouch(s,s.players[9]),false);assert.equal(s.setPiece.kind,'indirect');assert.equal(s.setPiece.team,1);});
test('posts and crossbar rebound the ball and do not create goals',()=>{const s=create();s.lastTouch={id:'p9',team:0};s.ball={x:106,y:27.05,z:0,vx:25,vy:0,vz:0};handleBoundary(s,{x:104,y:27.05,z:0},()=>assert.fail('hit post'));assert.ok(s.ball.vx<0);assert.equal(s.score[0],0);assert.equal(s.setPiece,null);});
test('careless foul outside the area is a free kick; reckless challenge gets a yellow card',()=>{const s=create(),offender=s.players[12],victim=s.players[9];victim.x=75;victim.y=34;awardFoul(s,offender,victim,{reckless:true});assert.equal(s.setPiece.kind,'freeKick');assert.equal(s.stats[1].fouls,1);assert.equal(s.discipline[offender.id].yellow,1);assert.ok(!offender.sentOff);});
test('foul inside or on penalty-area boundary awards a real penalty from eleven metres',()=>{const s=create(),offender=s.players[12],victim=s.players[9];victim.x=88.5;victim.y=34;awardFoul(s,offender,victim);assert.equal(s.setPiece.kind,'penalty');assert.equal(s.ball.x,94);assert.equal(s.ball.y,34);assert.equal(s.stats[0].penalties,1);ready(s);assert.equal(s.owner,s.setPiece.taker);kick(s,'shot',.8,{aim:-1},()=>.5);assert.equal(s.setPiece,null);assert.ok(s.penaltyInFlight);});
test('second yellow and direct red remove a player from play without deleting their identity',()=>{const s=create(),p=s.players[2];disciplinePlayer(s,p,'yellow');disciplinePlayer(s,p,'yellow');assert.ok(p.sentOff);assert.ok(s.lineup.includes(p.id));const x=p.x;stepEngine(s,.05,{x:1},()=>.5);assert.equal(p.x,x);assert.equal(s.stats[0].red,1);disciplinePlayer(s,s.players[12],'red');assert.ok(s.players[12].sentOff);});
test('dismissed players cannot be switched to or replaced through substitution',()=>{const s=create();disciplinePlayer(s,s.players[9],'red');assert.equal(queueMatchSubstitution(s,'p9',players[22]),false);assert.notEqual(s.players[s.selected].id,'p9');});
test('substitution is queued in open play and applied only at the next stoppage',()=>{const s=create();assert.ok(queueMatchSubstitution(s,'p9',players[22]));assert.equal(s.lineup[9],'p9');assert.equal(s.substitutions.length,0);awardRestart(s,'throwIn',0,40,0);stepEngine(s,.05,{},()=>.5);assert.equal(s.lineup[9],'p22');assert.equal(s.substitutions.length,1);assert.ok(s.off.includes('p9'));});
test('half-time switches ends and shooting direction for both teams',()=>{const s=create();s.time=179.99;stepEngine(s,.05,{},()=>.5);assert.ok(s.half&&s.endsSwitched);assert.equal(attackDirection(s,0),-1);s.paused=false;ready(s);const p=s.players[s.owner];assert.equal(p.team,1);kick(s,'shot',.8,{},()=>.5);assert.ok(s.ball.vx>0);});
test('lost time adds real playing time and a pending penalty delays the final whistle',()=>{const s=create();accountStoppage(s,5);s.time=179.99;stepEngine(s,.05,{},()=>.5);assert.equal(s.half,false);assert.equal(s.addedTime[0],2);s.time=187.99;stepEngine(s,.05,{},()=>.5);assert.ok(s.half);const p=create();p.half=true;p.periodStart=180;p.time=359.9;awardRestart(p,'penalty',0,95,34);assert.equal(advanceClock(p,.2),false);});
test('own goals do not increase the scorer leaderboard',()=>{const stats=addScoringEvents({},[{clubId:'you',playerId:'defender',name:'Defender',ownGoal:true}]);assert.deepEqual(stats,{});});
test('rules and cards are included in the saved match result',()=>{const s=create();awardFoul(s,s.players[12],s.players[9],{reckless:true});const result=engineResult(s);assert.equal(result.discipline.p12.yellow,1);assert.ok(result.rulesLog.some(e=>e.type==='foul'));assert.equal(result.stats[1].fouls,1);});
test('a keeper holding the ball in hands for eight seconds concedes a corner',()=>{const s=create();s.owner=0;s.selected=0;s.players[0].handling=true;s.players[0].holdTime=8;s.players[0].cooldown=10;stepEngine(s,.05,{},()=>.5);assert.equal(s.setPiece.kind,'corner');assert.equal(s.setPiece.team,1);});
test('own-goal credit follows the crossed goal line even after changing ends',()=>{const s=create();s.endsSwitched=true;s.lastTouch={id:'p2',name:'Player 2',team:0,kind:'pass'};s.last=s.lastTouch;s.ball={x:104.9,y:34,z:0,vx:40,vy:0,vz:0};stepEngine(s,.05,{},()=>.99);assert.equal(s.score[1],1);assert.ok(s.log[0].ownGoal);assert.equal(s.log[0].playerId,'p2');});
test('a complete seeded AI match finishes with finite physics, real scorers and consistent score',()=>{
 const s=create();s.mode='auto';let seed=867;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let frame=0;frame<40000&&!s.finished;frame++){if(s.paused)s.paused=false;stepEngine(s,1/60,{},rng);assert.ok(Number.isFinite(s.ball.x)&&Number.isFinite(s.ball.y));}
 assert.ok(s.finished);assert.equal(s.minute,90);assert.equal(s.score[0],s.log.filter(e=>e.home).length);assert.equal(s.score[1],s.log.filter(e=>!e.home).length);assert.ok(s.log.every(e=>s.players.some(p=>p.id===e.playerId)));assert.ok(s.rulesLog.some(e=>e.type==='restartTaken'));assert.ok(s.stats[0].shots+s.stats[1].shots>0);
});
test('a keeper may genuinely miss a reachable shot instead of making repeated automatic saves',()=>{const s=create();s.players.forEach(p=>{p.y=60;p.cooldown=0;});s.players[11].x=101;s.players[11].y=34;s.ball={x:98.5,y:34,z:0,vx:40,vy:0,vz:0};s.last={id:'p9',name:'Player 9',team:0,kind:'shot'};s.lastTouch=s.last;s.lastShot=s.last;for(let i=0;i<15&&!s.score[0];i++)stepEngine(s,1/60,{},()=>.99);assert.equal(s.score[0],1);});
import {readFile} from 'node:fs/promises';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {initialClub,formations,clubAction} from '../src/features/clubSimulator.js';
import {ensureOpponentSquads} from '../src/features/opponentSquads.js';
import {benchSlots} from '../src/features/squadBench.js';
test('3D rules, cards and own goals persist through the real league/reward transaction',async()=>{
 const catalogue=simulatorCards(normalizePlayers(JSON.parse(await readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8')))),club=initialClub(catalogue),season=ensureOpponentSquads(club.season,catalogue,'easy'),fixture=season.fixtures[0],opposition=season.squads[fixture.opponentId].lineup;
 const s=createEngine({...club,bench:benchSlots(club,catalogue)},catalogue,formations[club.formation],opposition);s.restart=0;
 const defender=s.players[12];s.lastTouch={id:defender.id,name:defender.name,team:1,kind:'pass'};s.last=s.lastTouch;s.ball={x:104.9,y:34,z:0,vx:40,vy:0,vz:0};stepEngine(s,.05,{},()=>.99);assert.ok(s.log[0].ownGoal);
 awardFoul(s,defender,s.players[9],{reckless:true});s.finished=true;s.minute=90;
 const result=clubAction({...club,season},{type:'match',liveMatch:engineResult(s)},catalogue,()=>.5);assert.equal(result.error,undefined);assert.equal(result.report.home,1);assert.equal(result.state.season.table.you.goalsFor,1);assert.equal(result.report.discipline[defender.id].yellow,1);assert.ok(result.report.rulesLog.some(e=>e.type==='foul'));assert.ok(result.state.coins>club.coins);assert.ok(!result.state.season.playerStats[`you:${defender.id}`]);
});
test('kick-off participants stay in their own halves and opponents outside the centre circle',()=>{const s=create();awardRestart(s,'kickoff',0,52.5,34);for(const [i,p] of s.players.entries()){if(i===s.setPiece.taker)continue;assert.ok(attackDirection(s,p.team)*(p.x-52.5)<=0);if(p.team===1)assert.ok(Math.hypot(p.x-52.5,p.y-34)>=9.15);}});


test('opening shape keeps teams in their own halves and countdown awards kickoff',()=>{
 const s=create();assert.ok(s.players.filter(p=>p.team===0).every(p=>p.x<52.5));assert.ok(s.players.filter(p=>p.team===1).every(p=>p.x>52.5));
 s.restart=.01;stepEngine(s,.05,{},()=>.5);assert.equal(s.setPiece.kind,'kickoff');assert.equal(s.setPiece.team,0);
});
test('winning a tackle transfers manual control and allows sprint without an instant steal-back',()=>{
 const s=create();s.players.forEach(p=>{p.x=p.team?90:10;p.y=60;});const winner=s.players[6],victim=s.players[17];
 Object.assign(winner,{x:50,y:34});Object.assign(victim,{x:51,y:34});s.owner=17;s.selected=9;
 attemptTackle(s,6,false,()=>0);assert.equal(s.owner,6);assert.equal(s.selected,6);
 attemptTackle(s,17,false,()=>0);assert.equal(s.owner,6);
 const x=winner.x;for(let i=0;i<8;i++)stepEngine(s,.05,{x:1,sprint:true},()=>.5);
 assert.ok(winner.x>x+.5);assert.equal(s.owner,6);assert.ok(winner.stamina>99);
});
test('ordinary missed standing challenges do not automatically produce free kicks',()=>{
 const s=create();s.owner=9;Object.assign(s.players[9],{x:50,y:34,vx:1,vy:0});Object.assign(s.players[12],{x:51,y:34});
 attemptTackle(s,12,false,()=>.9);assert.equal(s.setPiece,null);assert.equal(s.stats[1].fouls,0);
 s.players[12].tackleCooldown=0;attemptTackle(s,12,true,()=>.999);assert.ok(s.setPiece);assert.equal(s.stats[1].fouls,1);
});
test('through pass leads an onside teammate into space and triggers a forward run',()=>{
 const s=create();s.players.forEach(p=>{p.x=p.team?90:10;p.y=60;});Object.assign(s.players[6],{x:50,y:34});Object.assign(s.players[9],{x:65,y:34});s.owner=6;s.selected=6;
 assert.ok(kick(s,'through',.6,{x:1},()=>.5));assert.equal(s.passReceiver,'p9');assert.ok(s.players[9].runTarget.x>73);assert.ok(s.ball.vx>25);
 const x=s.players[9].x;for(let i=0;i<10;i++)stepEngine(s,.05,{},()=>.5);assert.ok(s.players[9].x>x+1);
});
test('offside assistance retreats a selected runner before the pass without restricting the ball carrier',()=>{
 const s=create();placeOffside(s);s.selected=9;s.players[1].cooldown=10;
 const x=s.players[9].x;for(let i=0;i<8;i++)stepEngine(s,.05,{x:1},()=>.5);assert.ok(s.players[9].x<x);
 s.selected=1;const carrierX=s.players[1].x;for(let i=0;i<8;i++)stepEngine(s,.05,{x:1},()=>.5);assert.ok(s.players[1].x>carrierX);
});


test('a selected keeper without movement input returns to the centre after releasing possession',()=>{
 const s=create();s.selected=0;const p=s.players[0];p.x=8;p.y=40;s.players.forEach(q=>{if(q!==p){q.x=q.team?80:30;q.y=60;}});s.ball={x:55,y:60,z:0,vx:0,vy:0,vz:0};
 const y=p.y;for(let i=0;i<12;i++)stepEngine(s,.05,{},()=>.5);assert.ok(p.y<y);assert.ok(p.x<8);
});

test('opening movement takes kickoff promptly with a straight nearby pass in either direction',()=>{
 for(const switched of [false,true]){const s=create();s.endsSwitched=switched;if(switched)s.players.forEach(p=>{p.homeX=105-p.homeX;p.homeY=68-p.homeY;});awardRestart(s,'kickoff',0,52.5,34);s.setPiece.wait=0;
 stepEngine(s,.05,{x:switched?-1:1},()=>.99);assert.equal(s.setPiece,null);assert.equal(s.owner,null);assert.equal(s.ball.y,34);assert.equal(s.ball.vy,0);assert.ok(Math.abs(s.ball.vx)>0);
 const passer=s.players[s.selected],other=s.players.find(p=>p.team===0&&p!==passer&&p.role!=='GK'&&Math.abs(p.y-34)<.15&&Math.abs(Math.abs(p.x-52.5)-4)<.15);assert.ok(other);
 for(let i=0;i<12;i++)stepEngine(s,1/60,{x:switched?-1:1},()=>.5);assert.ok(Math.hypot(passer.vx,passer.vy)>.5);
 }
});

test('first WASD press starts a fresh match and moves on the first simulation tick without NaN',()=>{
 for(const key of ['KeyW','KeyA','KeyS','KeyD']){const s=create();s.restart=1;const input=movementInput(new Set([key]),{zoom:1.12});stepEngine(s,1/60,input,()=>.5);assert.equal(s.restart,0);assert.equal(s.setPiece,null);assert.ok(Math.hypot(s.players[s.selected].vx,s.players[s.selected].vy)>0);
 for(let i=0;i<90;i++)stepEngine(s,1/60,input,()=>.5);for(const p of s.players)for(const value of [p.x,p.y,p.vx,p.vy])assert.ok(Number.isFinite(value),key);for(const value of [s.ball.x,s.ball.y,s.ball.z])assert.ok(Number.isFinite(value),key);
 }
});
