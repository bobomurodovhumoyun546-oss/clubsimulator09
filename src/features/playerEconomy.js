import {playerOVR,playerAttributes} from './playerRatings.js';
import {normalizeAnswer} from '../lib/gameEngine.js';
import {rivalsEvent} from '../data/rivalsEvent.js';
import {ballonEvent} from '../data/ballonEvent.js';
export const marketTopOVR=Math.max(100,...ballonEvent.map(p=>p.overall),...rivalsEvent.map(p=>p.overall));
const fame=new Map([
 ['Jean-Pierre Papin',.7],['Lionel Messi',1],['Cristiano Ronaldo',.99],['Pel\u00e9',1],['Diego Maradona',.97],['Ronaldinho',.96],['Ronaldo Naz\u00e1rio',.95],['Zinedine Zidane',.94],['Johan Cruyff',.93],['Neymar Jr.',.92],['Thierry Henry',.91],['Robert Lewandowski',.89],['Kylian Mbapp\u00e9',.88],['Erling Haaland',.87],['Kak\u00e1',.86],['Mohamed Salah',.85],['Franz Beckenbauer',.84],['Paolo Maldini',.83],['Gianluigi Buffon',.82],['Manuel Neuer',.81],['Marco van Basten',.8],['Roberto Carlos',.79],['Luka Modri\u0107',.78],['Andr\u00e9s Iniesta',.77],['Xavi Hern\u00e1ndez',.76],
].map(([name,value])=>[normalizeAnswer(name),value]));
export function priceBand(rating,top=marketTopOVR){
 if(rating>=top)return [150000,170000];
 if(rating===top-1)return [120000,135000];
 if(rating===top-2)return [90000,110000];
 if(rating===top-3)return [60000,75000];
 if(rating===top-4)return [35000,50000];
 if(rating>=95)return [15000,20000];
 const low=Math.max(200,Math.round(Math.max(1,rating-45)**2*5/100)*100);
 return [low,Math.min(14900,Math.round(low*1.18/100)*100)];
}
function stature(player){
 const name=normalizeAnswer(player.fullName),seed=[...name].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
 const named=fame.get(name),ability=Object.values(playerAttributes(player).values).reduce((n,v)=>n+v,0)/600;
 return Math.min(1,Math.max(0,(named??(.12+(seed%350)/1000))*.76+ability*.08+(player.ballonWinner ? .16 : 0)+(playerOVR(player)>=95&&playerOVR(player)<=100?(playerOVR(player)-95)*.025:0)));
}
export function playerPrice(player){
 const [min,max]=priceBand(playerOVR(player));
 return Math.min(max,Math.max(min,Math.round((min+(max-min)*stature(player))/100)*100));
}
export function resaleValue(player,training=0){
 const [min,max]=priceBand(playerOVR(player,training));
 return Math.round((min+max)*.3/100)*100;
}
// Resale is shared by all cards of an OVR, including copies and old pack purchases.
export function sellPrice(club,player){return resaleValue(player,club.training?.[player.id]||0);}
