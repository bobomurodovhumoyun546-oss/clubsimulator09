import { countryCodes as codes } from '../../data/countries.js';
const special = { England:['Angliya','Англия','England'], Scotland:['Shotlandiya','Шотландия','Scotland'], Wales:['Uels','Уэльс','Wales'], 'Northern Ireland':['Shimoliy Irlandiya','Северная Ирландия','Northern Ireland'] };
export function nationName(nation, language) {
  if (!nation) return '—';
  if (special[nation]) return special[nation][{ uz:0, ru:1, en:2 }[language] ?? 0];
  try { return codes[nation] ? new Intl.DisplayNames([language], { type:'region' }).of(codes[nation]) : nation; } catch { return nation; }
}
export function flagOf(nation) {
  const code = codes[nation];
  return code ? [...code].map(char => String.fromCodePoint(127397 + char.charCodeAt(0))).join('') : '⚽';
}
export const positionName = (position, t) => ['GK','DEF','MID','FWD'].includes(position) ? `${position} · ${t(position)}` : position;
