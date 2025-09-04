import { keywordBank, classMap, type ClassBand, type ClassInfo } from './ontology';
import { QuestionOut, QuestionOutSchema } from './schema';

export interface AlignmentContext {
  subject: string;
  topic: string;
  classLabel: string;
  description?: string;
  keywords: string[];
  classInfo: ClassInfo;
  minItemCoverage: number;
  minAvgCoverage: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function extractKeywords(subject: string, topic: string, description?: string): string[] {
  const bank = keywordBank[subject as keyof typeof keywordBank];
  const base = bank ? bank.base : [];
  const syns = bank ? Object.values(bank.synonyms).flat() : [];
  const extra = (topic + " " + (description || "")).toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/)
    .filter(w => w.length > 3);
  return Array.from(new Set([...base, ...syns, ...extra])).slice(0, 24);
}

export function coverageScore(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  const hit = keywords.filter(k => t.includes(k.toLowerCase()));
  return hit.length / Math.max(1, Math.min(keywords.length, 12)); // cap 12 parole
}

export function readabilityOk(text: string, band: ClassBand): boolean {
  const words = text.split(/\s+/).length;
  if (band === "primaria") return words <= 30 && !/[;:]{2,}/.test(text);
  if (band === "media")    return words <= 45;
  return words <= 60;
}

export function noSpoiler(item: QuestionOut): boolean {
  if (item.type === "MCQ" && item.options && item.correctAnswer && 'selected' in item.correctAnswer) {
    const correct = item.options[item.correctAnswer.selected]?.toLowerCase();
    return !correct || !item.prompt.toLowerCase().includes(correct);
  }
  if (item.type === "SHORT" && item.correctAnswer && 'expected' in item.correctAnswer) {
    return !item.prompt.toLowerCase().includes(item.correctAnswer.expected.toLowerCase());
  }
  return true;
}

export function validateItem(item: QuestionOut, ctx: AlignmentContext): { ok: boolean; reasons: string[] } {
  const base = QuestionOutSchema.safeParse(item);
  if (!base.success) return { ok: false, reasons: ["schema:" + base.error.issues[0]?.message] };

  const cov = coverageScore(item.prompt, ctx.keywords);
  if (cov < ctx.minItemCoverage) return { ok: false, reasons: [`coverage:${(cov*100)|0}%`] };

  if (!readabilityOk(item.prompt, ctx.classInfo.band)) return { ok: false, reasons: ["readability"] };
  if (!noSpoiler(item)) return { ok: false, reasons: ["spoiler"] };
  if (item.type === "MCQ" && item.options && new Set(item.options).size < 4) return { ok: false, reasons: ["options-duplicates"] };

  return { ok: true, reasons: [] };
}

export const postProcess = (item: QuestionOut): QuestionOut => {
  const processed = { ...item };
  processed.prompt = processed.prompt.trim().replace(/\s+/g, ' ');
  
  if (processed.type === 'MCQ' && processed.options) {
    processed.options = processed.options.map(opt => 
      opt.trim().charAt(0).toUpperCase() + opt.trim().slice(1)
    );
    
    while (processed.options.length < 4) {
      processed.options.push(`Opzione ${processed.options.length + 1}`);
    }
  }
  
  return processed;
};

export const scoreItem = (item: QuestionOut, ctx: AlignmentContext): number => {
  const coverage = coverageScore(item.prompt, ctx.keywords);
  const readability = readabilityOk(item.prompt, ctx.classInfo.band) ? 1 : 0;
  const noSpoilerScore = noSpoiler(item) ? 1 : 0;
  
  return (coverage * 0.6) + (readability * 0.2) + (noSpoilerScore * 0.2);
};

export const enforceMix = (questions: QuestionOut[], count: number): QuestionOut[] => {
  if (count < 5) return questions.slice(0, count);
  
  const mcqQuestions = questions.filter(q => q.type === 'MCQ');
  const tfQuestions = questions.filter(q => q.type === 'TF');
  const shortQuestions = questions.filter(q => q.type === 'SHORT');
  
  const result: QuestionOut[] = [];
  result.push(...mcqQuestions.slice(0, Math.max(3, Math.ceil(count * 0.6))));
  
  if (tfQuestions.length > 0) {
    result.push(...tfQuestions.slice(0, Math.max(1, Math.ceil(count * 0.2))));
  }
  
  if (shortQuestions.length > 0) {
    result.push(...shortQuestions.slice(0, Math.max(1, Math.ceil(count * 0.2))));
  }
  
  return result.slice(0, count);
};