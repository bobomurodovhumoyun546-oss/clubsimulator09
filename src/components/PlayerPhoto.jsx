import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { playerPortrait } from '../features/playerPortrait.js';
export default function PlayerPhoto({player,className=''}) {
  const [failedImage,setFailedImage]=useState(null);
  const image=playerPortrait(player.image);
  return <div className={`player-photo ${className}`} data-portrait-style={player.portraitStyle||'photo'}>
    {image&&failedImage!==image?<img src={image} alt={player.fullName} loading="lazy" decoding="async" style={player.portraitZoom>1?{transform:`scale(${player.portraitZoom})`,transformOrigin:'center 8%'}:undefined} onError={()=>setFailedImage(image)}/>:<div className="player-photo__empty"><UserRound size={40}/><span>{player.fullName.split(' ').map(word=>word[0]).slice(0,2).join('')}</span></div>}
  </div>;
}
