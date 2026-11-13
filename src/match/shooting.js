import {attackDirection,active} from './rules.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function shotTarget(state,player,power,input={},random=Math.random){
 const dir=attackDirection(state,player.team),keeper=state.players.find(p=>active(p)&&p.team!==player.team&&p.role==='GK'),quality=(player.stats.sho||player.ovr)*.6+player.ovr*.4;
 let side;
 if(input.aim===-1||input.aim===1)side=input.aim*dir;
 else if(Math.abs(input.y||0)>.25)side=Math.sign(input.y);
 else if(keeper&&Math.abs(keeper.y-34)>.6)side=keeper.y>34?-1:1;
 else side=random()<.5?-1:1;
 const x=dir>0?105.8:-.8,distance=Math.abs(x-player.x),placement=4.5+quality*.009;
 const spread=(100-quality)*.045+Math.max(0,distance-25)*.026+Math.max(0,power-.9)*4;
 return {x,y:34+side*placement+(random()-.5)*spread,side,power:clamp(power,.1,1)};
}
