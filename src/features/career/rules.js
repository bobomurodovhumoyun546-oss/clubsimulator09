export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hash(value){let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function rng(seed){let n=hash(seed);return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
export const localDay=(now=Date.now())=>new Date(now+5*3600000).toISOString().slice(0,10);
export const dayReset=now=>{const d=new Date(now+5*3600000);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)-5*3600000;};
export const defaultTactics={formation:'4-3-3',pressing:50,tempo:50,width:50,line:50,passing:50,mentality:50,transition:50,captain:null,positions:{},roles:{}};
export function tacticModifiers(t){const n=key=>(clamp(Number.isFinite(t?.[key])?t[key]:50,0,100)-50)/50;return {attack:clamp(1+n('mentality')*.08+n('tempo')*.04+n('width')*.025,.85,1.15),defence:clamp(1-n('mentality')*.06+n('pressing')*.04-n('line')*.035,.86,1.14),fatigue:clamp(1+n('pressing')*.2+n('tempo')*.12,.68,1.32),passing:clamp((1-n('passing')*.03-n('tempo')*.025)*(.98+clamp(t?.familiarity??50,0,100)*.0004),.92,1.08),risk:clamp(1+n('line')*.12+n('transition')*.08,.8,1.2)};}
export function validateTactics(t,ids,formations){
 if(!t||!formations[t.formation]||!Array.isArray(t.lineup)||t.lineup.length!==11||new Set(t.lineup).size!==11||t.lineup.some(id=>!ids.includes(id))||!t.lineup.includes(t.captain))throw Object.assign(Error('invalidTactics'),{code:'invalidTactics'});
 const next={...defaultTactics,formation:t.formation,lineup:t.lineup,captain:t.captain,positions:{},roles:{}};
 for(const key of ['pressing','tempo','width','line','passing','mentality','transition']){if(!Number.isInteger(t[key])||t[key]<0||t[key]>100)throw Object.assign(Error('invalidTactics'),{code:'invalidTactics'});next[key]=t[key];}
 for(const [id,p] of Object.entries(t.positions||{})){if(!t.lineup.includes(id)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<3||p.x>97||p.y<3||p.y>65)throw Object.assign(Error('invalidTactics'),{code:'invalidTactics'});next.positions[id]={x:p.x,y:p.y};}
 for(const [id,role] of Object.entries(t.roles||{})){if(!t.lineup.includes(id)||!['balanced','anchor','creator','runner','finisher'].includes(role))throw Object.assign(Error('invalidTactics'),{code:'invalidTactics'});next.roles[id]=role;}
 return next;
}
export const weatherTypes=['clear','rain','snow','wind','fog','hot'];
export function forecast(seed,month=6,region='temperate'){
 const r=rng(seed),winter=month<=2||month===12,roll=r();
 const type=region==='warm'?(roll<.45?'hot':roll<.65?'wind':'clear'):winter?(roll<.25?'snow':roll<.5?'rain':roll<.65?'fog':'clear'):(roll<.2?'rain':roll<.35?'wind':roll<.45?'fog':roll<.55?'hot':'clear');
 return {type,temperature:type==='snow'?-3:type==='hot'?34:10+Math.round(r()*15),wind:type==='wind'?22+Math.round(r()*14):Math.round(r()*12),seed:String(seed)};
}
export function weatherModifiers(type){return {clear:{pass:1,shot:1,fatigue:1,grip:1,visibility:1},rain:{pass:.96,shot:.97,fatigue:1.05,grip:.94,visibility:.95},snow:{pass:.94,shot:.95,fatigue:1.08,grip:.9,visibility:.9},wind:{pass:.95,shot:.94,fatigue:1.02,grip:1,visibility:1},fog:{pass:.97,shot:.97,fatigue:1,grip:1,visibility:.8},hot:{pass:.99,shot:1,fatigue:1.12,grip:1,visibility:1}}[type]||weatherModifiers('clear');}
export function valuation(p,{day=0,form=0,injured=false,contract=24,demand=1}={}){
 const age=p.age??27,potential=p.potential??p.ovr,ageFactor=age<24?1.12:age>33?.8:1;
 const trend=1+Math.sin((hash(p.id)%100+day)/9)*.075;
 return Math.max(500,Math.round((p.basePrice||Math.max(1000,(p.ovr-45)**2*16))*ageFactor*(1+clamp(potential-p.ovr,0,12)*.015)*(1+clamp(form,-5,5)*.025)*(injured?.78:1)*clamp(contract/24,.6,1.12)*clamp(demand,.8,1.2)*trend/100)*100);
}
export function goalRating(goal){if(!goal||goal.ownGoal)return 0;return Math.round(clamp(clamp(goal.distance||0,0,40)/40*35+clamp(goal.difficulty||0,0,1)*30+(['volley','freeKick','longShot'].includes(goal.shotType)?20:8)+(goal.assistId?8:3)+(goal.decisive?7:0),0,100));}
export function standings(teams,fixtures,tiebreakers=['points','difference','goalsFor']){
 const rows=Object.fromEntries(teams.map(t=>[t.id,{id:t.id,name:t.name,played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,points:0,difference:0}]));
 for(const f of fixtures.filter(f=>f.result)){const a=rows[f.home],b=rows[f.away];if(!a||!b)continue;const {home:x,away:y}=f.result;for(const [p,gf,ga]of [[a,x,y],[b,y,x]]){p.played++;p.goalsFor+=gf;p.goalsAgainst+=ga;p.difference=p.goalsFor-p.goalsAgainst;p.wins+=Number(gf>ga);p.draws+=Number(gf===ga);p.losses+=Number(gf<ga);p.points+=gf>ga?3:gf===ga?1:0;}}
 return Object.values(rows).sort((a,b)=>{for(const k of tiebreakers){if(['points','difference','goalsFor','wins'].includes(k)&&a[k]!==b[k])return b[k]-a[k];}return a.id.localeCompare(b.id);});
}
export function roundRobin(teams,double=false,prefix='league'){
 const ids=teams.map(t=>t.id);if(ids.length%2)ids.push(null);const list=[...ids],out=[];
 for(let round=0;round<list.length-1;round++){for(let i=0;i<list.length/2;i++){const a=list[i],b=list[list.length-1-i];if(a&&b)out.push({id:`${prefix}:${round}:${i}`,round:round+1,home:round%2?a:b,away:round%2?b:a,result:null});}list.splice(1,0,list.pop());}
 if(double)out.push(...out.map(f=>({...f,id:f.id+':return',round:f.round+list.length-1,home:f.away,away:f.home})));return out;
}
export function knockoutPairs(ids,round=1){const n=2**Math.ceil(Math.log2(ids.length)),padded=[...ids,...Array(n-ids.length).fill(null)],fixtures=[];for(let i=0;i<n/2;i++){const home=padded[i],away=padded[n-1-i];fixtures.push({id:`cup:${round}:${i}`,round,knockout:true,home,away,result:!away?{home:0,away:0,winner:home,bye:true}:null});}return fixtures;}
export function aggregateCareer(events){const stats={matches:0,wins:0,draws:0,losses:0,goals:0,assists:0,conceded:0,cleanSheets:0,transfers:0,income:0,spent:0,trophies:0,skills:0,players:{},seasons:{},competitions:{},recordWin:0};const seen=new Set();
 for(const e of events){if(seen.has(e.id))continue;seen.add(e.id);if(e.type==='match'){const r=e.data;stats.matches++;stats.wins+=Number(r.home>r.away);stats.draws+=Number(r.home===r.away);stats.losses+=Number(r.home<r.away);stats.goals+=r.home;stats.conceded+=r.away;stats.cleanSheets+=Number(r.away===0);stats.recordWin=Math.max(stats.recordWin,r.home-r.away);for(const key of ['seasons','competitions']){const id=String(key==='seasons'?r.season||1:r.competition||'friendly');stats[key][id]??={matches:0,goals:0,wins:0};stats[key][id].matches++;stats[key][id].goals+=r.home;stats[key][id].wins+=Number(r.home>r.away);}for(const g of r.goals||[]){if(!g.home||g.ownGoal)continue;stats.players[g.playerId]??={name:g.name,goals:0,assists:0};stats.players[g.playerId].goals++;if(g.assistId){stats.assists++;stats.players[g.assistId]??={name:g.assistName,goals:0,assists:0};stats.players[g.assistId].assists++;}}}else if(e.type==='transfer')stats.transfers++;else if(e.type==='skill')stats.skills++;else if(e.type==='trophy')stats.trophies++;if(e.money>0)stats.income+=e.money;if(e.money<0)stats.spent-=e.money;}
 return stats;
}
export function dailyMissions(user,day){const variation=hash(user+day)%2;return [{id:'play',event:'match',target:2,reward:4000},{id:'goals',event:'goals',target:3,reward:5000},{id:'skills',event:'skill',target:2,reward:3000},{id:variation?'win':'accuracy',event:variation?'win':'skillHit',target:variation?1:6,reward:4000}];}
export const skillKinds=['penalty','freeKick','passing','dribbling','targets'];
export function skillChallenge(seed,kind,round=0,difficulty='normal'){
 const r=rng(`${seed}:${kind}:${round}`),radius=difficulty==='hard'?.09:difficulty==='easy'?.18:.13;
 return {x:kind==='penalty'?(r()<.5?.2:.8):.15+r()*.7,y:.15+r()*.7,radius,keeperX:.4+r()*.2,curve:r()<.5?-1:1,deadline:kind==='dribbling'?2800:kind==='passing'?2400:3200};
}
export function skillScore(kind,challenge,input){if(!input||!Number.isFinite(input.x)||!Number.isFinite(input.y)||input.x<0||input.x>1||input.y<0||input.y>1)throw Object.assign(Error('invalid'),{code:'invalid'});
 if(kind==='freeKick'&&Number(input.curve)!==challenge.curve)return 0;
 if(kind==='penalty'&&Math.abs(input.x-challenge.keeperX)<.13)return 0;
 if(kind==='dribbling'){
  if(!Array.isArray(input.path)||input.path.length<3||input.path.length>100)return 0;
  let previous=input.path[0];for(const p of input.path){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1||Math.hypot(p.x-previous.x,p.y-previous.y)>.3)return 0;previous=p;}
  if(Math.hypot(previous.x-input.x,previous.y-input.y)>.15)return 0;
 }
 const d=Math.hypot(input.x-challenge.x,input.y-challenge.y);return d<=challenge.radius?Math.round(100*(1-d/challenge.radius*.5)):0;}
