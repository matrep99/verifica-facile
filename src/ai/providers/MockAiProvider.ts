import { AiProvider, GenerateParams, GradeParams, GradeResponse } from './AiProvider';
import { QuestionsOut, QuestionOut } from '../schema';
import { postProcess, validateItem, type AlignmentContext } from '../align';
import { classMap, extractKeywords } from '../ontology';

export class MockAiProvider extends AiProvider {
  private templates = {
    matematica: {
      primaria: {
        mcq: [
          {
            template: "Quanto fa {a} + {b}?",
            generator: () => {
              const a = Math.floor(Math.random() * 20) + 1;
              const b = Math.floor(Math.random() * 20) + 1; 
              const result = a + b;
              const options = [result - 2, result, result + 1, result + 3];
              return {
                prompt: `Quanto fa ${a} + ${b}?`,
                options: options.map(n => n.toString()),
                correctAnswer: { selected: 1 },
                points: 1
              };
            }
          },
          {
            template: "Quale numero è maggiore?",
            generator: () => {
              const nums = [12, 8, 15, 9];
              return {
                prompt: "Quale di questi numeri è il maggiore?",
                options: nums.map(n => n.toString()),
                correctAnswer: { selected: 2 },
                points: 1
              };
            }
          }
        ],
        tf: [
          {
            prompt: "10 + 5 è uguale a 15",
            correctAnswer: { value: true },
            points: 1
          },
          {
            prompt: "7 è maggiore di 9", 
            correctAnswer: { value: false },
            points: 1
          }
        ],
        short: [
          {
            prompt: "Scrivi il numero che viene dopo 19",
            correctAnswer: { expected: "20" },
            points: 2
          }
        ]
      },
      media: {
        mcq: [
          {
            template: "Risolvi l'equazione",
            generator: () => {
              const x = Math.floor(Math.random() * 10) + 1;
              const b = Math.floor(Math.random() * 15) + 5;
              const c = 2 * x + b;
              return {
                prompt: `Risolvi l'equazione: 2x + ${b} = ${c}`,
                options: [`x = ${x-1}`, `x = ${x}`, `x = ${x+1}`, `x = ${x+2}`],
                correctAnswer: { selected: 1 },
                points: 2
              };
            }
          }
        ],
        tf: [
          {
            prompt: "In un'equazione di primo grado l'incognita ha esponente 1",
            correctAnswer: { value: true },
            points: 1
          }
        ],
        short: [
          {
            prompt: "Calcola il perimetro di un quadrato con lato 6 cm",
            correctAnswer: { expected: "24 cm" },
            points: 2
          }
        ]
      }
    },
    
    storia: {
      media: {
        mcq: [
          {
            prompt: "Chi fu il primo imperatore romano?",
            options: ["Giulio Cesare", "Ottaviano Augusto", "Nerone", "Traiano"],
            correctAnswer: { selected: 1 },
            points: 1
          },
          {
            prompt: "In quale anno cadde l'Impero Romano d'Occidente?",
            options: ["456 d.C.", "476 d.C.", "496 d.C.", "516 d.C."],
            correctAnswer: { selected: 1 },
            points: 1
          }
        ],
        tf: [
          {
            prompt: "Roma antica era inizialmente una repubblica",
            correctAnswer: { value: true },
            points: 1
          }
        ],
        short: [
          {
            prompt: "Descrivi brevemente il Senato romano",
            correctAnswer: { expected: "Organo consultivo della Repubblica romana composto da ex-magistrati" },
            points: 3
          }
        ]
      }
    },
    
    scienze: {
      primaria: {
        mcq: [
          {
            prompt: "Durante la fotosintesi le piante producono:",
            options: ["Anidride carbonica", "Ossigeno", "Azoto", "Vapore"],
            correctAnswer: { selected: 1 },
            points: 1
          }
        ],
        tf: [
          {
            prompt: "La clorofilla è verde",
            correctAnswer: { value: true },
            points: 1
          }
        ],
        short: [
          {
            prompt: "Cosa serve alle piante per la fotosintesi?",
            correctAnswer: { expected: "Luce solare, anidride carbonica e acqua" },
            points: 2
          }
        ]
      }
    },
    
    italiano: {
      media: {
        mcq: [
          {
            prompt: "Chi scrisse 'I Promessi Sposi'?",
            options: ["Dante", "Manzoni", "Leopardi", "Petrarca"],
            correctAnswer: { selected: 1 },
            points: 1
          }
        ],
        tf: [
          {
            prompt: "Il soggetto è sempre espresso nella frase",
            correctAnswer: { value: false },
            points: 1
          }
        ],
        short: [
          {
            prompt: "Cos'è una metafora?",
            correctAnswer: { expected: "Figura retorica che trasferisce il significato da un termine a un altro" },
            points: 2
          }
        ]
      }
    }
  };

