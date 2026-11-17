// An optional revision prevents an old browser tab from overwriting a newer squad.
export async function saveClubSnapshot(db,userId,club,expectedUpdated){
 let updated=new Date().toISOString();if(updated===expectedUpdated)updated=new Date(Date.now()+1).toISOString();
 let result;
 if(expectedUpdated===undefined)result=await db.prepare('INSERT INTO club_saves VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state,updated=excluded.updated').run(userId,JSON.stringify(club),updated);
 else if(expectedUpdated===null)result=await db.prepare('INSERT OR IGNORE INTO club_saves(user_id,state,updated) VALUES(?,?,?)').run(userId,JSON.stringify(club),updated);
 else if(typeof expectedUpdated==='string')result=await db.prepare('UPDATE club_saves SET state=?,updated=? WHERE user_id=? AND updated=?').run(JSON.stringify(club),updated,userId,expectedUpdated);
 else return {error:'invalid',status:400};
 return result.changes?{saved:true,updated}:{error:'saveConflict',status:409};
}
