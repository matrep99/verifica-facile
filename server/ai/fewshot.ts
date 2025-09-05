export const fewShotExamples = {
  "Matematica": [
    {
      type: "MCQ",
      prompt: "Risolvi l'equazione di primo grado: 2x + 5 = 13",
      options: ["x = 2", "x = 4", "x = 6", "x = 8"],
      correctAnswer: { selected: 1 },
      points: 2,
      explainForTeacher: "Equazione lineare semplice per scuola media"
    },
    {
      type: "TF", 
      prompt: "In una frazione, se moltiplico numeratore e denominatore per lo stesso numero, ottengo una frazione equivalente",
      correctAnswer: { value: true },
      points: 1,
      explainForTeacher: "Proprietà fondamentale delle frazioni equivalenti"
    }
  ],
  
  "Storia": [
    {
      type: "MCQ",
      prompt: "Chi fu il primo imperatore di Roma antica?",
      options: ["Giulio Cesare", "Ottaviano Augusto", "Marco Antonio", "Nerone"],
      correctAnswer: { selected: 1 },
      points: 1,
      explainForTeacher: "Passaggio da Repubblica a Impero romano"
    },
    {
      type: "SHORT", 
      prompt: "Descrivi brevemente il sistema feudale del Medioevo",
      correctAnswer: { expected: "Sistema basato su vassallaggio, terre in cambio di servizio militare" },
      points: 3,
      explainForTeacher: "Organizzazione sociale medievale"
    }
  ],
  
  "Scienze": [
    {
      type: "MCQ",
      prompt: "Durante la fotosintesi, le piante producono:",
      options: ["Anidride carbonica", "Ossigeno", "Azoto", "Vapore acqueo"],
      correctAnswer: { selected: 1 },
      points: 1,
      explainForTeacher: "Processo di fotosintesi clorofilliana"
    },
    {
      type: "SHORT",
      prompt: "Cosa serve alle piante per fare la fotosintesi?",
      correctAnswer: { expected: "Luce solare, anidride carbonica e acqua" },
      points: 2,
      explainForTeacher: "Elementi necessari per la fotosintesi"
    }
  ],
  
  "Italiano": [
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
    }
  ],
  
  "Inglese": [
    {
      type: "MCQ", 
      prompt: "Which is the correct form of Simple Past for the verb 'go'?",
      options: ["goed", "went", "gone", "going"],
      correctAnswer: { selected: 1 },
      points: 1,
      explainForTeacher: "Irregular verb in Simple Past"
    },
    {
      type: "SHORT",
      prompt: "Complete: Yesterday I _____ to school by bus (use 'go' in Simple Past)",
      correctAnswer: { expected: "went" },
      points: 2,
      explainForTeacher: "Application of irregular past forms"
    }
  ]
};

export function getFewShotExamples(subject: string): any[] {
  return fewShotExamples[subject as keyof typeof fewShotExamples] || [];
}