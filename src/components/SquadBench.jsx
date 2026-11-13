import PlayerPhoto from './PlayerPhoto';
import {playerOVR} from '../features/playerRatings';
import {fitsSlot} from '../features/clubSimulator';
import {benchCopy} from '../data/benchCopy';
export default function SquadBench({ids,lookup,club,language,selected,setSelected,onDetails,onAction,role,lineupSlot,t}){
 const w=benchCopy[language]||benchCopy.en;
 return <section className="squad-bench"><header><h3>{w.title}</h3><span>{ids.filter(Boolean).length} / 7</span></header><p className="arcade-muted text-xs mb-3">{w.hint}</p><div className="squad-bench__slots">{ids.map((id,i)=>{const p=lookup.get(id);return <article key={i} className="squad-bench__slot" data-selected={selected===i}><button className="squad-bench__player" aria-pressed={selected===i} onClick={()=>setSelected(i)} onDoubleClick={()=>p&&onDetails(p)} onKeyDown={e=>{if(e.key==='Enter'&&p)onDetails(p);}}><span className="squad-bench__number">{i+1}</span>{p?<><PlayerPhoto player={p}/><strong>{p.fullName}</strong><small>{p.positions.join('/')} · {playerOVR(p,club.training[p.id]||0)}</small></>:<><span className="squad-bench__empty">＋</span><small>{w.empty}</small></>}</button>{p&&<div className="squad-bench__actions"><button className="sim-small-button" disabled={!fitsSlot(p,role)} onClick={()=>onAction({type:'lineup',id:p.id,slot:lineupSlot})}>{t('lineup')}</button><button className="sim-small-button" aria-label={`${w.remove}: ${p.fullName}`} onClick={()=>onAction({type:'bench',id:null,slot:i})}>×</button></div>}</article>;})}</div></section>;
}
