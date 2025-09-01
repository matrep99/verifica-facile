import { Question, GenerateQuestionsRequest, AiGradeRequest, AiGradeResponse } from '@/types';

// Mock AI Provider per generazione domande e correzioni
export class MockAiProvider {
  private topics = {
    'storia': {
      mcq: [
        { prompt: 'Chi fu il primo imperatore romano?', options: ['Giulio Cesare', 'Augusto', 'Nerone', 'Traiano'], correct: 1 },
        { prompt: 'In quale anno cadde l\'Impero Romano d\'Occidente?', options: ['406 d.C.', '476 d.C.', '500 d.C.', '550 d.C.'], correct: 1 },
        { prompt: 'Quale fu la battaglia decisiva delle Guerre Puniche?', options: ['Canne', 'Zama', 'Trebbia', 'Azio'], correct: 1 },
      ],
      tf: [
        { prompt: 'Roma fu fondata nel 753 a.C. secondo la leggenda.', correct: true },
        { prompt: 'Spartaco fu un imperatore romano.', correct: false },
        { prompt: 'Le Guerre Puniche furono combattute contro Cartagine.', correct: true },
      ],
      short: [
        { prompt: 'Descrivi brevemente la riforma di Drago ad Atene.', answer: 'Drago istituì il primo codice scritto di leggi ad Atene nel VII secolo a.C.' },
        { prompt: 'Quale fu il ruolo del Senato nella Repubblica Romana?', answer: 'Il Senato era l\'organo consultivo principale della Repubblica Romana.' },
      ]
    },
    'matematica': {
      mcq: [
        { prompt: 'Quanto fa 15 + 27?', options: ['41', '42', '43', '44'], correct: 1 },
        { prompt: 'Qual è il risultato di 8²?', options: ['16', '32', '64', '128'], correct: 2 },
        { prompt: 'Quale di questi numeri è primo?', options: ['9', '15', '17', '21'], correct: 2 },
      ],
      tf: [
        { prompt: 'Il numero zero è un numero naturale.', correct: false },
        { prompt: 'Tutti i numeri pari maggiori di 2 sono numeri composti.', correct: true },
        { prompt: 'π è un numero razionale.', correct: false },
      ],
      short: [
        { prompt: 'Calcola l\'area di un triangolo con base 8 cm e altezza 6 cm.', answer: '24 cm²' },
        { prompt: 'Risolvi l\'equazione: 2x + 5 = 13', answer: 'x = 4' },
      ]
    },
    'scienze': {
      mcq: [
        { prompt: 'Qual è il simbolo chimico dell\'oro?', options: ['Go', 'Au', 'Ag', 'Or'], correct: 1 },
        { prompt: 'Quanti cromosomi ha l\'essere umano?', options: ['44', '46', '48', '50'], correct: 1 },
        { prompt: 'Quale pianeta è più vicino al Sole?', options: ['Venere', 'Terra', 'Mercurio', 'Marte'], correct: 2 },
      ],
      tf: [
        { prompt: 'La fotosintesi avviene solo nelle foglie.', correct: false },
        { prompt: 'L\'acqua bolle a 100°C a pressione atmosferica.', correct: true },
        { prompt: 'Tutti i metalli sono solidi a temperatura ambiente.', correct: false },
      ],
      short: [
        { prompt: 'Spiega brevemente il processo della fotosintesi.', answer: 'Le piante convertono anidride carbonica e acqua in glucosio usando l\'energia solare.' },
        { prompt: 'Cosa sono gli anticorpi?', answer: 'Proteine prodotte dal sistema immunitario per combattere antigeni specifici.' },
      ]
    },
    'italiano': {
      mcq: [
        { prompt: 'Chi scrisse "La Divina Commedia"?', options: ['Petrarca', 'Boccaccio', 'Dante', 'Ariosto'], correct: 2 },
        { prompt: 'In quale secolo visse Alessandro Manzoni?', options: ['XVII', 'XVIII', 'XIX', 'XX'], correct: 2 },
        { prompt: 'Qual è il femminile di "poeta"?', options: ['poeta', 'poetessa', 'poetisa', 'poetrice'], correct: 1 },
      ],
      tf: [
        { prompt: 'Il sonetto è composto da 14 versi.', correct: true },
        { prompt: 'Leopardi fu un poeta del Romanticismo.', correct: true },
        { prompt: 'L\'Eneide fu scritta in italiano.', correct: false },
      ],
      short: [
        { prompt: 'Definisci il termine "metafora".', answer: 'Figura retorica che trasferisce il significato da un termine all\'altro per somiglianza.' },
        { prompt: 'Qual è il tema principale de "I Promessi Sposi"?', answer: 'L\'amore tra Renzo e Lucia e la Provvidenza divina nella storia.' },
      ]
    }
  };

