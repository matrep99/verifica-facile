export const keywordBank = {
  "Matematica": { base:["equazione","incognita","primo grado","bilanciare","uguaglianza","frazione","denominatore","numeratore"], syns:["x","risolvi","=","uguale","soluzione","variabile","y"] },
  "Storia":     { base:["roma antica","repubblica","impero","cesare","senato","augusto","medioevo","feudalesimo"], syns:["console","patrizi","plebei","imperatore","medievale","cavaliere","castello"] },
  "Scienze":    { base:["fotosintesi","clorofilla","stomi","anidride carbonica","ossigeno","cellula","nucleo","digestione"], syns:["luce solare","CO2","H2O","glucosio","pianta","membrana","citoplasma","stomaco"] },
  "Italiano":   { base:["analisi del periodo","proposizione","coordinata","subordinata","congiunzione","soggetto","predicato"], syns:["relative","temporali","causali","consecutive","frase","periodo","principale"] },
  "Inglese":    { base:["simple past","irregular verbs","did","was","were","present perfect","future"], syns:["yesterday","ago","didn't","have","has","already","will","going to"] }
} as const;

export function classBand(classLabel: string)
{
  const s = classLabel.toLowerCase();
  if (s.includes("prim") || s.includes("elementare") || /\b1[aª]\b|\b2[aª]\b|\b3[aª]\b|\b4[aª]\b|\b5[aª]\b/.test(s)) return { band:"primaria",  maxLen:30 };
  if (s.includes("media") || s.includes("medie")) return { band:"media",     maxLen:45 };
  return { band:"superiore", maxLen:60 };
}