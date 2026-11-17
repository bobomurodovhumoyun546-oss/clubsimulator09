export function giftSchedule(now=new Date()){
 const local=new Date(now.getTime()+5*3600000),day=local.toISOString().slice(0,10);
 return [{kind:'welcome',id:'gift:welcome',amount:50000,available:true},{kind:'daily',id:'gift:daily:'+day,amount:10000,available:true},{kind:'thursday',id:'gift:thursday:'+day,amount:60000,available:local.getUTCDay()===4}];
}
export async function listGifts(db,userId,now=new Date()){
 const rows=await db.prepare('SELECT id FROM club_grants WHERE user_id=?').all(userId),claimed=new Set(rows.map(r=>r.id));
 return giftSchedule(now).map(g=>({...g,claimed:claimed.has(g.id)}));
}
export async function claimGift(db,userId,kind,now=new Date()){
 const gift=giftSchedule(now).find(g=>g.kind===kind);
 if(!gift||!gift.available)return {error:'giftUnavailable',status:400};
 const result=await db.prepare('INSERT OR IGNORE INTO club_grants(id,user_id,amount) VALUES(?,?,?)').run(gift.id,userId,gift.amount);
 if(!result.changes)return {error:'giftClaimed',status:409};
 return {grant:{id:gift.id,amount:gift.amount}};
}