  async generateQuestions(request: GenerateQuestionsRequest): Promise<Omit<Question, 'id' | 'testId' | 'questionIndex'>[]> {
    // Simula latenza API
    await this.delay(800 + Math.random() * 400);

    const topic = this.findTopic(request.topic);
    const questions: Omit<Question, 'id' | 'testId' | 'questionIndex'>[] = [];
    const count = request.count || 5;

    // Distribuzione: 60% MCQ, 20% TF, 20% SHORT
    const mcqCount = Math.ceil(count * 0.6);
    const tfCount = Math.ceil((count - mcqCount) * 0.5);
    const shortCount = count - mcqCount - tfCount;

    // Genera MCQ
    for (let i = 0; i < mcqCount && i < topic.mcq.length; i++) {
      const mcq = topic.mcq[i % topic.mcq.length];
      questions.push({
        type: 'MCQ',
        prompt: mcq.prompt,
        options: mcq.options,
        correctAnswer: { selected: mcq.correct },
        points: 1
      });
    }

    // Genera Vero/Falso
    for (let i = 0; i < tfCount && i < topic.tf.length; i++) {
      const tf = topic.tf[i % topic.tf.length];
      questions.push({
        type: 'TF',
        prompt: tf.prompt,
        correctAnswer: { boolean: tf.correct },
        points: 1
      });
    }

    // Genera Risposta Breve
    for (let i = 0; i < shortCount && i < topic.short.length; i++) {
      const short = topic.short[i % topic.short.length];
      questions.push({
        type: 'SHORT',
        prompt: short.prompt,
        correctAnswer: { value: short.answer },
        points: 2
      });
    }

    return questions;
  }

  async gradeAnswer(request: AiGradeRequest): Promise<AiGradeResponse> {
    // Simula latenza API
    await this.delay(600 + Math.random() * 300);

    const studentAnswer = request.studentAnswer.toLowerCase().trim();
    const modelAnswer = (request.modelAnswer || '').toLowerCase();
    
    let suggestedScore = 0;
    let feedback = '';

    if (studentAnswer.length === 0) {
      feedback = 'Risposta non fornita.';
    } else if (studentAnswer.length < 10) {
      suggestedScore = Math.round(request.maxPoints * 0.3);
      feedback = 'Risposta troppo breve. Sviluppa maggiormente il concetto.';
    } else {
      // Calcolo euristica basato su sovrapposizione di parole chiave
      const scoreRatio = this.calculateOverlap(studentAnswer, modelAnswer);
      suggestedScore = Math.min(request.maxPoints, Math.round(request.maxPoints * scoreRatio));
      
      if (scoreRatio > 0.8) {
        feedback = 'Risposta completa e corretta. Ben strutturata!';
      } else if (scoreRatio > 0.6) {
        feedback = 'Buona risposta, ma mancano alcuni dettagli importanti.';
      } else if (scoreRatio > 0.4) {
        feedback = 'Risposta parzialmente corretta. Approfondisci alcuni concetti.';
      } else if (scoreRatio > 0.2) {
        feedback = 'Risposta insufficiente. Rivedere l\'argomento.';
      } else {
        feedback = 'Risposta non pertinente o scorretta.';
      }
    }

    return {
      suggestedScore: Math.max(0, suggestedScore),
      feedback
    };
  }

  private findTopic(topic: string): any {
    const normalized = topic.toLowerCase();
    if (normalized.includes('storia') || normalized.includes('roman')) return this.topics.storia;
    if (normalized.includes('mat') || normalized.includes('calcol')) return this.topics.matematica;
    if (normalized.includes('scien') || normalized.includes('biolog') || normalized.includes('chim')) return this.topics.scienze;
    if (normalized.includes('italian') || normalized.includes('letter')) return this.topics.italiano;
    
    // Default: storia
    return this.topics.storia;
  }

  private calculateOverlap(student: string, model: string): number {
    if (!model) return Math.random() * 0.6 + 0.3; // Score casuale tra 0.3 e 0.9

    const studentWords = new Set(student.split(/\s+/).filter(w => w.length > 2));
    const modelWords = new Set(model.split(/\s+/).filter(w => w.length > 2));
    
    if (modelWords.size === 0) return 0.5;
    
    let commonWords = 0;
    studentWords.forEach(word => {
      if (modelWords.has(word)) commonWords++;
    });
    
    const overlap = commonWords / Math.max(modelWords.size, studentWords.size);
    return Math.min(1, overlap + Math.random() * 0.2); // Aggiungi variazione
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockAi = new MockAiProvider();