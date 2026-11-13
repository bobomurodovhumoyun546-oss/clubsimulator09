import historic from '../data/fc24Ratings.json' with {type:'json'};
import {primeOverrides,reviewedPeakYears} from '../data/primeOverrides.js';
import archive from '../data/fc27Ratings.json' with {type:'json'};
import {normalizeAnswer} from '../lib/gameEngine.js';
import {ageOf,allClubs,fitsPosition,positionGroup} from '../games/core/players.js';

// BallIQ editorial assessments of retired players at their peak, not EA ICON ratings.
const primeGroups={
 98:'Pelé|Diego Maradona',
 97:'Ronaldo Nazário|Johan Cruyff|Alfredo Di Stéfano',
 96:'Zinedine Zidane|Franz Beckenbauer|Lionel Messi|Cristiano Ronaldo|Ferenc Puskás',
 95:'Paolo Maldini|Ronaldinho|Eusébio|Garrincha|Marco van Basten|Gerd Müller|Romário|Michel Platini|Lev Yashin',
 94:'Thierry Henry|George Best|Zico|Xavi Hernández|Andrés Iniesta|Lothar Matthäus|Franco Baresi|Gianluigi Buffon|Ruud Gullit|Bobby Charlton|Bobby Moore|Giuseppe Meazza|Gianni Rivera|Dino Zoff|Roberto Baggio|Rivellino',
 93:'Kaká|Roberto Carlos|Cafu|Carlos Alberto|Rivaldo|Jairzinho|Andrea Pirlo|Iker Casillas|Peter Schmeichel|Oliver Kahn|Philipp Lahm|Javier Zanetti|Luis Figo|Dennis Bergkamp|Kenny Dalglish|Hugo Sánchez|Karl-Heinz Rummenigge|Gaetano Scirea|Gabriel Batistuta|Michael Laudrup|Ryan Giggs|Steven Gerrard|Frank Lampard|Paul Scholes|Wayne Rooney|Patrick Vieira|Arjen Robben|Franck Ribéry|Clarence Seedorf|Frank Rijkaard|David Villa|David Silva|Sergio Aguero',
 92:'David Beckham|Alessandro Del Piero|Francesco Totti|Alessandro Nesta|Fabio Cannavaro|Edwin van der Sar|Petr Čech|Toni Kroos|Xabi Alonso|Rio Ferdinand|Nemanja Vidić|Ashley Cole|Didier Drogba|Samuel Eto\'o|Yaya Touré|Pavel Nedvěd|Gheorghe Hagi|Giorgio Chiellini|Ruud van Nistelrooy|Robin van Persie|Wesley Sneijder|Ronald Koeman|Raúl González|Carles Puyol|Sergio Ramos|Andriy Shevchenko|Zlatan Ibrahimović|Alan Shearer|Hristo Stoichkov|Gareth Bale|Eden Hazard|Dani Alves|Lúcio|Maicon|Thiago Silva|Gerard Piqué|John Terry|Lilian Thuram|Roy Keane|Jaap Stam|Rudi Völler|Mario Kempes|Luis Suárez',
 91:'Sócrates|Bastian Schweinsteiger|Michael Ballack|Laurent Blanc|Marcel Desailly|Eric Cantona|Fernando Torres|Emilio Butragueño|Fernando Hierro|Marcelo|Juan Román Riquelme|Hernán Crespo|Diego Forlán|Davor Šuker|Jürgen Klinsmann|Ian Rush|Michael Owen|Miroslav Klose|Gianluca Zambrotta|Vincent Kompany|Adriano|Radamel Falcao|Daniele De Rossi|Jérôme Boateng|Nicolas Anelka|Jean-Pierre Papin|Jürgen Kohler|Leonardo Bonucci|Gianluca Vialli|Patrice Evra|Mesut Özil|Bebeto|Carlos Tévez|Cesc Fàbregas|Pepe|Santi Cazorla|James Rodríguez',
 90:'Sol Campbell|Gary Lineker|Ian Wright|John Barnes|David Seaman|Claude Makélélé|Emmanuel Petit|Robert Pirès|David Trezeguet|Michael Essien|Jay-Jay Okocha|Abedi Pelé|Gianfranco Zola|Patrick Kluivert|Henrik Larsson|Antonio Di Natale|Diego Milito|Enzo Francescoli|Iván Córdoba|Javier Mascherano|Esteban Cambiasso|Walter Samuel|Ricardo Carvalho|Rui Costa|Park Ji-sung|Dries Mertens|Marek Hamšík|Juan Sebastián Verón|Philippe Coutinho|Alexis Sánchez|Arturo Vidal|Dunga|Juan Mata|Tony Adams|Gary Neville|Andy Cole|Teddy Sheringham|Steve McManaman|Guti|Víctor Valdés|Pablo Aimar|David Ginola|Gennaro Gattuso|Bixente Lizarazu|Iván Zamorano|Zé Roberto|Gilberto Silva|Edinson Cavani',
 89:'Tomáš Rosický|Andrea Barzagli|Fernando Morientes|Mario Gómez|Mario Mandžukić|Claudio Marchisio|Dimitar Berbatov|Robbie Keane|Rafael Márquez|Nani|Hidetoshi Nakata|Saeed Al-Owairan|Kolo Touré|Jan Vertonghen|Toby Alderweireld|Klaas-Jan Huntelaar|Ivan Rakitić|Darijo Srna|Nemanja Matić|Edin Džeko|Miralem Pjanić|Freddie Ljungberg|Jari Litmanen|Fernandinho|Robinho|Antonio Valencia|Claudio Bravo|José Luis Chilavert|Rafael van der Vaart|Raphaël Varane|Joe Cole|Jens Lehmann|Sami Khedira|Pablo Zabaleta|Blaise Matuidi|Joan Capdevila|Eric Abidal|Míchel Salgado|Roy Makaay|Tomas Brolin|Oliver Bierhoff|Jamie Carragher|Claudio Pizarro|Igor Belanov|Wojciech Szczęsny',
 88:'Dirk Kuyt|Tim Cahill|Landon Donovan|Clint Dempsey|Jorge Campos|Carlos Vela|Shinji Kagawa|Marouane Fellaini|Nigel de Jong|Jerzy Dudek|Łukasz Piszczek|Jakub Błaszczykowski|Dušan Tadić|Stevan Jovetić|Martin Škrtel|John Arne Riise|Ole Gunnar Solskjær|Daniel Agger|Ramires|Oscar|David Luiz|Alexandre Pato|Lucas Leiva|Douglas Costa|Jackson Martínez|David Ospina|Gary Medel|Paolo Guerrero|Jefferson Farfán|Roque Santa Cruz|Óscar Cardozo|Tim Howard|Brad Friedel|Cuauhtémoc Blanco|Asamoah Gyan|Jan Koller|Theo Walcott|Jack Wilshere|Ashley Young|Nwankwo Kanu|Ludovic Giuly|Ledley King|Sidney Govou|Uli Hoeneß|Euzebiusz Smolarek|Micah Richards|Alessandro Florenzi',
 86:'Harry Kewell|DaMarcus Beasley|Juan Pablo Ángel|Sami Al-Jaber|Yasser Al-Qahtani|Mohammed Noor|Gervinho|Alex Song|John Obi Mikel|Joseph Yobo|Thomas Vermaelen|Daniel Van Buyten|Milan Baroš|Josip Šimunić|Aleksandar Kolarov|Vedad Ibišević|Stefan Savić|Aaron Ramsey|Joe Allen|Craig Bellamy|Simon Kjær|Jon Dahl Tomasson|Sebastian Larsson|Kim Källström|Eiður Guðjohnsen|Lucas Moura|Joël Matip|Luis Hernández|Lars Ricken|Dieter Hoeneß|Włodzimierz Smolarek|Miguel Layún',
 83:'Odil Akhmedov|Server Djeparov|Mirjalol Kasimov|Maksim Shatskikh|Adebayo Akinfenwa',
};
const prime=new Map(Object.entries(primeGroups).flatMap(([rating,names])=>names.split('|').map(name=>[normalizeAnswer(name),Number(rating)])));
const nationalLeague=/premier league|la liga|bundesliga|serie a|ligue 1/i;
const leadingClubs=/real madrid|barcelona|bayern|manchester city|manchester united|liverpool|chelsea|arsenal|juventus|milan|paris saint|borussia dortmund|internazionale|inter milan/i;
const overrides=new Map(primeOverrides.map(([name,overall,primeYear])=>[normalizeAnswer(name),{overall,primeYear}]));
const peakYears=new Map(Object.entries(reviewedPeakYears).map(([name,year])=>[normalizeAnswer(name),year]));
function peakSeason(player,reviewedYear){
 const now=new Date().getFullYear(),birth=Number(player.birthDate?.slice(0,4));
 const end=Math.min(now,player.retiredYear||now,Number(player.deathDate?.slice(0,4))||now);
 const starts=(player.careerClubs||[]).map(c=>c.from).filter(Number.isFinite);
 const start=Math.min(end,Math.max(Number.isFinite(birth)&&birth>1800?birth+16:1900,starts.length?Math.min(...starts):1900));
 const year=reviewedYear??(birth>1800?birth+27:end);
 return {primeYear:Math.max(start,Math.min(end,year)),primeYearEstimated:!reviewedYear};
}
export function ratingInfo(player){
 const name=normalizeAnswer(player.fullName),retired=player.isRetired||Boolean(player.deathDate);
 const custom=overrides.get(name);
 // Accent-insensitive search must not give Brazilian Pepe the Portuguese defender's assessment.
 const sameIdentity=name!=='pepe'||!player.birthDate||player.birthDate.startsWith('1983');
 const reviewed=sameIdentity?prime.get(name):null;
 const found=archive.players[player.wikidataId]||archive.players[player.fullName];
 const old=historic.players[player.wikidataId]||historic.players[player.fullName];
 const clubs=allClubs({...player,careerClubs:player.careerClubs||[]}),age=ageOf(player);
 let estimate=65+(nationalLeague.test(player.league||'')?8:0)+(clubs.some(c=>leadingClubs.test(c))?7:0)+Math.min(3,Math.floor(clubs.length/3));
 if(retired&&player.isLegend)estimate=Math.max(estimate,84);
 if(!retired&&age!=null&&age<20)estimate-=age<18?6:3;
 if(Number.isFinite(player.careerGoals))estimate+=Math.min(4,Math.floor(player.careerGoals/100));
 const basis=found?.overall>= (old?.overall||0)?found:old;
 const maximum=name==='pele'||name==='diego maradona'?95:94;
 const overall=player.cardOverall??Math.max(50,Math.min(maximum,custom?.overall??reviewed??Math.max(found?.overall||0,old?.overall||0,Math.min(85,estimate))));
 const season=peakSeason(player,custom?.primeYear??(sameIdentity?peakYears.get(name):null));
 return {overall,type:custom||reviewed?'prime':'estimate',edition:'BallIQ',source:null,...season,
  // Contemporary attributes are a starting point, adjusted to our prime OVR, not official prime stats.
  attributes:found?.attributes,goalkeeping:found?.goalkeeping,attributeAdjustment:overall-(found?.overall||basis?.overall||overall)};
}
export function playerOVR(player,training=0){return ratingInfo(player).overall+Math.max(0,Math.min(5,Number.isFinite(training)?Math.floor(training):0));}
export const ratingTier=rating=>rating>=90?'purple':rating>=80?'gold':rating>=75?'silver':'bronze';

