import {friendCopy} from '../data/friendsCopy.js';
import {matchNotice} from './ruleCopy.js';
export function onlineNotice(text,language){const w=friendCopy(language);return ({'WAITING FOR FRIEND':w.waitingFriend,'WAITING FOR CONNECTION':w.waitingConnection,'MATCH ABANDONED - FEWER THAN 7 PLAYERS':w.matchAbandoned,'PLAY ON':w.playOn,'RAINBOW':w.rainbow,'FAKE SHOT':w.fakeShot,'LANE CHANGE':w.laneChange,'ELASTICO':w.elastico})[text]||matchNotice(text,language);}
