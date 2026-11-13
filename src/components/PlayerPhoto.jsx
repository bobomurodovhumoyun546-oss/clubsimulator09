import { useState } from 'react';
import { UserRound } from 'lucide-react';
export default function PlayerPhoto({player,className=''}) {
  const [failed,setFailed]=useState(false);
  return <div className={`player-photo ${className}`} data-portrait-style={player.portraitStyle||'photo'}>
    {player.image&&!failed?<img src={player.image} alt={player.fullName} loading="lazy" decoding="async" style={player.portraitZoom>1?{transform:`scale(${player.portraitZoom})`,transformOrigin:'center 8%'}:undefined} onError={()=>setFailed(true)}/>:<div className="player-photo__empty"><UserRound size={40}/><span>{player.fullName.split(' ').map(word=>word[0]).slice(0,2).join('')}</span></div>}
  </div>;
}
