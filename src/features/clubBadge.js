// One outline definition for the editor, kit SVG and 3D shirt decal.
const paths={
 circle:'M152 85a72 72 0 1 0-144 0a72 72 0 1 0 144 0Z',
 diamond:'M80 6 153 85 80 172 7 85Z',
 hexagon:'M80 5 147 43 147 130 80 171 13 130 13 43Z',
 rounded:'M29 8H131Q150 8 150 28V130Q150 158 80 173 10 158 10 130V28Q10 8 29 8Z',
 shield:'M15 15Q80 0 145 15L138 105Q125 150 80 172 35 150 22 105Z',
};
export const badgePath=shape=>paths[shape]||paths.shield;
export function drawKitBadge(ctx,club,x=84,y=0,size=24,Path=globalThis.Path2D){
 const initials=club.badgeInitials||club.symbol||'FC',accent=club.badgeAccent||club.secondary||'#ffffff',text=club.badgeTextColor||'#fff6df';
 // Non-browser render tests and older canvases still retain the club initials.
 if(!Path){ctx.fillStyle=text;ctx.fillText(initials,x+size/2,y+size*.65);return;}
 ctx.save();ctx.translate(x,y);ctx.scale(size/160,size/160);const outline=new Path(badgePath(club.shape));
 ctx.fillStyle=club.primary||'#1963c3';ctx.fill(outline);ctx.save();ctx.clip(outline);ctx.fillStyle=club.secondary||'#f1f0df';
 if(club.badgeStyle==='split')ctx.fillRect(80,0,80,180);
 else if(club.badgeStyle==='stripes')for(let i=0;i<4;i++)ctx.fillRect(15+i*40,0,17,180);
 else if(club.badgeStyle==='diagonal')ctx.fill(new Path('M-30 170 0 200 190 10 160-20Z'));
 else{const gradient=ctx.createLinearGradient(0,0,160,180);gradient.addColorStop(0,club.primary||'#1963c3');gradient.addColorStop(1,club.secondary||'#f1f0df');ctx.fillStyle=gradient;ctx.fillRect(0,0,160,180);}
 ctx.restore();ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.stroke(outline);
 if(club.badgeCrown!==false){ctx.fillStyle=accent;ctx.fill(new Path('M57 35 67 42 80 26 93 42 103 35 98 54H62Z'));}
 ctx.fillStyle=text;ctx.textAlign='center';ctx.font='bold 35px Arial';ctx.fillText(initials,80,club.badgeCrown===false?91:102);
 ctx.font='bold 11px Arial';ctx.fillText((club.badgeText||club.name||'').slice(0,17).toUpperCase(),80,136);
 if(club.foundedYear){ctx.font='bold 7px Arial';ctx.fillText('EST. '+club.foundedYear,80,154);}
 ctx.fillStyle=accent;ctx.font='bold 11px Arial';const stars=Math.min(3,club.badgeStars||0);for(let i=0;i<stars;i++)ctx.fillText('\u2605',80+(i-(stars-1)/2)*17,21);
 ctx.restore();
}
