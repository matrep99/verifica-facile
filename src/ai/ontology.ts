// Ontologia per allineamento strict delle domande AI

export const keywordBank: Record<string, { base: string[], synonyms: Record<string, string[]> }> = {
  matematica: {
    base: [
      'equazione', 'incognita', 'bilanciare', 'primo grado', 'secondo grado',
      'frazione', 'denominatore', 'numeratore', 'semplificare', 'mcm', 'mcd',
      'percentuale', 'proporzione', 'rapporto', 'geometria', 'teorema',
      'triangolo', 'quadrilatero', 'cerchio', 'area', 'perimetro', 'volume',
      'coordinate', 'piano cartesiano', 'funzione', 'grafico'
    ],
    synonyms: {
      'equazione': ['x', 'risolvi', 'uguale', 'soluzione', 'incognita'],
      'frazione': ['rapporto', 'divisione', 'numeratore', 'denominatore'],
      'percentuale': ['per cento', '%', 'sconto', 'interesse'],
      'geometria': ['forma', 'figura', 'misura', 'angolo', 'lato']
    }
  },
  
  storia: {
    base: [
      'roma antica', 'repubblica', 'impero', 'cesare', 'augusto',
      'medioevo', 'feudalesimo', 'carlo magno', 'crociate',
      'rinascimento', 'umanesimo', 'leonardo', 'michelangelo',
      'scoperte geografiche', 'colombo', 'america',
      'rivoluzione francese', 'napoleone', 'risorgimento',
      'unità italia', 'garibaldi', 'cavour'
    ],
    synonyms: {
      'roma antica': ['romano', 'latino', 'colosseo', 'foro', 'senato'],
      'medioevo': ['medievale', 'cavaliere', 'castello', 'monastero'],
      'rinascimento': ['umanista', 'arte', 'cultura', 'firenze'],
      'risorgimento': ['unificazione', 'patriota', 'indipendenza']
    }
  },
  
  scienze: {
    base: [
      'fotosintesi', 'clorofilla', 'stomi', 'anidride carbonica', 'ossigeno',
      'cellula', 'membrana', 'nucleo', 'citoplasma', 'mitocondri',
      'digestione', 'respirazione', 'circolazione', 'sistema nervoso',
      'atomo', 'elettrone', 'protone', 'neutrone', 'elemento',
      'composto', 'reazione chimica', 'acido', 'base', 'ph',
      'forza', 'energia', 'movimento', 'velocità', 'accelerazione'
    ],
    synonyms: {
      'fotosintesi': ['pianta', 'sole', 'luce', 'glucosio', 'energia'],
      'cellula': ['organismo', 'vita', 'tessuto', 'organo'],
      'atomo': ['particella', 'materia', 'molecola'],
      'energia': ['lavoro', 'potenza', 'calore', 'elettricità']
    }
  },
  
  italiano: {
    base: [
      'analisi del periodo', 'proposizione', 'coordinata', 'subordinata',
      'soggetto', 'predicato', 'complemento', 'attributo', 'apposizione',
      'nome', 'aggettivo', 'verbo', 'avverbio', 'preposizione',
      'metafora', 'similitudine', 'personificazione', 'allitterazione',
      'dante', 'divina commedia', 'inferno', 'purgatorio', 'paradiso',
      'manzoni', 'promessi sposi', 'leopardi', 'petrarca', 'boccaccio'
    ],
    synonyms: {
      'analisi del periodo': ['sintassi', 'frase', 'periodo', 'proposizione'],
      'metafora': ['figura retorica', 'immagine', 'significato'],
      'dante': ['alighieri', 'poeta', 'firenze', 'beatrice'],
      'manzoni': ['alessandro', 'romanzo', 'renzo', 'lucia']
    }
  },
  
  inglese: {
    base: [
      'simple past', 'irregular verbs', 'did', 'was', 'were',
      'present perfect', 'have', 'has', 'past participle',
      'future', 'will', 'going to', 'modal verbs', 'can', 'could',
      'conditional', 'would', 'should', 'passive voice',
      'article', 'preposition', 'adjective', 'adverb'
    ],
    synonyms: {
      'simple past': ['passato', 'yesterday', 'ago', 'last'],
      'present perfect': ['esperienza', 'already', 'just', 'never'],
      'future': ['domani', 'tomorrow', 'next', 'plans'],
      'modal verbs': ['abilità', 'possibilità', 'permission']
    }
  }
};

export type ClassBand = 'primaria' | 'media' | 'superiore';

export interface ClassInfo {
  band: ClassBand;
  minAge: number;
  maxAge: number;
  lexicon: 'base' | 'medio' | 'avanzato';
}

export const classMap = (classLabel: string): ClassInfo => {
  const normalized = classLabel.toLowerCase();
  
  // Primaria (6-11 anni)
  if (normalized.includes('1') || normalized.includes('2') || normalized.includes('3') ||
      normalized.includes('4') || normalized.includes('5') || 
      normalized.includes('prima') || normalized.includes('seconda') || 
      normalized.includes('terza') || normalized.includes('quarta') || 
      normalized.includes('quinta') || normalized.includes('elementare')) {
    return { band: 'primaria', minAge: 6, maxAge: 11, lexicon: 'base' };
  }
  
  // Media (11-14 anni)
  if (normalized.includes('1ª') || normalized.includes('2ª') || normalized.includes('3ª') ||
      normalized.includes('media') || normalized.includes('medie')) {
    return { band: 'media', minAge: 11, maxAge: 14, lexicon: 'medio' };
  }
  
  // Superiore (14-19 anni)
  return { band: 'superiore', minAge: 14, maxAge: 19, lexicon: 'avanzato' };
};

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