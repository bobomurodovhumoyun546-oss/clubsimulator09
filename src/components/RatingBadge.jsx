import { useLanguage } from '../i18n/context';
import {ratingInfo,ratingTier,playerOVR} from '../features/playerRatings';
export default function RatingBadge({player,training=0,compact=false}){
 const {t}=useLanguage(),info=ratingInfo(player),rating=playerOVR(player,training);
 return <span className={`rating-badge ${compact?'rating-badge--compact':''}`} data-tier={ratingTier(rating)} title={t(`rating_${info.type}`)}><strong>{rating}</strong><small>{player.cardEdition==='rivalsLegacy'?'ARCHIVE':player.cardEdition==='rivals'?'RIVALS':player.cardEdition==='ballondor'?'BDOR':player.cardEdition==='normal'?'BASE':'PRIME'}</small></span>;
}
