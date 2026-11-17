// The authenticated account is the only recipient. The grant's primary key makes
// concurrent requests and later retries unable to create another award.
export const PROMO_CODES=Object.freeze({NEWCLUBSIM:500000});
export async function redeemPromoCode(db,userId,input){
 const code=typeof input==='string'?input.trim().toUpperCase():'';
 if(!Object.hasOwn(PROMO_CODES,code))return {error:'promoInvalid',status:400};
 const grant={id:'promo:'+code,amount:PROMO_CODES[code]};
 const result=await db.prepare('INSERT OR IGNORE INTO club_grants(id,user_id,amount) VALUES(?,?,?)').run(grant.id,userId,grant.amount);
 if(!result.changes)return {error:'promoUsed',status:409};
 return {grant};
}
