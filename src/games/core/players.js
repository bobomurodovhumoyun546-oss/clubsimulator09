import { normalizeAnswer } from '../../lib/gameEngine.js';
import { players as portraits } from '../../data/games.js';
import { positionFacts } from '../../data/positionFacts.js';

const list = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' && value.trim() && value !== 'Unknown' ? value.trim() : null;
const number = value => Number.isFinite(value) ? value : null;
const sourceUrl = source => { try { return new URL(source?.url).protocol === 'https:'; } catch { return false; } };
export const playerKey = player => normalizeAnswer(player.fullName || player.name);
export function normalizePlayers(records) {
  const byName = new Map();
  const byId = new Map();
  const byIdentity = new Map();
  const result = [];
  const compatible=(candidate,record)=>{
    if(!candidate)return false;
    if(candidate.wikidataId&&record.wikidataId)return candidate.wikidataId===record.wikidataId;
    const birth=record.birthDate instanceof Date?record.birthDate.toISOString().slice(0,10):text(record.birthDate);
    return !candidate.birthDate||!birth||candidate.birthDate===birth;
  };
  for (const record of list(records)) {
    if (!record || !text(record.fullName || record.name)) continue;
    const name = text(record.fullName || record.name);
    const key = normalizeAnswer(name);
    const candidates=[byIdentity.get(record.wikidataId),...(byName.get(key)||[]),record.id!=null?byId.get(String(record.id)):null];
    const existing=candidates.find(candidate=>compatible(candidate,record));
    const picture = portraits.find(item => normalizeAnswer(item.answer) === key || item.aliases.some(alias => normalizeAnswer(alias) === key));
    const careerClubs = list(record.careerClubs || record.career).map(club => typeof club === 'string' ? { club, from: null, to: null } : { club: text(club?.club), from: number(club?.from), to: number(club?.to), loan: Boolean(club?.loan) }).filter(club => club.club);
    const player = {
      id: String(record.id ?? record.externalId ?? record._id ?? key), fullName: name, aliases: list(record.aliases),
      wikidataId: text(record.wikidataId), nostalgia: Boolean(record.nostalgia),
      isRetired: Boolean(record.isRetired), retiredYear: number(record.retiredYear),
      portraitStyle: text(record.portraitStyle), portraitEra: text(record.portraitEra),
      portraitAssetYear: number(record.portraitAssetYear),
      portraitZoom: Math.max(1,Math.min(4,number(record.portraitZoom)||1)),
      clubVerifiedAt: text(record.clubVerifiedAt), clubSource: text(record.clubSource),
      dataSources: list(record.dataSources).filter(sourceUrl),
      imageSource: text(record.imageSource), imageAuthor: text(record.imageAuthor), imageLicense: text(record.imageLicense), imageLicenseUrl: text(record.imageLicenseUrl),
      birthDate: record.birthDate instanceof Date ? record.birthDate.toISOString().slice(0,10) : text(record.birthDate), deathDate: text(record.deathDate), nationality: text(record.nationality),
      positions: list(record.positions?.length ? record.positions : record.position ? [record.position] : []).filter(value => value && value !== 'Unknown'),
      heightCm: number(record.heightCm), weightKg: number(record.weightKg), strongFoot: text(record.strongFoot),
      shirtNumbers: list(record.shirtNumbers).filter(Number.isFinite), careerClubs,
      currentClub: text(record.currentClub), league: text(record.league), season: text(record.season),
      isLegend: record.category === 'legends' || Boolean(record.isLegend), category: record.category || 'current',
      image: text(record.image) || picture?.image, imageScale: record.image ? 1 : picture?.imageScale || 1,
      careerGoals: number(record.careerGoals),
    };
    if (existing) {
      for (const [field, value] of Object.entries(player)) {
        if (existing[field] == null || (Array.isArray(existing[field]) && !existing[field].length)) existing[field] = value;
      }
      existing.isLegend ||= player.isLegend;
      existing.nostalgia ||= player.nostalgia;
      existing.isRetired ||= player.isRetired;
      existing.aliases = [...new Set([...existing.aliases,...player.aliases,...(existing.fullName!==name?[name]:[])])];
      if (player.category === 'legends') existing.category = 'legends';
      byId.set(player.id, existing);
    } else {
      if(byId.has(player.id))player.id+=`-${player.wikidataId||result.length}`;
      result.push(player);byId.set(player.id,player);
    }
    const names=byName.get(key)||[];
    if(!names.includes(existing||player))names.push(existing||player);
    byName.set(key,names);
    if(record.wikidataId)byIdentity.set(record.wikidataId,existing||player);
  }
  for(const player of result)if(player.isRetired){player.currentClub=null;player.league=null;}
  for (const [name,nation,position] of positionFacts) {
    const player=result.find(player=>playerKey(player)===normalizeAnswer(name));
    if(player&&!player.positions.length){player.positions=[position];player.nationality ||= nation;}
  }
  return result;
}
export function ageOf(player, at = new Date()) {
  if (!player.birthDate) return null;
  const birth = new Date(player.birthDate);
  const end = player.deathDate ? new Date(player.deathDate) : at;
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(end.getTime()) || end < birth) return null;
  return end.getUTCFullYear() - birth.getUTCFullYear() - Number(end.getUTCMonth() < birth.getUTCMonth() || (end.getUTCMonth() === birth.getUTCMonth() && end.getUTCDate() < birth.getUTCDate()));
}
export const positionGroup = position => {
  if (['GK','DEF','MID','FWD'].includes(position)) return position;
  if (['GK', 'Goalkeeper'].includes(position)) return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'Defender'].includes(position)) return 'DEF';
  if (['CM', 'CDM', 'CAM', 'DM', 'AM', 'LM', 'RM', 'Midfielder'].includes(position)) return 'MID';
  if (['ST', 'CF', 'LW', 'RW', 'SS', 'Forward'].includes(position)) return 'FWD';
  return null;
};
export const fitsPosition = (player, position) => player.positions.some(value => value === position || positionGroup(value) === position);
export const allClubs = player => [...new Set([player.currentClub, ...player.careerClubs.map(club => club.club)].filter(Boolean))];
export const findPlayer = (players, value) => players.find(player => normalizeAnswer(player.fullName) === normalizeAnswer(value));
export function careersOverlap(a, b, club) {
  const at = new Date().getUTCFullYear();
  // With year-only records a shared transfer year does not prove they met.
  // Require an overlapping interval, not just matching boundary years.
  return a.careerClubs.some(x => x.club === club && x.from != null && b.careerClubs.some(y => y.club === club && y.from != null && Math.max(x.from, y.from) < Math.min(x.to ?? at, y.to ?? at)));
}
