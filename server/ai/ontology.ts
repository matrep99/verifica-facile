export const keywordBank = {
  "Matematica": { base:["equazione","incognita","primo grado","bilanciare","uguaglianza"], syns:["x","risolvi","membro","trasporta"] },
  "Storia":     { base:["roma antica","repubblica","impero","cesare","senato"], syns:["console","patrizi","plebei"] },
  "Scienze":    { base:["fotosintesi","clorofilla","stomi","anidride carbonica","ossigeno"], syns:["luce solare","CO2","H2O"] },
  "Italiano":   { base:["analisi del periodo","proposizione","coordinata","subordinata","congiunzione"], syns:["relative","temporali","causali"] },
  "Inglese":    { base:["simple past","irregular verbs","did","was","were"], syns:["yesterday","ago","didn't"] }
} as const;

export function classBand(classLabel: string)
{
  const s = classLabel.toLowerCase();
  if (s.includes("prim") || /\b1a\b|\b2a\b|\b3a\b/.test(s)) return { band:"primaria",  maxLen:30 };
  if (s.includes("media"))                                return { band:"media",     maxLen:45 };
  return { band:"superiore", maxLen:60 };
}