import {useRef,useState} from 'react';
import {Download,Upload,Cloud,HardDrive} from 'lucide-react';
import {useLanguage} from '../i18n/context';
import {exportClub,restoreClub} from './saveGame';
import {gameCopy} from './copy';
export default function SaveTools({club,players,onImport,status,userId}){
 const {language}=useLanguage(),w=gameCopy[language]||gameCopy.en,ref=useRef(null),[message,setMessage]=useState('');
 function download(){const url=URL.createObjectURL(new Blob([exportClub(club)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`club-simulator-${club.name.replace(/[^a-z0-9]/gi,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function upload(e){const file=e.target.files?.[0];if(!file)return;try{if(file.size>4*1024*1024)throw Error('invalidSave');const restored=restoreClub(JSON.parse(await file.text()),players);onImport(restored);setMessage('imported');}catch{setMessage('invalidSave');}finally{e.target.value='';}}
 return <><div className="game-save-bar"><span className="game-save-status"><span/>{userId?<Cloud size={13}/>:<HardDrive size={13}/>} {w[status]||w.local}</span><div className="game-save-tools"><button onClick={download}><Download size={13}/>{w.export}</button><button onClick={()=>ref.current?.click()}><Upload size={13}/>{w.import}</button><input type="file" accept="application/json,.json" ref={ref} hidden onChange={upload}/></div></div>{message&&<p className="game-save-message" role="status">{w[message]}</p>}</>;
}
