export const celebrationDuration=3.6;
export function celebrationActive(state){return Boolean(state.celebration&&state.celebration.remaining>0);}
export function advanceCelebration(state,dt){
 if(!celebrationActive(state))return false;
 state.celebration.remaining=Math.max(0,state.celebration.remaining-Math.min(.1,Math.max(0,dt)));
 if(!state.celebration.remaining)state.celebration=null;
 return true;
}
export function celebrationStyle(id){
 let hash=0;for(const c of String(id))hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
 return ['arms','jump','dance','salute'][hash%4];
}
