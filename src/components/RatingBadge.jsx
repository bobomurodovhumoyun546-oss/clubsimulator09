import {siteText} from '../data/siteCopy';
import { useLanguage } from '../i18n/context';
import {ratingInfo,ratingTier,playerOVR} from '../features/playerRatings';
export default function RatingBadge({player,training=0,compact=false}){
 const {t,language}=useLanguage(),u=siteText(language),info=ratingInfo(player),rating=playerOVR(player,training);
 return <span className={`rating-badge ${compact?'rating-badge--compact':''}`} data-tier={ratingTier(rating)} title={t(`rating_${info.type}`)}><strong>{rating}</strong><small>{player.cardEdition==='rivalsLegacy'?u.archive:player.cardEdition==='rivals'?'RIVALS':player.cardEdition==='ballondor'?'BDOR':player.cardEdition==='normal'?u.base:u.prime}</small></span>;
}
