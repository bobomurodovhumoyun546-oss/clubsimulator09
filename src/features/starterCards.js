import teamData from '../data/teamCatalogue.json' with {type:'json'};
import starterData from '../data/starterPlayers.json' with {type:'json'};
export const teamCatalogue=teamData;
export const teamById=new Map(teamData.teams.map(t=>[t.id,t]));
export function starterCards(club){const team=teamById.get(club?.starterTeamId);return team?team.roster.map(id=>starterData[id]).filter(Boolean):[];}
export function teamIdentity(team){return {name:team.name.slice(0,24),badgeTeamId:team.id,primary:team.primary,secondary:team.secondary,pattern:'solid'};}

export function ownedStarterCards(club){return (club?.owned||[]).map(id=>starterData[id]).filter(Boolean);}
