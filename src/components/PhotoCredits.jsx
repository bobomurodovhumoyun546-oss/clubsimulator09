import { useLanguage } from '../i18n/context';
export default function PhotoCredits({players}) {
  const {t}=useLanguage();
  const photos=[...new Map(players.filter(p=>p?.imageSource).map(p=>[p.imageSource,p])).values()];
  if(!photos.length)return null;
  return <details className="arcade-muted my-4 text-xs"><summary className="cursor-pointer">{t('photoCredit')}</summary><ul className="mt-2 space-y-2">{photos.map(p=><li key={p.imageSource}><a href={p.imageSource} target="_blank" rel="noreferrer" className="underline">{p.imageAuthor||'Wikimedia Commons'} · {p.imageLicense}</a></li>)}</ul></details>;
}
