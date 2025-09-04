export const keywordBank = {
  "Matematica": {
    base: ["equazione","incognita","primo grado","bilanciare","uguaglianza","frazione","denominatore","numeratore","percentuale","teorema"],
    synonyms: { 
      "equazione": ["x","risolvi","=","uguale","soluzione"],
      "incognita": ["variabile","x","y"],
      "frazione": ["rapporto","divisione","numeratore","denominatore"],
      "percentuale": ["per cento","%","sconto","interesse"]
    }
  },
  "Storia": {
    base: ["roma antica","repubblica","impero","cesare","senato","augusto","medioevo","feudalesimo","rinascimento","napoleone"],
    synonyms: { 
      "repubblica": ["console","patrizi","plebei","senato"],
      "impero": ["imperatore","augusto","cesare"],
      "medioevo": ["medievale","cavaliere","castello","feudale"],
      "rinascimento": ["umanista","arte","cultura","firenze"]
    }
  },
  "Scienze": {
    base: ["fotosintesi","clorofilla","stomi","anidride carbonica","ossigeno","cellula","nucleo","digestione","respirazione","atomo"],
    synonyms: { 
      "fotosintesi": ["luce solare","CO2","H2O","glucosio","pianta"],
      "cellula": ["membrana","citoplasma","nucleo","organismo"],
      "digestione": ["stomaco","intestino","enzimi","nutrienti"],
      "atomo": ["protone","elettrone","neutrone","elemento"]
    }
  },
  "Italiano": {
    base: ["analisi del periodo","proposizione","coordinata","subordinata","congiunzione","soggetto","predicato","complemento"],
    synonyms: { 
      "subordinata": ["relative","temporali","causali","consecutive"],
      "proposizione": ["frase","periodo","principale"],
      "analisi del periodo": ["sintassi","grammatica","periodo"],
      "complemento": ["oggetto","termine","specificazione"]
    }
  },
  "Inglese": {
    base: ["simple past","irregular verbs","did","was","were","present perfect","future","modal verbs"],
    synonyms: { 
      "simple past": ["yesterday","ago","didn't","past"],
      "present perfect": ["have","has","already","just","never"],
      "future": ["will","going to","tomorrow","plans"],
      "modal verbs": ["can","could","should","would"]
    }
  }
} as const;

export type ClassBand = 'primaria' | 'media' | 'superiore';

export interface ClassInfo {
  band: ClassBand;
  minAge: number;
  maxAge: number;
  lexicon: 'base' | 'medio' | 'avanzato';
}

export function classMap(classLabel: string): ClassInfo {
  const s = classLabel.toLowerCase();
  if (s.includes("prim") || s.includes("elementare") || /1[aª]|2[aª]|3[aª]|4[aª]|5[aª]/.test(s)) {
    return { band: "primaria", lexicon: "base", minAge: 6, maxAge: 10 };
  }
  if (s.includes("media") || s.includes("medie") || /1[aª]\s*media|2[aª]\s*media|3[aª]\s*media/.test(s)) {
    return { band: "media", lexicon: "medio", minAge: 11, maxAge: 14 };
  }
  return { band: "superiore", lexicon: "avanzato", minAge: 14, maxAge: 19 };
}

// Stopwords italiane comuni
export const stopWords = new Set([
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le',
  'un', 'una', 'uno', 'del', 'dello', 'della', 'dei', 'degli', 'delle', 'al', 'allo', 'alla',
  'ai', 'agli', 'alle', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle', 'nel', 'nello',
  'nella', 'nei', 'negli', 'nelle', 'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'e', 'ed', 'o', 'od', 'ma', 'però', 'anche', 'se', 'che', 'chi', 'cosa', 'quando', 'dove',
  'come', 'perché', 'mentre', 'durante', 'dopo', 'prima', 'poi', 'ancora', 'già', 'sempre',
  'mai', 'molto', 'poco', 'tanto', 'più', 'meno', 'bene', 'male', 'meglio', 'peggio'
]);