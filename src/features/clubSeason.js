import {addScoringEvents} from './seasonScorers.js';
export const leagueTeams=['Metro FC','Royal Athletic','North Stars','Ocean City','Phoenix United','Valley Rovers','Summit FC','Eastside','Capital XI'];
const empty=()=>({played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0});
function calendar(opponents){
 const rotation=['you',...opponents.map(p=>p.id)];if(rotation.length%2)rotation.push(null);
 const first=[];
 for(let round=0;round<rotation.length-1;round++){
  const matches=[];
  for(let i=0;i<rotation.length/2;i++){
   const a=rotation[i],b=rotation[rotation.length-1-i];
   if(a&&b)matches.push(round%2?{homeId:b,awayId:a}:{homeId:a,awayId:b});
  }
  first.push(matches);rotation.splice(1,0,rotation.pop());
 }
 const rounds=[...first,...first.map(matches=>matches.map(m=>({homeId:m.awayId,awayId:m.homeId})))];
 const fixtures=[],otherFixtures=[];
 for(const matches of rounds)for(const match of matches){
  if(match.homeId==='you'||match.awayId==='you')fixtures.push({opponentId:match.homeId==='you'?match.awayId:match.homeId,venue:match.homeId==='you'?'home':'away'});
  else otherFixtures.push(match);
 }
 return {fixtures,otherFixtures};
}
export function createSeason(number=1,members=[]){
 const opponents=[...leagueTeams.map((name,i)=>({id:`ai-${i}`,name,ai:true})),...members];
 const unique=[...new Map(opponents.filter(p=>p?.id&&p.name&&p.id!=='you').map(p=>[p.id,p])).values()];
 return {number,opponents:unique,played:0,complete:false,playerStats:{},
  ...calendar(unique),
  table:Object.fromEntries(['you',...unique.map(p=>p.id)].map(id=>[id,empty()]))};
}
export function currentSeason(club){
 // Legacy ten-match seasons remain in lifetime totals; start a clean two-leg calendar.
 return club.season||createSeason(Math.floor((club.played||0)/10)+1,club.leagueMembers||[]);
}
export function addSeasonMembers(season,members){
 const known=new Set(season.opponents.map(p=>p.id));
 const added=[...new Map(members.filter(p=>p?.id&&p.name&&!known.has(p.id)&&p.id!=='you').map(p=>[p.id,p])).values()];
 if(!added.length||season.complete)return season;
 const next={...season,opponents:[...season.opponents],fixtures:[...season.fixtures],otherFixtures:[...season.otherFixtures],table:{...season.table}};
 for(const member of added){
  next.otherFixtures.push(...next.opponents.flatMap(p=>[{homeId:member.id,awayId:p.id},{homeId:p.id,awayId:member.id}]));
  next.opponents.push(member);next.table[member.id]=empty();
  next.fixtures.push({opponentId:member.id,venue:'home'},{opponentId:member.id,venue:'away'});
 }
 return next;
}
export function seasonForMatch(club){const season=currentSeason(club);return season.complete?createSeason(season.number+1,club.leagueMembers||[]):season;}
export function seasonRows(season,name){
 const names=new Map([['you',{name}],...season.opponents.map(p=>[p.id,p])]);
 return Object.entries(season.table).map(([id,stats])=>({id,...names.get(id),...stats,points:stats.wins*3+stats.draws,goalDifference:stats.goalsFor-stats.goalsAgainst})).sort((a,b)=>b.points-a.points||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor||a.name.localeCompare(b.name));
}
export function recordSeasonMatch(season,ownGoals,opponentGoals,simulateOther,events=[]){
 const next={...season,scoringFromMatch:season.scoringFromMatch??(season.playerStats?1:season.played+1),table:structuredClone(season.table),otherFixtures:[...season.otherFixtures],playerStats:addScoringEvents(season.playerStats,events)};
 const fixture=season.fixtures[season.played];
 const record=(id,scored,conceded)=>{const row=next.table[id];row.played++;row.wins+=Number(scored>conceded);row.draws+=Number(scored===conceded);row.losses+=Number(scored<conceded);row.goalsFor+=scored;row.goalsAgainst+=conceded;};
 record('you',ownGoals,opponentGoals);record(fixture.opponentId,opponentGoals,ownGoals);
 // Complete every other ordered pairing too; every club finishes with 2*(N-1) games.
 const count=Math.ceil(next.otherFixtures.length/(season.fixtures.length-season.played));
 for(const match of next.otherFixtures.splice(0,count)){const score=simulateOther(match);record(match.homeId,score.home,score.away);record(match.awayId,score.away,score.home);next.playerStats=addScoringEvents(next.playerStats,score.events||[]);}
 next.played++;next.complete=next.played===next.fixtures.length;
 return next;
}