  async generate(params: GenerateParams): Promise<QuestionsOut> {
    // Simula latenza API
    await this.delay(800 + Math.random() * 400);
    
    const subject = params.subject.toLowerCase();
    const classInfo = classMap(params.classLabel);
    const keywords = extractKeywords(params.subject, params.topic, params.description);
    
    const ctx: AlignmentContext = {
      subject: params.subject,
      topic: params.topic,
      classLabel: params.classLabel,
      description: params.description,
      keywords,
      classInfo,
      minItemCoverage: 0.6,
      minAvgCoverage: 0.65,
      difficulty: params.difficulty
    };
    
    const templates = this.getTemplatesFor(subject, classInfo.band);
    const questions: QuestionOut[] = [];
    
    // Distribuzione tipi
    const count = Math.min(params.count, 10); // Max 10 domande
    let mcqCount = Math.ceil(count * 0.6);
    let tfCount = Math.ceil((count - mcqCount) * 0.5);
    let shortCount = count - mcqCount - tfCount;
    
    // Applica mix enforcement se richiesto
    if (params.mix && count >= 5) {
      mcqCount = Math.max(3, mcqCount);
      tfCount = Math.max(1, tfCount);
      shortCount = Math.max(1, shortCount);
    }
    
    // Genera MCQ
    for (let i = 0; i < mcqCount && templates.mcq.length > 0; i++) {
      const template = templates.mcq[i % templates.mcq.length];
      let question: QuestionOut;
      
      if (template.generator) {
        question = { type: 'MCQ', ...template.generator() };
      } else {
        question = { type: 'MCQ', ...template };
      }
      
      // Contestualizza con topic
      question.prompt = this.contextualizePrompt(question.prompt, params.topic, params.subject);
      question = postProcess(question);
      
      const validation = validateItem(question, ctx);
      if (validation.ok || questions.length < count / 2) { // Accetta almeno metà
        questions.push(question);
      }
    }
    
    // Genera TF  
    for (let i = 0; i < tfCount && templates.tf.length > 0; i++) {
      const template = templates.tf[i % templates.tf.length];
      let question: QuestionOut = { type: 'TF', ...template };
      
      question.prompt = this.contextualizePrompt(question.prompt, params.topic, params.subject);
      question = postProcess(question);
      
      const validation = validateItem(question, ctx);
      if (validation.ok || questions.length < count / 2) {
        questions.push(question);
      }
    }
    
    // Genera SHORT
    for (let i = 0; i < shortCount && templates.short.length > 0; i++) {
      const template = templates.short[i % templates.short.length];
      let question: QuestionOut = { type: 'SHORT', ...template };
      
      question.prompt = this.contextualizePrompt(question.prompt, params.topic, params.subject);
      question = postProcess(question);
      
      const validation = validateItem(question, ctx);
      if (validation.ok || questions.length < count / 2) {
        questions.push(question);
      }
    }
    
    // Riempi se mancano domande
    while (questions.length < count) {
      const fallback: QuestionOut = {
        type: 'MCQ',
        prompt: `Domanda su ${params.topic} per ${params.classLabel}`,
        options: ['Opzione A', 'Opzione B', 'Opzione C', 'Opzione D'],
        correctAnswer: { selected: 0 },
        points: this.getPointsForDifficulty(params.difficult)
      };
      questions.push(postProcess(fallback));
    }
    
    return { questions: questions.slice(0, count) };
  }

  async grade(params: GradeParams): Promise<GradeResponse> {
    await this.delay(600 + Math.random() * 300);
    
    const studentAnswer = params.studentAnswer.toLowerCase().trim();
    const modelAnswer = (params.modelAnswer || '').toLowerCase();
    
    if (studentAnswer.length === 0) {
      return {
        suggestedScore: 0,
        feedback: 'Risposta non fornita.'
      };
    }
    
    if (studentAnswer.length < 10) {
      return {
        suggestedScore: Math.round(params.maxPoints * 0.3),
        feedback: 'Risposta troppo breve. Sviluppa maggiormente il concetto.'
      };
    }
    
    // Euristica coverage
    const overlap = this.calculateOverlap(studentAnswer, modelAnswer);
    const suggestedScore = Math.min(params.maxPoints, Math.round(params.maxPoints * overlap));
    
    let feedback = '';
    if (overlap > 0.8) {
      feedback = 'Risposta completa e corretta. Ben strutturata!';
    } else if (overlap > 0.6) {
      feedback = 'Buona risposta, ma mancano alcuni dettagli importanti.';
    } else if (overlap > 0.4) {
      feedback = 'Risposta parzialmente corretta. Approfondisci alcuni concetti.';
    } else {
      feedback = 'Risposta insufficiente. Rivedere l\'argomento.';
    }
    
    return { suggestedScore: Math.max(0, suggestedScore), feedback };
  }
  
  private getTemplatesFor(subject: string, band: string) {
    const subjectTemplates = this.templates[subject as keyof typeof this.templates];
    if (!subjectTemplates) {
      return { mcq: [], tf: [], short: [] };
    }
    
    const levelTemplates = subjectTemplates[band as keyof typeof subjectTemplates] || 
                          subjectTemplates.media || 
                          Object.values(subjectTemplates)[0];
    
    return {
      mcq: levelTemplates?.mcq || [],
      tf: levelTemplates?.tf || [],
      short: levelTemplates?.short || []
    };
  }
  
  private contextualizePrompt(prompt: string, topic: string, subject: string): string {
    // Semplice contestualizzazione
    if (topic && !prompt.toLowerCase().includes(topic.toLowerCase())) {
      const contextPrefix = `Riguardo a ${topic}: `;
      return contextPrefix + prompt.charAt(0).toLowerCase() + prompt.slice(1);
    }
    return prompt;
  }
  
  private getPointsForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2;
    }
  }
  
  private calculateOverlap(student: string, model: string): number {
    if (!model) return Math.random() * 0.6 + 0.3;
    
    const studentWords = new Set(student.split(/\s+/).filter(w => w.length > 2));
    const modelWords = new Set(model.split(/\s+/).filter(w => w.length > 2));
    
    if (modelWords.size === 0) return 0.5;
    
    let commonWords = 0;
    studentWords.forEach(word => {
      if (modelWords.has(word)) commonWords++;
    });
    
    return Math.min(1, commonWords / Math.max(modelWords.size, studentWords.size) + Math.random() * 0.2);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}