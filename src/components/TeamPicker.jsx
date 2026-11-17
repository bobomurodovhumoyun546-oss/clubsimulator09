import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useLanguage} from '../i18n/context';
import {teamCopy} from '../data/teamCopy';
import {teamCatalogue,starterCards} from '../features/starterCards';
import {accountApi} from '../features/accountApi';
import './team-picker.css';
export function TeamPicker({onSelect,badgeOnly=false,busy=false}){
 const {language}=useLanguage(),w=teamCopy[language]||teamCopy.en;
 const [query,setQuery]=useState(''),[type,setType]=useState('club'),[league,setLeague]=useState(''),[visible,setVisible]=useState(24),[selected,setSelected]=useState(null);
 const leagues=useMemo(()=>[...new Set(teamCatalogue.teams.filter(t=>t.type===type).map(t=>t.league))].sort(),[type]);
 const key=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 const teams=teamCatalogue.teams.filter(t=>t.type===type&&(!league||t.league===league)&&(t.name+' '+t.country).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().includes(key));
 const cards=selected?starterCards({starterTeamId:selected.id}):[];
 return <div className="team-picker"><p className="arcade-muted">{w.snapshot}</p><div className="team-picker-filters"><div>{['club','national'].map(id=><button type="button" className="arcade-button arcade-secondary" key={id} aria-pressed={type===id} onClick={()=>{setType(id);setLeague('');setVisible(24);}}>{id==='club'?w.clubs:w.national}</button>)}</div><input className="arcade-input" value={query} aria-label={w.search} placeholder={w.search} onChange={e=>{setQuery(e.target.value);setVisible(24);}}/><select className="arcade-input" aria-label={w.all} value={league} onChange={e=>{setLeague(e.target.value);setVisible(24);}}><option value="">{w.all}</option>{leagues.map(l=><option key={l}>{l}</option>)}</select></div><div className="team-picker-grid">{teams.slice(0,visible).map(team=><button type="button" key={team.id} className="team-picker-card" aria-pressed={selected?.id===team.id} onClick={()=>setSelected(team)}>{team.badge?<img src={team.badge} alt="" loading="lazy" onError={e=>{e.currentTarget.style.visibility='hidden';}}/>:<span className="team-monogram">{team.code||team.name.slice(0,3).toUpperCase()}</span>}{!team.badge&&<small>{w.badgeMissing}</small>}<strong>{team.name}</strong><small>{team.country} · {team.league}</small>{!badgeOnly&&<span>{team.roster.length}/26 · 80–90 OVR</span>}</button>)}</div>{!teams.length&&<p>{w.empty}</p>}{visible<teams.length&&<button type="button" className="arcade-button arcade-secondary" onClick={()=>setVisible(n=>n+24)}>{w.more} ({teams.length-visible})</button>}{selected&&<section className="team-picker-selected"><h3>{selected.name} · {cards.length} {w.count}</h3>{!badgeOnly&&<><p>{w.ratings}</p><ul className="team-roster">{cards.map(p=><li key={p.id}><span>{p.fullName} <small>{p.positions[0]}</small></span><strong>{p.cardOverall}</strong></li>)}</ul>{cards.length!==26&&<p role="status">{w.incomplete}</p>}</>}<a href={selected.rosterSource||selected.source} target="_blank" rel="noreferrer">{w.source} ↗ · {teamCatalogue.updatedAt.slice(0,10)}</a><button type="button" className="arcade-button" disabled={busy||(!badgeOnly&&cards.length!==26)} onClick={()=>onSelect(selected)}>{badgeOnly?w.badge:w.choose}</button></section>}</div>;
}
export default function StarterTeam({userId,club,onClub}){
 const {language}=useLanguage(),w=teamCopy[language]||teamCopy.en,[eligible,setEligible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{if(!userId||club.starterTeamId||club.played>0)return;let active=true;accountApi('starter-team').then(data=>{if(active)setEligible(data.eligible);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[userId,club.starterTeamId,club.played]);
 async function choose(team){if(busy)return;setBusy(true);setError(false);try{await accountApi('club-save',{club});const result=await accountApi('starter-team',{teamId:team.id});onClub(result.club);setEligible(false);}catch{setError(true);}finally{setBusy(false);}}
 if(club.starterTeamId||club.played>0||userId&&!eligible&&!error)return null;
 return <section className="starter-team arcade-panel"><h2>{w.title}</h2><p>{w.intro}</p>{!userId?<Link to="/login">{w.login}</Link>:<>{error&&<p role="alert">{w.error}</p>}<TeamPicker busy={busy} onSelect={choose}/></>}</section>;
}
