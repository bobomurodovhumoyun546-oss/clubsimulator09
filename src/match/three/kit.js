// Same design fields and patterns as ClubStudio / ClubKit.
export function matchKit(club={},team=0){
 const primary=club.primary||(team?'#d93d51':'#1963c3'),secondary=club.secondary||(team?'#19233d':'#f1f0df');
 return {primary,secondary,pattern:club.pattern||'solid',sleeves:club.kitSleeves||primary,trim:club.kitTrim||secondary,shorts:club.kitShorts||primary,socks:club.kitSocks||secondary,text:club.kitTextColor||club.kitTrim||secondary,collar:club.kitCollar||'round',sponsor:club.kitSponsor??club.name??'',badge:club.badgeInitials||'FC'};
}
export function secondaryPanel(pattern,x,y){
 switch(pattern){
 case 'stripes':return Math.floor((x+1)*4)%2===0;
 case 'pinstripe':return ((x+1)*7)%1<.13;
 case 'hoops':return Math.floor(y*7)%2===0;
 case 'halves':return x>0;
 case 'diagonal':return Math.abs(y-(x*.5+.5))<.17;
 case 'chevron':return Math.abs(y-(.57+Math.abs(x)*.32))<.12;
 default:return false;
 }
}
