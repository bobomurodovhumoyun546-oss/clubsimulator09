import {normalizeAnswer} from '../lib/gameEngine.js';
// Event OVRs chosen by the user, independent of official player ratings.
const groups={
 105:'Lionel Messi|Cristiano Ronaldo|Johan Cruyff|Ronaldo Nazário|Marco van Basten|Franz Beckenbauer|Michel Platini|Alfredo Di Stéfano',
 104:'Roberto Baggio|Ruud Gullit|Karl-Heinz Rummenigge|Fabio Cannavaro|Harry Kane|Kaká|Andriy Shevchenko|Eusébio|Bobby Charlton|George Best|Ronaldinho|Rivaldo|Gerd Müller|Gianni Rivera|Lev Yashin|Lothar Matthäus|Zinedine Zidane',
 103:'Luka Modrić|Rodri|Luis Figo|Hristo Stoichkov|Jean-Pierre Papin|Michael Owen|Pavel Nedvěd|Ousmane Dembélé|Karim Benzema|Robert Lewandowski|Thierry Henry|Neymar Jr.|Manuel Neuer|Franck Ribéry|Erling Haaland|Gianluigi Buffon|Andrés Iniesta|Xavi Hernández|Kylian Mbappé|Vinícius Júnior|Cafu|Virgil van Dijk|Roberto Carlos',
 102:'Sadio Mané|Kevin De Bruyne|Davor Šuker|Wesley Sneijder|Frank Rijkaard|Mohamed Salah|Lamine Yamal|Andrea Pirlo|Philipp Lahm',
 101:'Vitinha|Luis Suárez|Raphinha|Thibaut Courtois|Michael Olise',
 100:'Cole Palmer|Gianluigi Donnarumma|Nuno Mendes|Fabián Ruiz|N’Golo Kanté',
 99:'Jorginho|Sergio Busquets|Xabi Alonso|Jordi Alba',
 98:'Paulo Dybala|Lautaro Martínez',
 97:'Unai Simón|Mario Götze',
 96:'Ederson|Edinson Cavani',
 95:'Kalidou Koulibaly|Julián Quiñones',
};
// UEFA's published laureates through 2026. Uruguay's Luis Suárez is a different player.
const winners=new Set(`Lionel Messi|Cristiano Ronaldo|Johan Cruyff|Ronaldo Nazário|Marco van Basten|Franz Beckenbauer|Michel Platini|Alfredo Di Stéfano|Roberto Baggio|Ruud Gullit|Karl-Heinz Rummenigge|Fabio Cannavaro|Harry Kane|Kaká|Andriy Shevchenko|Eusébio|Bobby Charlton|George Best|Ronaldinho|Rivaldo|Gerd Müller|Gianni Rivera|Lev Yashin|Lothar Matthäus|Zinedine Zidane|Luka Modrić|Rodri|Luis Figo|Hristo Stoichkov|Jean-Pierre Papin|Michael Owen|Pavel Nedvěd|Ousmane Dembélé|Karim Benzema`.split('|').map(normalizeAnswer));
export const ballonEvent=Object.entries(groups).flatMap(([overall,names])=>names.split('|').map(name=>({name,overall:Number(overall),winner:winners.has(normalizeAnswer(name))})));
export const ballonEventByName=new Map(ballonEvent.map(p=>[normalizeAnswer(p.name),p]));
export const ballonWinnerSource='https://www.uefa.com/ballondor/news/0287-195e642735da-0594342b9554-1000--history-of-the-ballon-d-or-all-the-winners/';
