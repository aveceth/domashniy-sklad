// Оценки времени до желательного использования с момента покупки при правильном хранении.
// Не являются сроком безопасности или гарантией свежести. Приоритет — маркировка производителя.
// Более специфичные выражения указаны раньше общих.
const RULES = [
  {terms:['огурец','огурцы','огурцов'],fridge:5,pantry:2},
  {terms:['помидор','томаты','томат свеж'],fridge:5,pantry:3},
  {terms:['морков','морковь'],fridge:21,pantry:7},
  {terms:['картофель','картошка'],pantry:21,fridge:7},
  {terms:['лук репчат','луковица'],pantry:28,fridge:7},
  {terms:['чеснок'],pantry:30,fridge:14},
  {terms:['свёкла','свекла'],fridge:21,pantry:7},
  {terms:['капуста белокоч','капуста'],fridge:14,pantry:4},
  {terms:['кабачок','цукини'],fridge:5,pantry:2},
  {terms:['баклажан'],fridge:5,pantry:2},
  {terms:['перец болгар','сладкий перец'],fridge:7,pantry:2},
  {terms:['брокколи'],fridge:4,freezer:240},
  {terms:['цветная капуста'],fridge:5,freezer:240},
  {terms:['шампиньон','гриб свеж'],fridge:3,freezer:180},
  {terms:['салат лист','листовой салат','айсберг'],fridge:4},
  {terms:['петрушк','укроп','кинза','базилик'],fridge:4,freezer:90},
  {terms:['зелёный лук','зеленый лук'],fridge:5},
  {terms:['банан'],pantry:4,fridge:3,freezer:60},
  {terms:['яблок'],fridge:21,pantry:7},
  {terms:['груш'],fridge:6,pantry:3},
  {terms:['апельсин','мандарин'],fridge:14,pantry:7},
  {terms:['лимон'],fridge:21,pantry:7},
  {terms:['клубник','малин','ежевик'],fridge:2,freezer:180},
  {terms:['виноград'],fridge:5,freezer:180},
  {terms:['авокадо'],fridge:3,pantry:3},
  {terms:['яйцо','яйца','яйц'],fridge:21},
  {terms:['молоко пастеризованное'],fridge:3},
  {terms:['творог'],fridge:2},
  {terms:['сыр твердый','твёрдый сыр'],fridge:14},
  {terms:['сыр мягкий'],fridge:5},
  {terms:['сливочное масло'],fridge:14,freezer:90},
  {terms:['куриное филе','куриная грудка','курица сырая'],fridge:1,freezer:180},
  {terms:['индейка сырая','филе индейки'],fridge:1,freezer:180},
  {terms:['фарш'],fridge:1,freezer:90},
  {terms:['говядина сырая','свинина сырая'],fridge:2,freezer:180},
  {terms:['рыба свежая','рыба сырая','филе рыбы'],fridge:1,freezer:90},
  {terms:['рис сухой'],pantry:180},
  {terms:['гречка сухая'],pantry:180},
  {terms:['макароны сухие'],pantry:180},
  {terms:['готовый рис','вареный рис','варёный рис'],fridge:1,freezer:30},
];
const norm=s=>String(s||'').trim().toLocaleLowerCase('ru').replace(/ё/g,'е');
export function estimateShelfLife(name,location){
  const normalized=norm(name);
  const rule=RULES.find(r=>r.terms.some(t=>normalized.includes(norm(t)))&&Number.isFinite(r[location]));
  return rule?{days:rule[location],match:rule.terms[0]}:null;
}
