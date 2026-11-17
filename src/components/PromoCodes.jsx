import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useLanguage} from '../i18n/context';
import {playFeatures} from '../data/playFeaturesCopy';
import {accountApi} from '../features/accountApi';
import './promo-codes.css';
export default function PromoCodes({userId,onGrants}){
 const {language}=useLanguage(),w=playFeatures(language),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function redeem(e){e.preventDefault();if(!userId||busy)return;setBusy(true);setMessage('');
  try{const result=await accountApi('promo/redeem',{code});onGrants([result.grant]);setCode('');setMessage('promoSuccess');}
  catch(error){const key=['promoInvalid','promoUsed','tooMany','credentials'].includes(error.code)?error.code:'promoUnavailable';setMessage(key==='credentials'?'loginRequired':key);
   if(error.code==='promoUsed'){try{const result=await accountApi('club-grants');onGrants(result.grants||[]);}catch{/* A later reload retries account grants. */}}
  }finally{setBusy(false);}
 }
 return <section className="promo-codes arcade-panel" aria-label={w.promo}><div><span className="promo-gift" aria-hidden="true">🎁</span><h2>{w.promo}</h2><p>{w.promoIntro}</p></div><form onSubmit={redeem}><label htmlFor="club-promo-code">{w.promoLabel}</label><div className="promo-form"><input id="club-promo-code" className="arcade-input" value={code} onChange={e=>setCode(e.target.value)} maxLength={40} placeholder={userId?w.promoPlaceholder:w.loginRequired} disabled={!userId||busy} autoComplete="off" autoCapitalize="characters" spellCheck={false}/><button className="arcade-button" disabled={!userId||busy||!code.trim()}>{busy?w.redeeming:w.redeem}</button></div></form>{!userId&&<p className="promo-status">{w.loginRequired} <Link to="/login">{w.login} →</Link></p>}{message&&<p className="promo-status" role="status" data-success={message==='promoSuccess'}>{w[message]||w.promoUnavailable}</p>}</section>;
}
