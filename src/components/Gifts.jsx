import {useCallback,useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useLanguage} from '../i18n/context';
import {giftsCopy,donationPackages} from '../data/giftsCopy';
import {accountApi} from '../features/accountApi';
import './gifts.css';
export default function Gifts({userId,onGrants}){
 const {language}=useLanguage(),w=giftsCopy[language]||giftsCopy.en;
 const [gifts,setGifts]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const load=useCallback(async()=>{if(!userId)return;try{const result=await accountApi('gifts');setGifts(result.gifts);setError(false);}catch{setError(true);}},[userId]);
 useEffect(()=>{if(!userId)return;let active=true;const refresh=async()=>{try{const result=await accountApi('gifts');if(active){setGifts(result.gifts);setError(false);}}catch{if(active)setError(true);}};void refresh();const interval=setInterval(refresh,60000);return()=>{active=false;clearInterval(interval);};},[userId]);
 async function claim(kind){if(busy||!userId)return;setBusy(true);setError(false);try{const result=await accountApi('gifts/claim',{kind});onGrants([result.grant]);}catch(e){if(e.code==='giftClaimed'){try{const result=await accountApi('club-grants');onGrants(result.grants||[]);}catch{setError(true);}}else setError(true);}finally{await load();setBusy(false);}}
 return <><section className="club-gifts arcade-panel" aria-label={w.title}><h2>🎁 {w.title}</h2><p className="arcade-muted">{w.timezone}</p>{!userId?<Link to="/login">{w.login}</Link>:<><div className="gift-grid">{['welcome','daily','thursday'].map(kind=>{const gift=gifts.find(g=>g.kind===kind);return <article className="gift-tile" key={kind}><h3>{w[kind]}</h3><strong>+{({welcome:50000,daily:10000,thursday:60000}[kind]).toLocaleString()} {w.coins}</strong><button className="arcade-button" disabled={busy||!gift||gift.claimed||!gift.available} onClick={()=>claim(kind)}>{gift?.claimed?w.claimed:gift&&!gift.available?w.wait:w.claim}</button></article>;})}</div><button className="arcade-button arcade-secondary" disabled={busy} onClick={load}>{w.refresh}</button></>}{error&&<p role="alert">{w.error}</p>}</section><section className="club-gifts arcade-panel" aria-label={w.donate}><h2>💎 {w.donate}</h2><div className="gift-grid donation-grid">{donationPackages.map(pack=><article className="gift-tile" key={pack.price}><strong>{pack.coins.toLocaleString()} {w.coins}</strong><span>{pack.price.toLocaleString()} {w.currency}</span></article>)}</div><p className="donation-note">{w.note}</p><p className="arcade-muted">{w.manual}</p></section></>;
}
