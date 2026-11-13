import {useLanguage} from '../i18n/context';
import {playerAttributes} from '../features/playerRatings';
export default function PlayerAttributes({player,training=0,compact=false}){
 const {t}=useLanguage(),stats=playerAttributes(player,training);
 return <div className={`player-attributes ${compact?'player-attributes--compact':''}`}><dl aria-label={t(stats.goalkeeper?'goalkeeperAttributes':'playerAttributes')} className="player-attributes__grid">{Object.entries(stats.values).map(([key,value])=><div key={key}><dd>{stats.estimated&&<span className="stat-estimated" aria-hidden="true">≈</span>}{value}</dd><dt><abbr title={t(`stat_${key}`)}>{key.toUpperCase()}</abbr></dt></div>)}</dl>{!compact&&<p className="player-attributes__note">{stats.estimated?t('attributesEstimated'):t('attributesFC27')}</p>}</div>;
}