const primeAttributes={
 'pele':[96,98,94,98,60,78],'diego maradona':[92,96,96,99,42,80],
 'ronaldo nazario':[98,98,85,98,42,90],'johan cruyff':[94,95,96,97,52,79],
 'zinedine zidane':[86,94,98,97,74,85],'david beckham':[80,88,97,87,68,82],
 'paolo maldini':[88,58,82,77,99,91],'ronaldinho':[93,93,95,99,39,81],
};
const bounded=n=>Math.max(1,Math.min(99,Math.round(n)));
// Custom PRIME game balancing, not measured sprint speeds or official EA attributes.
const signatureStats=new Map([
 ['Thierry Henry',99,96],['Lionel Messi',97,99],['Cristiano Ronaldo',99,97],
 ['Robert Lewandowski',95,94],['Kylian Mbappé',99,97],['Erling Haaland',98,92],
 ['Neymar Jr.',97,99],['Neymar',97,99],['Ronaldinho',97,99],['Diego Maradona',96,99],
 ['Ronaldo Nazário',99,99],['Gareth Bale',99,96],['Arjen Robben',99,98],
 ['Adama Traoré',99,95],['Vinícius Júnior',99,99],['Eden Hazard',97,99],
 ['Ousmane Dembélé',99,98],
].map(([name,pac,dri])=>[normalizeAnswer(name),{pac,dri}]));
export function playerAttributes(player,training=0){
 if(player.attributePositions)player={...player,positions:player.attributePositions};
 const info=ratingInfo(player),goalkeeper=fitsPosition(player,'GK'),o=info.overall;
 const keys=goalkeeper?['div','han','kic','ref','spd','pos']:['pac','sho','pas','dri','def','phy'];
 let values=goalkeeper?info.goalkeeping:info.attributes;
 let estimated=!values||keys.some(k=>!Number.isInteger(values[k])||values[k]<1||values[k]>99);
 if(estimated){
  let numbers=primeAttributes[normalizeAnswer(player.fullName)];
  if(goalkeeper)numbers=[o+1,o-2,o-8,o+2,o*.55,o];
  else if(!numbers){
   const p=player.positions?.[0];
   if(['LB','RB','LWB','RWB'].includes(p))numbers=[o+1,o-30,o-3,o-4,o-3,o-8];
   else if(fitsPosition(player,'DEF'))numbers=[o-8,o-40,o-12,o-15,o+1,o];
   else if(p==='CDM'||p==='DM')numbers=[o-12,o-20,o-2,o-7,o,o];
   else if(fitsPosition(player,'MID'))numbers=[o-12,o-7,o+3,o+1,p==='CAM'?o-40:o-14,o-9];
   else if(['RW','LW','RM','LM'].includes(p))numbers=[o+4,o-4,o-4,o+3,o-50,o-12];
   else numbers=[o-3,o+1,o-12,o-4,o-45,o-4];
  }
  values=Object.fromEntries(keys.map((key,i)=>[key,bounded(numbers[i])]));
 }
 const boost=Math.max(0,Math.min(5,Number.isFinite(training)?Math.floor(training):0));
 const base=Object.fromEntries(keys.map(k=>[k,bounded(values[k]+(estimated?0:info.attributeAdjustment))]));
 // Regular Rivals cards keep the source player's strengths and weaknesses.
 // Their promotional OVR must not turn every attribute into legend-level stats.
 if(player.cardEdition==='rivals'&&player.rivalsRegular){
  const source=goalkeeper?info.goalkeeping:info.attributes,ceiling=Math.min(94,o-7),eventBoost=3+Math.max(0,o-95)*.6;
  return {goalkeeper,estimated:!source,values:Object.fromEntries(keys.map(k=>[k,Math.min(100,ceiling+boost,Math.max(1,Math.round((source?.[k]??values[k])+eventBoost)+boost))]))};
 }
 if(!goalkeeper){
  const fullback=player.positions?.some(p=>['LB','RB','LWB','RWB'].includes(p));
  if(o>=85){
   if(fullback)base.pac=Math.max(93,Math.min(97,base.pac));
   else if(fitsPosition(player,'FWD'))base.pac=Math.max(95,base.pac);
   else if(fitsPosition(player,'MID')||fitsPosition(player,'DEF'))base.pac=Math.max(90,Math.min(95,base.pac));
  }
  Object.assign(base,signatureStats.get(normalizeAnswer(player.fullName)));
 }
 const raw={...base},role=positionGroup(player.positions?.[0]);
 // Preserve positional weaknesses instead of inflating every attribute equally.
 for(const key of keys)base[key]=Math.max(85,Math.min(96,base[key]));
 if(goalkeeper){for(const key of ['div','ref','pos'])base[key]=Math.max(95,base[key]);}
 else if(fitsPosition(player,'FWD'))base.sho=Math.max(95,base.sho);
 else if(fitsPosition(player,'MID'))base.pas=Math.max(95,base.pas);
 else if(fitsPosition(player,'DEF'))base.def=Math.max(95,base.def);
 if(normalizeAnswer(player.fullName)==='robert lewandowski')Object.assign(base,{pac:91,sho:95,pas:93,dri:93,phy:93});
 if(!goalkeeper&&role==='FWD')base.def=Math.min(64,raw.def);
 if(!goalkeeper&&role==='DEF')base.sho=Math.min(74,raw.sho);
 return {goalkeeper,estimated:true,values:Object.fromEntries(keys.map(k=>[k,Math.min(!goalkeeper&&role==='FWD'&&k==='def'?69:!goalkeeper&&role==='DEF'&&k==='sho'?79:100,base[k]+boost)]))};
}
