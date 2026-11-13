export const players = [
  ['Lionel Messi', ['messi', 'leo messi'], 'p1'],
  ['Cristiano Ronaldo', ['ronaldo', 'cristiano', 'cr7'], 'p2'],
  ['Neymar', ['neymar jr', 'neymar junior'], 'p3'],
  ['Kylian Mbappé', ['mbappe', 'kilian mbappe', 'kilyan mbappe'], 'p4'],
  ['Erling Haaland', ['haaland', 'holand', 'erling holand'], 'p5'],
  ['Mohamed Salah', ['salah', 'muhammad salah', 'mohammed salah'], 'p6'],
  ['Kevin De Bruyne', ['de bruyne', 'de bryuyne'], 'p7'],
  ['Harry Kane', ['kane', 'harri keyn', 'keyn'], 'p8'],
].map(([answer, aliases, image]) => ({ answer, aliases, image: `/game-media/${image}-hd.${image === 'p1' ? 'png' : 'jpg'}`, portrait: true, imageScale: image === 'p7' ? 1.6 : 1 }));

// Visible badge areas omit club names; the underlying files are credited in SOURCES.md.
export const clubs = [
  { answer: 'Real Madrid', aliases: ['real', 'real madrid cf'], image: '/game-media/c1.png' },
  { answer: 'Inter', aliases: ['inter milan', 'internazionale', 'inter milano'], image: '/game-media/c2.png' },
  { answer: 'Juventus', aliases: ['juve', 'yuventus'], image: '/game-media/c3.png', crop: 'juventus' },
  { answer: 'Wolverhampton', aliases: ['wolves', 'wolverhampton wanderers'], image: '/game-media/c4.png' },
  { answer: 'Tottenham Hotspur', aliases: ['tottenham', 'spurs', 'tottenhem'], image: '/game-media/c5.png', crop: 'tottenham' },
  { answer: 'Newcastle United', aliases: ['newcastle', 'nyukasl'], image: '/game-media/c6.png', crop: 'newcastle' },
];

export const clues = [
  { answer: 'Zinedine Zidane', aliases: ['zidane', 'zidan', 'zinedin zidan'], clues: ['Fransiyalik', 'Pozitsiyasi: CM / hujumkor yarim himoyachi', 'Futbolchilik faoliyatini tugatgan', '1998-yil Oltin to‘p sohibi', 'Juventus va Real Madridda o‘ynagan'] },
  { answer: 'Ronaldinho', aliases: ['ronaldinyo', 'ronaldinho gaucho'], clues: ['Braziliyalik', 'Pozitsiyasi: hujumkor yarim himoyachi', 'Futbolchilik faoliyatini tugatgan', '2005-yil Oltin to‘p sohibi', 'Barcelona va Milanda o‘ynagan'] },
  { answer: 'Ronaldo Nazário', aliases: ['ronaldo', 'ronaldo nazario', 'brazilian ronaldo'], clues: ['Braziliyalik', 'Pozitsiyasi: markaziy hujumchi', 'Futbolchilik faoliyatini tugatgan', '1997 va 2002-yil Oltin to‘p sohibi', 'Laqabi: El Fenómeno'] },
  { answer: 'Kaká', aliases: ['kaka', 'ricardo kaka', 'ricardo izecson dos santos leite'], clues: ['Braziliyalik', 'Pozitsiyasi: hujumkor yarim himoyachi', 'Futbolchilik faoliyatini tugatgan', '2007-yil Oltin to‘p sohibi', 'Milan va Real Madridda o‘ynagan'] },
  { answer: 'Thierry Henry', aliases: ['henry', 'anri', 'tyerri anri', 'terri anri'], clues: ['Fransiyalik', 'Pozitsiyasi: hujumchi', 'Futbolchilik faoliyatini tugatgan', '1998-yil jahon chempioni', 'Arsenalning tarixiy to‘purari'] },
  { answer: 'David Beckham', aliases: ['beckham', 'bekhem', 'devid bekhem', 'david bekhem'], clues: ['Angliyalik', 'Pozitsiyasi: o‘ng yarim himoyachi', 'Futbolchilik faoliyatini tugatgan', 'Manchester United va Real Madridda o‘ynagan', 'Aniq jarima zarbalari bilan mashhur'] },
  { answer: 'Paolo Maldini', aliases: ['maldini'], clues: ['Italiyalik', 'Pozitsiyasi: himoyachi', 'Futbolchilik faoliyatini tugatgan', 'Butun katta faoliyatini bir klubda o‘tkazgan', 'Milan bilan 5 marta Yevropa chempioni bo‘lgan'] },
  { answer: 'Andrés Iniesta', aliases: ['iniesta', 'andres iniesta', 'inesta'], clues: ['Ispaniyalik', 'Pozitsiyasi: markaziy yarim himoyachi', '2010-yil jahon chempioni', 'Jahon chempionati finalidagi g‘alaba golini urgan', 'Barcelona akademiyasi tarbiyalanuvchisi'] },
];

