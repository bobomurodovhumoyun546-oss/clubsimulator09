import {playerOVR} from './playerRatings.js';
import {ownsCard,awardCard} from './cardInventory.js';
export const simulatorPacks=[
 {id:'rivals95',minimum:95,price:35000,event:'rivals'},
 {id:'rivals100',minimum:100,price:75000,event:'rivals'},
 {id:'rivals102',minimum:102,price:95000,event:'rivals'},
 {id:'rivals103',minimum:103,price:115000,event:'rivals'},
 {id:'rivals',minimum:104,price:140000,event:'rivals'},
 {id:'50',minimum:50,price:1000},{id:'60',minimum:60,price:4000},{id:'70',minimum:70,price:6000},{id:'80',minimum:80,price:10000},
 {id:'85',minimum:85,price:20000},{id:'90',minimum:90,price:50000},{id:'95',minimum:95,price:65000},{id:'97',minimum:97,price:110000},
 {id:'ballon',minimum:95,price:35000,event:true},{id:'ballon100',minimum:100,price:75000,event:true},{id:'ballon103',minimum:103,price:115000,event:true},
 {id:'88',minimum:88,price:30000},{id:'92',minimum:92,price:55000},{id:'ballon102',minimum:102,price:95000,event:true},
];
export function packOdds(pack){
 const tier=(min,max,weight,legendary=false,event=false)=>({min,max,weight,legendary,event});
 if(pack.event==='rivals'&&pack.minimum>=104)return [tier(104,104,70,false,true),tier(105,105,30,false,true)];
 if(pack.event){
  if(pack.minimum>=103)return [tier(103,103,70,false,true),tier(104,104,25,false,true),tier(105,105,5,false,true)];
  if(pack.minimum===102)return [tier(102,102,70,false,true),tier(103,104,25,false,true),tier(105,105,5,false,true)];
  if(pack.minimum>=100)return [tier(100,102,70,false,true),tier(103,104,25,false,true),tier(105,105,5,false,true)];
  return [tier(95,99,60,false,true),tier(100,102,25,false,true),tier(103,104,12,false,true),tier(105,105,3,false,true)];
 }
 if(!pack.event&&pack.minimum>=97)return [tier(97,98,85,true),tier(99,99,12,true),tier(100,100,3,true)];
 if(!pack.event&&pack.minimum>=95)return [tier(95,96,70,true),tier(97,98,20,true),tier(99,99,8,true),tier(100,100,2,true)];
 const multiplier=pack.minimum>=90?3:1;
 const normal=pack.minimum>=90?[tier(pack.minimum,94,85)]:pack.minimum>=85?[tier(pack.minimum,89,70),tier(90,94,25)]:[tier(pack.minimum,84,70),tier(85,89,20),tier(90,94,5)];
 return [...normal,tier(95,96,3.5*multiplier,true),tier(97,98,1*multiplier,true),tier(99,99,.4*multiplier,true),tier(100,100,.1*multiplier,true)];
}
export function packPools(pack,players){
 return packOdds(pack).map(tier=>({...tier,players:players.filter(p=>!p.copyOf&&p.image&&p.positions.length&&p.cardEdition===(tier.event?(pack.event==='rivals'?'rivals':'ballondor'):tier.legendary?'legendary':'normal')&&playerOVR(p)>=tier.min&&playerOVR(p)<=tier.max)}));
}
export const packPending=pack=>pack&&(pack.selectionRequired?!Number.isInteger(pack.selectedIndex):pack.cards.some(c=>!c.revealed));
export function openSimulatorPack(club,packId,players,random=Math.random){
 const pack=simulatorPacks.find(p=>p.id===packId);
 if(!pack)return {state:club,error:'locked'};
 if(packPending(club.lastPack))return {state:club,error:'locked'};
 if(club.coins<pack.price)return {state:club,error:'notEnoughCoins'};
 const pools=packPools(pack,players);
 if(pools.some(tier=>!tier.players.length))return {state:club,error:'noPlayers'};
 const cards=[],drawn=new Set();
 for(let i=0;i<5;i++){
  let roll=Math.max(0,Math.min(1-Number.EPSILON,random()))*100;
  const tier=pools.find(t=>{roll-=t.weight;return roll<0;})||pools.at(-1);
  const candidates=tier.players.filter(p=>!drawn.has(p.basePlayerId||p.id)),pool=candidates.length?candidates:tier.players;
  const player=pool[Math.min(pool.length-1,Math.floor(Math.max(0,random())*pool.length))];drawn.add(player.basePlayerId||player.id);
  cards.push({playerId:player.id,duplicate:ownsCard(club,player.id),compensation:0,revealed:false});
 }
 return {state:{...club,coins:club.coins-pack.price,lastPack:{packId,price:pack.price,cards,selectionRequired:true,selectedIndex:null}}};
}
export function choosePackPlayer(club,index,players){
 const pack=club.lastPack;
 if(!pack?.selectionRequired||Number.isInteger(pack.selectedIndex)||pack.cards.some(c=>!c.revealed)||!Number.isInteger(index)||!pack.cards[index])return {state:club,error:'locked'};
 const player=players.find(p=>p.id===pack.cards[index].playerId);if(!player)return {state:club,error:'noPlayers'};
 const awarded=awardCard(club,player);
 return {state:{...awarded.state,lastPack:{...pack,selectedIndex:index,cards:pack.cards.map((c,i)=>i===index?{...c,duplicate:awarded.duplicate,compensation:0,awardedId:awarded.awardedId}:c)}}};
}
