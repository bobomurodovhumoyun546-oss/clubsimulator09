import {squadOvrTier} from '../features/squadOvrTier';
import './squad-ovr.css';
export default function SquadOvr({overall,label}){return <div className="squad-ovr" data-tier={squadOvrTier(overall)} aria-label={`${label} OVR ${overall}`}><span>OVR</span><strong>{overall}</strong></div>;}
