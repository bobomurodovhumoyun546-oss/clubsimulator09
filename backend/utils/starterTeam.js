import {randomUUID} from 'node:crypto';
import {applyStarterTeam} from '../../src/features/starterTeam.js';
export async function starterStatus(db,userId){const choice=await db.prepare('SELECT team_id FROM starter_choices WHERE user_id=?').get(userId),save=await db.prepare('SELECT state FROM club_saves WHERE user_id=?').get(userId);const club=save?JSON.parse(save.state):null;return {teamId:choice?.team_id||club?.starterTeamId||null,eligible:!choice&&!club?.starterTeamId&&!(club?.played>0)};}
export async function claimStarterTeam(db,userId,teamId){
 const save=await db.prepare('SELECT state FROM club_saves WHERE user_id=?').get(userId);if(!save)return {error:'starterSaveRequired',status:400};
 const status=await starterStatus(db,userId);if(!status.eligible)return {error:'starterUnavailable',status:409};
 let club;try{club=applyStarterTeam(JSON.parse(save.state),teamId);}catch{return {error:'starterUnavailable',status:400};}
 const claimId=randomUUID(),created=new Date().toISOString(),statements=[{sql:'INSERT OR IGNORE INTO starter_choices(user_id,team_id,claim_id,created) VALUES(?,?,?,?)',args:[userId,teamId,claimId,created]},{sql:'UPDATE club_saves SET state=?,updated=? WHERE user_id=? AND EXISTS(SELECT 1 FROM starter_choices WHERE user_id=? AND claim_id=?)',args:[JSON.stringify(club),created,userId,userId,claimId]}];
 if(db.batch)await db.batch(statements);else{db.exec('BEGIN IMMEDIATE');try{for(const s of statements)db.prepare(s.sql).run(...s.args);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
 const choice=await db.prepare('SELECT claim_id FROM starter_choices WHERE user_id=?').get(userId);return choice.claim_id===claimId?{club}:{error:'starterUnavailable',status:409};
}
