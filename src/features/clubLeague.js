import {leagueTeams,currentSeason,addSeasonMembers,seasonRows} from './clubSeason.js';
export {leagueTeams};
export function clubRecord(club){
 const season=currentSeason(club);return {name:club.name,season:season.number,...season.table.you};
}
export function leagueStandings(clubs,local,userId){
 const members=clubs.filter(c=>c.id!==(userId||'guest')).map(({id,name,owner})=>({id,name,owner}));
 return seasonRows(addSeasonMembers(currentSeason(local),members),local.name).map(row=>row.id==='you'?{...row,id:userId||'guest'}:row);
}
