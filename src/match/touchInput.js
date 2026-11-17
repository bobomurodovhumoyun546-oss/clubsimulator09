export function joystickVector(dx,dy,radius=48){
 const distance=Math.hypot(dx,dy);
 if(!Number.isFinite(distance)||!Number.isFinite(radius)||radius<=0||distance<radius*.12)return {x:0,y:0};
 const scale=Math.min(1,distance/radius)/distance;
 return {x:dx*scale,y:dy*scale};
}
