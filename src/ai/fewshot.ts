// Few-shot examples per disciplina e classe (JSON valido conforme allo schema)

export const fewShotExamples = {
  matematica: {
    media: [
      {
        type: "MCQ",
        prompt: "Risolvi l'equazione di primo grado: 2x + 5 = 13",
        options: ["x = 2", "x = 4", "x = 6", "x = 8"],
        correctAnswer: { selected: 1 },
        points: 2,
        explainForTeacher: "Equazione lineare semplice per 2ª media"
      },
      {
        type: "TF", 
        prompt: "In una frazione, se moltiplico numeratore e denominatore per lo stesso numero, ottengo una frazione equivalente",
        correctAnswer: { value: true },
        points: 1,
        explainForTeacher: "Proprietà fondamentale delle frazioni equivalenti"
      },
      {
        type: "SHORT",
        prompt: "Calcola l'area di un triangolo con base 8 cm e altezza 5 cm",
        correctAnswer: { expected: "20 cm²" },
        points: 2,
        explainForTeacher: "Formula area triangolo: (b × h) / 2"
      }
    ]
  },
  
  storia: {
    media: [
      {
        type: "MCQ",
        prompt: "Chi fu il primo imperatore di Roma antica?",
        options: ["Giulio Cesare", "Ottaviano Augusto", "Marco Antonio", "Nerone"],
        correctAnswer: { selected: 1 },
        points: 1,
        explainForTeacher: "Passaggio da Repubblica a Impero romano"
      },
      {
        type: "TF",
        prompt: "Le invasioni barbariche contribuirono alla caduta dell'Impero Romano d'Occidente",
        correctAnswer: { value: true },
        points: 1,
        explainForTeacher: "Cause multiple della caduta dell'Impero"
      },
      {
        type: "SHORT", 
        prompt: "Descrivi brevemente il sistema feudale del Medioevo",
        correctAnswer: { expected: "Sistema basato su vassallaggio, terre in cambio di servizio militare e fedeltà" },
        points: 3,
        explainForTeacher: "Organizzazione sociale medievale"
      }
    ]
  },
  
  scienze: {
    primaria: [
      {
        type: "MCQ",
        prompt: "Durante la fotosintesi, le piante producono:",
        options: ["Anidride carbonica", "Ossigeno", "Azoto", "Vapore acqueo"],
        correctAnswer: { selected: 1 },
        points: 1,
        explainForTeacher: "Processo di fotosintesi clorofilliana"
      },
      {
        type: "TF",
        prompt: "Gli stomi sono piccole aperture sulle foglie",
        correctAnswer: { value: true },
        points: 1,
        explainForTeacher: "Strutture per scambio gassoso nelle piante"
      },
      {
        type: "SHORT",
        prompt: "Cosa serve alle piante per fare la fotosintesi?",
        correctAnswer: { expected: "Luce solare, anidride carbonica e acqua" },
        points: 2,
        explainForTeacher: "Elementi necessari per la fotosintesi"
      }
    ]
  },
  
  italiano: {
    superiore: [
      {
        type: "MCQ",
        prompt: "Nell'analisi del periodo, una proposizione subordinata dipende da:",
        options: ["Un'altra subordinata", "La proposizione principale", "Un complemento", "Un attributo"],
        correctAnswer: { selected: 1 },
        points: 2,
        explainForTeacher: "Struttura sintattica del periodo complesso"
      },
      {
        type: "TF",
        prompt: "La metafora è una figura retorica che stabilisce un paragone diretto tra due elementi",
        correctAnswer: { value: false },
        points: 1,
        explainForTeacher: "Differenza tra metafora e similitudine"
      },
      {
        type: "SHORT",
        prompt: "Identifica il tema principale del canto III dell'Inferno di Dante",
        correctAnswer: { expected: "L'antinferno e gli ignavi, anime che non scelsero mai nella vita" },
        points: 3,
        explainForTeacher: "Analisi tematica della Divina Commedia"
      }
    ]
  },
  
  inglese: {
    media: [
      {
        type: "MCQ", 
        prompt: "Which is the correct form of Simple Past for the verb 'go'?",
        options: ["goed", "went", "gone", "going"],
        correctAnswer: { selected: 1 },
        points: 1,
        explainForTeacher: "Irregular verb in Simple Past"
      },
      {
        type: "TF",
        prompt: "We use 'did' to make questions in Simple Past with irregular verbs",
        correctAnswer: { value: true },
        points: 1,
        explainForTeacher: "Question formation in Simple Past"
      },
      {
        type: "SHORT",
        prompt: "Complete: Yesterday I _____ to school by bus (use 'go' in Simple Past)",
        correctAnswer: { expected: "went" },
        points: 2,
        explainForTeacher: "Application of irregular past forms"
      }
    ]
  }
};

/**
 * Ottieni esempi few-shot pertinenti per disciplina e classe
 */
export const getFewShotExamples = (subject: string, classLabel: string): any[] => {
  const normalizedSubject = subject.toLowerCase();
  const examples = fewShotExamples[normalizedSubject as keyof typeof fewShotExamples];
  
  if (!examples) {
    console.warn(`No few-shot examples for subject: ${subject}`);
    return [];
  }
  
  // Determina il livello più appropriato
  const classLower = classLabel.toLowerCase();
  let level: keyof typeof examples;
  
  if (classLower.includes('primaria') || classLower.includes('elementare')) {
    level = 'primaria' as keyof typeof examples;
  } else if (classLower.includes('media') || classLower.includes('medie')) {
    level = 'media' as keyof typeof examples;
  } else {
    level = 'superiore' as keyof typeof examples;
  }
  
  // Fallback se il livello non esiste per questa disciplina
  if (!examples[level]) {
    const availableLevels = Object.keys(examples);
    level = availableLevels[0] as keyof typeof examples;
  }
  
  return examples[level] || [];
};