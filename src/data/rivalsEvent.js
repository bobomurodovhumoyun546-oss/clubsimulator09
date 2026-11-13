import entries from './rivalsEvent.json' with {type:'json'};
import {normalizeAnswer} from '../lib/gameEngine.js';
export const rivalsEvent=entries;
export const rivalsEventByName=new Map(entries.map(p=>[normalizeAnswer(p.name),p]));
