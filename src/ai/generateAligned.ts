import { AiProvider } from './providers/AiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { MockAiProvider } from './providers/MockAiProvider';
import { 
  extractKeywords, 
  validateItem, 
  scoreItem, 
  enforceMix,
  type AlignmentContext 
} from './align';
import { classMap } from './ontology';
import { QuestionOut, type Diagnostics, type Diagnostic } from './schema';

const MAX_TRIES = 3;

export interface GenerateAlignedParams {
  subject: string;
  topic: string;
  classLabel: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  mix?: boolean;
  strict?: boolean;
}

export interface GenerateAlignedResult {
  questions: QuestionOut[];
  diagnostics: Diagnostics;
}

/**
 * Funzione orchestratrice per generazione domande allineate
 */
export const generateAligned = async (params: GenerateAlignedParams): Promise<GenerateAlignedResult> => {
  // Defaults
  const {
    subject,
    topic,
    classLabel,
    description,
    difficulty = 'medium',
    count = 5,
    mix = true,
    strict = true
  } = params;
  
  // Validazione parametri
  if (!subject || !topic || !classLabel) {
    throw new Error('Subject, topic e classLabel sono obbligatori');
  }
  
  const finalCount = Math.min(Math.max(count, 3), 10); // Limita 3-10
  
  // Costruisci contesto di allineamento
  const keywords = extractKeywords(subject, topic, description);
  const classInfo = classMap(classLabel);
  const ctx: AlignmentContext = {
    subject,
    topic,
    classLabel,
    description,
    keywords,
    classInfo,
    minItemCoverage: 0.6,
    minAvgCoverage: 0.65,
    difficulty
  };
  
  // Inizializza provider AI
  const provider = getAiProvider();
  
  // Prima generazione
  let attempts = 0;
  let allQuestions: QuestionOut[] = [];
  let diagnostics: Diagnostic[] = [];
  
  while (attempts < MAX_TRIES) {
    attempts++;
    
    try {
      console.log(`Tentativo ${attempts}/${MAX_TRIES} per generazione AI...`);
      
      // Genera domande
      const feedback = attempts > 1 ? buildFeedback(diagnostics, ctx) : undefined;
      const result = await provider.generate({
        subject,
        topic,
        classLabel,
        description,
        difficulty,
        count: finalCount,
        mix,
        feedback
      });
      
      // Valida e diagnostica ogni domanda
      const newDiagnostics: Diagnostic[] = [];
      const validQuestions: QuestionOut[] = [];
      
      for (const question of result.questions) {
        const validation = validateItem(question, ctx);
        const coverage = scoreItem(question, ctx);
        
        const diagnostic: Diagnostic = {
          coverage,
          reasons: validation.reasons,
          passed: validation.ok,
          feedback: validation.reasons.join('; ')
        };
        
        newDiagnostics.push(diagnostic);
        
        if (validation.ok) {
          validQuestions.push(question);
        }
      }
      
      // Aggiorna collezione complessiva
      allQuestions.push(...validQuestions);
      diagnostics = newDiagnostics; // Mantieni solo l'ultimo tentativo per diagnostics
      
      // Calcola metriche aggregate
      const avgCoverage = diagnostics.reduce((sum, d) => sum + d.coverage, 0) / diagnostics.length;
      const passRate = diagnostics.filter(d => d.passed).length / diagnostics.length;
      
      console.log(`Tentativo ${attempts}: ${validQuestions.length}/${finalCount} domande valide, coverage media: ${Math.round(avgCoverage * 100)}%`);
      
      // Verifica se soddisfa i criteri strict
      if (!strict || (avgCoverage >= ctx.minAvgCoverage && passRate >= 0.7)) {
        console.log('Generazione completata con successo!');
        break;
      }
      
      if (attempts === MAX_TRIES) {
        console.warn(`Raggiunto limite tentativi. Coverage: ${Math.round(avgCoverage * 100)}%, Pass rate: ${Math.round(passRate * 100)}%`);
        
        if (strict) {
          throw new Error('MISALIGNED: Non è stato possibile generare domande che rispettino i criteri di allineamento strict. Prova a rendere più specifici Argomento e Descrizione.');
        }
      }
    } catch (error) {
      console.error(`Errore nel tentativo ${attempts}:`, error);
      
      if (attempts === MAX_TRIES) {
        throw error;
      }
    }
  }
  
  // Deduplicazione e ranking
  const uniqueQuestions = deduplicateQuestions(allQuestions);
  const rankedQuestions = uniqueQuestions
    .map(q => ({ question: q, score: scoreItem(q, ctx) }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.question);
  
  // Applica mix enforcement se richiesto
  const finalQuestions = mix ? enforceMix(rankedQuestions, finalCount) : rankedQuestions.slice(0, finalCount);
  
  // Calcola diagnostics finali
  const finalDiagnostics = finalQuestions.map(q => {
    const validation = validateItem(q, ctx);
    const coverage = scoreItem(q, ctx);
    return {
      coverage,
      reasons: validation.reasons,
      passed: validation.ok,
      feedback: validation.reasons.length > 0 ? validation.reasons.join('; ') : undefined
    };
  });
  
  const avgCoverage = finalDiagnostics.reduce((sum, d) => sum + d.coverage, 0) / finalDiagnostics.length;
  const passRate = finalDiagnostics.filter(d => d.passed).length / finalDiagnostics.length;
  
  const overallDiagnostics: Diagnostics = {
    questions: finalDiagnostics,
    avgCoverage,
    passRate,
    overallFeedback: `Generazione completata. Coverage media: ${Math.round(avgCoverage * 100)}%, Domande valide: ${Math.round(passRate * 100)}%`
  };
  
  return {
    questions: finalQuestions,
    diagnostics: overallDiagnostics
  };
};

/**
 * Ottieni provider AI (OpenAI se disponibile, altrimenti Mock)
 */
const getAiProvider = (): AiProvider => {
  const apiKey = process.env.OPENAI_API_KEY || (globalThis as any).OPENAI_API_KEY;
  
  if (apiKey) {
    console.log('Usando OpenAI provider');
    return new OpenAIProvider(apiKey);
  } else {
    console.log('Usando Mock provider (nessuna API key OpenAI trovata)');
    return new MockAiProvider();
  }
};

/**
 * Costruisce feedback per rigenerazioni mirate
 */
const buildFeedback = (diagnostics: Diagnostic[], ctx: AlignmentContext): string => {
  const issues: string[] = [];
  
  // Analizza problemi comuni
  const lowCoverageCount = diagnostics.filter(d => d.coverage < ctx.minItemCoverage).length;
  const missingKeywords = ctx.keywords.slice(0, 3); // Top 3 keywords
  
  if (lowCoverageCount > 0) {
    issues.push(`${lowCoverageCount} domande hanno bassa copertura argomento. Includi: ${missingKeywords.join(', ')}`);
  }
  
  const readabilityIssues = diagnostics.filter(d => 
    d.reasons.some(r => r.includes('lessico') || r.includes('complesso'))
  ).length;
  
  if (readabilityIssues > 0) {
    issues.push(`Semplifica il lessico per ${ctx.classInfo.band}. Usa parole più ${ctx.classInfo.lexicon}.`);
  }
  
  const spoilerIssues = diagnostics.filter(d => 
    d.reasons.some(r => r.includes('spoiler'))
  ).length;
  
  if (spoilerIssues > 0) {
    issues.push('Non includere la risposta corretta nel testo della domanda');
  }
  
  if (ctx.difficulty === 'easy' && ctx.classInfo.band === 'primaria') {
    issues.push('Usa numeri piccoli (< 20) e concetti di base');
  }
  
  return issues.join('. ') + '.';
};

/**
 * Rimuove domande duplicate
 */
const deduplicateQuestions = (questions: QuestionOut[]): QuestionOut[] => {
  const seen = new Set<string>();
  return questions.filter(q => {
    const key = q.prompt.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};