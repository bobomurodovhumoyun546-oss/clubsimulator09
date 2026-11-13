// Rendering coordinates only. Football simulation continues in its 105 x 68 metre world.
export const VIEW={width:1240,height:700};
export function project(x,y){const scale=8.6+y*.027;return {x:620+(x-52.5)*scale,y:180+y*5.5,scale:.38+y*.0018};}
export function facingFromVelocity(vx,vy,fallback=0){
 if(Math.hypot(vx,vy)<.3)return fallback;
 return (Math.round(Math.atan2(vy*5.5,vx*9.5)/(Math.PI/4))+8)%8;
}
export function animationPose(player,clock,previous={}){
 const speed=Math.hypot(player.vx,player.vy),active=player.visual?.until>clock,facing=facingFromVelocity(active?(player.visual.vx||0):player.vx,active?(player.visual.vy||0):player.vy,previous.facing??(player.team?4:0));
 const action=player.visual?.until>clock?player.visual.kind:null;
 let state=action||(speed<.35?'idle':speed<3.2?'walk':speed>8?'sprint':'run');
 if(!action&&speed>.35&&previous.facing!==undefined&&facing!==previous.facing)state='turn';
 const cycle=Math.floor(clock*(state==='sprint'?15:state==='walk'?6:10))%4;
 const rows={idle:0,walk:cycle%2?1:0,run:2+cycle,sprint:2+cycle,turn:1,pass:6,shoot:7,tackle:6,slide:8,celebrate:9,dive:10,catch:11};
 return {state,facing,frame:(rows[state]??0)*8+facing,speed};
}
// Deterministic placement, prioritising the selected footballer. Labels never overwrite each other.
export function arrangeLabels(labels){
 const placed=[];
 return [...labels].sort((a,b)=>Number(Boolean(b.selected))-Number(Boolean(a.selected))||a.y-b.y).map(label=>{
  let y=label.y;const height=16;
  for(let attempt=0;attempt<24;attempt++){
   if(!placed.some(p=>Math.abs(p.x-label.x)<(p.width+label.width)/2+5&&Math.abs(p.y-y)<height)){break;}
   y-=height;
  }
  const result={...label,y};placed.push(result);return result;
 });
}