const awardNames = {
  figo: ['Luís Figo', 'figo', 'luis figo'], owen: ['Michael Owen', 'owen', 'maykl ouen'],
  ronaldo: ['Ronaldo Nazário', 'ronaldo', 'ronaldo nazario'], nedved: ['Pavel Nedvěd', 'nedved', 'pavel nedved'],
  sheva: ['Andriy Shevchenko', 'shevchenko', 'andrey shevchenko'], ronaldinho: ['Ronaldinho', 'ronaldinyo'],
  cannavaro: ['Fabio Cannavaro', 'cannavaro', 'kannavaro'], kaka: ['Kaká', 'kaka'],
  cr7: ['Cristiano Ronaldo', 'ronaldo', 'cr7', 'cristiano'], messi: ['Lionel Messi', 'messi', 'leo messi'],
  modric: ['Luka Modrić', 'modric', 'modrich'], benzema: ['Karim Benzema', 'benzema'], rodri: ['Rodri', 'rodrigo hernandez'],
};
export const ballon = [
  [2000, 'figo'], [2001, 'owen'], [2002, 'ronaldo'], [2003, 'nedved'], [2004, 'sheva'], [2005, 'ronaldinho'],
  [2006, 'cannavaro'], [2007, 'kaka'], [2008, 'cr7'], [2009, 'messi'], [2010, 'messi'], [2011, 'messi'],
  [2012, 'messi'], [2013, 'cr7'], [2014, 'cr7'], [2015, 'messi'], [2016, 'cr7'], [2017, 'cr7'],
  [2018, 'modric'], [2019, 'messi'], [2021, 'messi'], [2022, 'benzema'], [2023, 'messi'], [2024, 'rodri'],
].map(([year, key]) => ({ year, answer: awardNames[key][0], aliases: awardNames[key].slice(1) }));

const nations = {
  uruguay: ['Urugvay', 'uruguay'], italy: ['Italiya', 'italy', 'italia'], germany: ['Germaniya', 'germany', 'west germany', 'gfr', 'g‘arbiy germaniya'],
  brazil: ['Braziliya', 'brazil', 'brasil'], england: ['Angliya', 'england'], argentina: ['Argentina'], france: ['Fransiya', 'france', 'frantsiya'], spain: ['Ispaniya', 'spain', 'espana'],
};
export const worldcup = [
  [1930, 'uruguay'], [1934, 'italy'], [1938, 'italy'], [1950, 'uruguay'], [1954, 'germany'], [1958, 'brazil'],
  [1962, 'brazil'], [1966, 'england'], [1970, 'brazil'], [1974, 'germany'], [1978, 'argentina'], [1982, 'italy'],
  [1986, 'argentina'], [1990, 'germany'], [1994, 'brazil'], [1998, 'france'], [2002, 'brazil'], [2006, 'italy'],
  [2010, 'spain'], [2014, 'germany'], [2018, 'france'], [2022, 'argentina'],
].map(([year, key]) => ({ year, answer: nations[key][0], aliases: nations[key].slice(1) }));

export const gameTypes = [
  { id: 'players', title: 'Futbolchini top', tag: 'RASMLI O‘YIN', description: 'Yuzini taniysizmi? Rasmga qarab futbolchining ismini toping.', icon: 'player', color: 'lime', data: players },
  { id: 'clubs', title: 'Klubni top', tag: 'EMBLEMA CHALLENGE', description: 'Nomlar yashirilgan. Klubni faqat emblemasidan tanib oling.', icon: 'club', color: 'sky', data: clubs },
  { id: 'clues', title: '5 ta ishora', tag: 'DETEKTIV REJIMI', description: 'Davlati, pozitsiyasi, faoliyati… Beshta ishora, bitta futbolchi.', icon: 'clue', color: 'violet', data: clues },
  { id: 'ballon', title: 'Oltin to‘p', tag: 'FUTBOL AFSONALARI', description: 'Yilni ko‘ring va Oltin to‘p sohibini eslang. 2000–2024.', icon: 'award', color: 'amber', data: ballon },
  { id: 'worldcup', title: 'Jahon chempionlari', tag: 'WORLD CUP', description: '1930–2022: qaysi yili qaysi davlat jahon chempioni bo‘lgan?', icon: 'world', color: 'rose', data: worldcup },
];
