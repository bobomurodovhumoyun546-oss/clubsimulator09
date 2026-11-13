import {useLanguage} from '../i18n/context';
import {scoringLeaders} from '../features/seasonScorers';
export default function ScoringLeaders({season}){
 const {t}=useLanguage();
 return <>{season.scoringFromMatch>1&&<p className="arcade-muted mt-5 text-xs">{t('scoringSince',{round:season.scoringFromMatch})}</p>}<div className="scoring-leaders">{['goals','assists'].map(field=>{const rows=scoringLeaders(season,field);return <section className="arcade-card" key={field}><h3 className="mb-4 text-lg font-black">{t(field==='goals'?'topScorers':'topAssists')}</h3>{rows.length?<ol>{rows.slice(0,20).map((row,i)=><li className="scoring-leader" key={`${row.clubId}:${row.playerId}`}><span className="arcade-muted">{i+1}</span><div><strong>{row.name}</strong><small className="arcade-muted">{row.clubName}</small></div><b>{row[field]}</b></li>)}</ol>:<p className="arcade-muted text-sm">{t('noScoringStats')}</p>}</section>;})}</div></>;
}
