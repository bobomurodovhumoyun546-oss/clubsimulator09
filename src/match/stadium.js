import {project} from './rendering';
const poly=(ctx,points)=>{ctx.beginPath();points.forEach(([x,y],i)=>{const p=project(x,y);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();};
const line=(ctx,points)=>{ctx.beginPath();points.forEach(([x,y],i)=>{const p=project(x,y);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();};
function seeded(seed=1701){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function buildStadium(scene,night=false,low=false){
 const key=`stadium-${night?'night':'day'}-${low?'low':'high'}`;
 if(scene.textures.exists(key))return key;
 const texture=scene.textures.createCanvas(key,1240,700),ctx=texture.context,random=seeded();
 const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,night?'#101d32':'#758d99');sky.addColorStop(.4,'#314c48');sky.addColorStop(1,'#182f30');ctx.fillStyle=sky;ctx.fillRect(0,0,1240,700);
 // Stadium bowl: tiered seating wrapping the pitch, baked into a single texture.
 for(let tier=0;tier<3;tier++){
  ctx.fillStyle=tier%2?'#233944':'#344951';ctx.fillRect(10,20+tier*38,1220,35);
  for(let r=0;r<4;r++)for(let col=0;col<180;col++){
   const x=15+col*6.8,y=23+tier*38+r*7;
   ctx.fillStyle=['#89979a','#c1bcb1','#283b50','#5a7581','#b87756','#417db2'][Math.floor(random()*6)];ctx.globalAlpha=night?.55:.85;ctx.fillRect(x,y,3,4);ctx.fillStyle='#192d37';ctx.fillRect(x-1,y+3,5,2);
  }
  ctx.globalAlpha=1;ctx.fillStyle='#9aa9ad';ctx.fillRect(10,54+tier*38,1220,2);
 }
 for(const side of [0,1]){ctx.save();ctx.translate(side?1228:12,140);ctx.scale(side?-1:1,1);ctx.fillStyle='#233944';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(108,0);ctx.lineTo(16,480);ctx.lineTo(0,500);ctx.fill();
  for(let row=0;row<57;row++)for(let col=0;col<7;col++){const x=col*10,y=row*8;ctx.fillStyle=['#9bada7','#5a7b90','#caaf8b','#314d61'][Math.floor(random()*4)];if(x<100-y*.17)ctx.fillRect(x,y,4,4);}ctx.restore();}
 ctx.fillStyle='#436c4c';poly(ctx,[[-5,-5],[110,-5],[110,74],[-5,74]]);ctx.fill();
 // Fine grass blades and mowing patterns are precomputed, never painted every frame.
 for(let stripe=0;stripe<20;stripe++){ctx.fillStyle=stripe%2?'#337c3f':'#398646';poly(ctx,[[stripe*5.25,0],[(stripe+1)*5.25,0],[(stripe+1)*5.25,68],[stripe*5.25,68]]);ctx.fill();}
 ctx.save();poly(ctx,[[0,0],[105,0],[105,68],[0,68]]);ctx.clip();
 for(let i=0;i<(low?18000:65000);i++){const p=project(random()*105,random()*68);ctx.fillStyle=random()>.48?'rgba(174,197,97,.15)':'rgba(9,49,23,.17)';ctx.fillRect(p.x,p.y,.6+random()*1.2,1+random()*2);}
 const light=ctx.createRadialGradient(530,300,40,620,380,700);light.addColorStop(0,'rgba(191,215,133,.09)');light.addColorStop(1,'rgba(2,25,21,.25)');ctx.fillStyle=light;ctx.fillRect(0,130,1240,500);ctx.restore();
 ctx.strokeStyle='rgba(244,248,221,.88)';ctx.lineWidth=1.65;
 line(ctx,[[0,0],[105,0],[105,68],[0,68],[0,0]]);line(ctx,[[52.5,0],[52.5,68]]);
 const circle=(cx,cy,r,start=0,end=Math.PI*2)=>line(ctx,Array.from({length:65},(_,i)=>[cx+Math.cos(start+(end-start)*i/64)*r,cy+Math.sin(start+(end-start)*i/64)*r]));
 circle(52.5,34,9.15);
 for(const side of [0,105]){const dir=side? -1:1;line(ctx,[[side,13.84],[side+dir*16.5,13.84],[side+dir*16.5,54.16],[side,54.16]]);line(ctx,[[side,24.84],[side+dir*5.5,24.84],[side+dir*5.5,43.16],[side,43.16]]);circle(side+dir*11,34,9.15,side?Math.PI*.71:-Math.PI*.29,side?Math.PI*1.29:Math.PI*.29);
  const dot=project(side+dir*11,34);ctx.fillStyle='#e7ebd5';ctx.beginPath();ctx.ellipse(dot.x,dot.y,1.7,1.1,0,0,7);ctx.fill();
  for(const y of [0,68]){circle(side,y,1,side?Math.PI/2:0,side?Math.PI:Math.PI/2);const p=project(side,y);ctx.strokeStyle='#dce7d8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-15);ctx.stroke();ctx.fillStyle='#ffd95e';ctx.fillRect(p.x,p.y-15,7,4);ctx.strokeStyle='rgba(244,248,221,.88)';}
 }
 // Advertising boards outside the touchlines.
 for(const y of [-3.8,72.5])for(let i=0;i<10;i++){
  const p=project(i*10.5,y),q=project((i+1)*10.5,y);ctx.fillStyle=i%2?'#e8ecea':'#0b3045';ctx.fillRect(p.x,p.y-15,q.x-p.x-2,16);ctx.fillStyle=i%2?'#17476b':'#b5ebed';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(['CLUBSIM','THE BEAUTIFUL GAME','PLAY YOUR WAY'][i%3],(p.x+q.x)/2,p.y-4,q.x-p.x-8);
 }
 // Front rail and concrete access tunnel.
 ctx.fillStyle='#182c35';ctx.fillRect(0,632,1240,68);ctx.fillStyle='#51636a';ctx.fillRect(0,634,1240,3);ctx.fillStyle='#071d28';ctx.fillRect(555,636,130,64);ctx.fillStyle='#a6b4b0';ctx.font='bold 12px Arial';ctx.fillText('CLUBSIM ARENA',620,658);
 if(night){ctx.fillStyle='rgba(8,20,39,.14)';ctx.fillRect(0,0,1240,700);}
 texture.refresh();return key;
}
export function makeShadow(scene){if(scene.textures.exists('soft-shadow'))return;const t=scene.textures.createCanvas('soft-shadow',64,32),ctx=t.context,g=ctx.createRadialGradient(32,16,1,32,16,28);g.addColorStop(0,'rgba(3,19,16,.4)');g.addColorStop(.5,'rgba(3,19,16,.18)');g.addColorStop(1,'rgba(3,19,16,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,32);t.refresh();}
export function buildGoals(scene){
 return [0,105].map(side=>{const g=scene.add.graphics(),dir=side?1:-1,near=project(side,41),far=project(side,27),backNear=project(side+dir*3.3,41),backFar=project(side+dir*3.3,27),height=23;
  g.fillStyle(0xdef2f5,.08);g.fillPoints([{x:far.x,y:far.y-height},{x:backFar.x,y:backFar.y-height+5},{x:backNear.x,y:backNear.y-height+5},{x:near.x,y:near.y-height}],true);
  const segment=(a,b,color=0xcbdde0,alpha=.43,width=.65)=>{g.lineStyle(width,color,alpha);g.lineBetween(a.x,a.y,b.x,b.y);};
  for(let i=0;i<=16;i++){const f=i/16,a={x:far.x+(near.x-far.x)*f,y:far.y+(near.y-far.y)*f},b={x:backFar.x+(backNear.x-backFar.x)*f,y:backFar.y+(backNear.y-backFar.y)*f};segment({...a,y:a.y-height},{...b,y:b.y-height+5});segment({...b,y:b.y-height+5},b);}
  for(let j=0;j<=6;j++){const h=j/6*height;segment({x:backFar.x,y:backFar.y-h},{x:backNear.x,y:backNear.y-h});segment({x:near.x,y:near.y-h},{x:backNear.x,y:backNear.y-h});}
  for(const p of [near,far]){segment(p,{x:p.x,y:p.y-height},0xffffff,1,3);}
  segment({x:far.x,y:far.y-height},{x:near.x,y:near.y-height},0xffffff,1,3);segment({x:near.x,y:near.y-height},{x:backNear.x,y:backNear.y-height+5},0xc2d2d8,.8,2);
  g.setDepth(near.y+3);return g;
 });
}
