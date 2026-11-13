export async function accountApi(path,body){
 const response=await fetch(`/api/auth/${path}`,{method:body?'POST':'GET',credentials:'same-origin',signal:AbortSignal.timeout(10000),headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const result=await response.json().catch(()=>({code:'unavailable'}));
 if(!response.ok)throw Object.assign(new Error('Account request failed'),{code:result.code||'generic'});
 return result;
}
