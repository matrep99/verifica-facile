import { keywordBank, stopWords, type ClassBand, type ClassInfo } from './ontology';
import { QuestionOut } from './schema';

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

export const extractKeywords = (subject: string, topic: string, description?: string): string[] => {
  const normalizedSubject = subject.toLowerCase();
  const subjectKeywords = keywordBank[normalizedSubject];
  
  if (!subjectKeywords) {
    console.warn(`Subject '${subject}' non trovato nel keyword bank`);
    return [];
  }
  
  const keywords = new Set<string>();
  subjectKeywords.base.forEach(kw => keywords.add(kw));
  
  const topicLower = topic.toLowerCase();
  Object.entries(subjectKeywords.synonyms).forEach(([key, synonyms]) => {
    if (topicLower.includes(key) || synonyms.some(syn => topicLower.includes(syn))) {
      keywords.add(key);
      synonyms.forEach(syn => keywords.add(syn));
    }
  });
  
  if (description) {
    description.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .forEach(word => keywords.add(word));
  }
  
  return Array.from(keywords);
};

export const classMap = (classLabel: string): ClassInfo => {
  const normalized = classLabel.toLowerCase();
  
  if (normalized.includes('primaria') || normalized.includes('elementare')) {
    return { band: 'primaria', minAge: 6, maxAge: 11, lexicon: 'base' };
  }
  
  if (normalized.includes('media') || normalized.includes('medie')) {
    return { band: 'media', minAge: 11, maxAge: 14, lexicon: 'medio' };
  }
  
  return { band: 'superiore', minAge: 14, maxAge: 19, lexicon: 'avanzato' };
};

export const coverageScore = (text: string, keywords: string[]): number => {
  if (keywords.length === 0) return 0;
  
  const textLower = text.toLowerCase();
  let matchedKeywords = 0;
  
  keywords.forEach(keyword => {
    const stemmed = keyword.replace(/(zione|mente|anza|enza|ezza|ità)$/, '');
    if (textLower.includes(keyword) || textLower.includes(stemmed)) {
      matchedKeywords++;
    }
  });
  
  return matchedKeywords / keywords.length;
};

export const readabilityOk = (text: string, band: ClassBand): boolean => {
  const words = text.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  const academicWords = [
    'conseguentemente', 'relativamente', 'sostanzialmente', 'prevalentemente',
    'significativamente', 'particolarmente', 'specificamente', 'principalmente'
  ];
  
  const hasAcademicWords = academicWords.some(word => text.toLowerCase().includes(word));
  
  switch (band) {
    case 'primaria':
      return avgWordLength <= 6 && !hasAcademicWords && words.length <= 15;
    case 'media':
      return avgWordLength <= 8 && !hasAcademicWords && words.length <= 25;
    case 'superiore':
      return avgWordLength <= 12 && words.length <= 40;
    default:
      return true;
  }
};

export const hasSpoiler = (question: QuestionOut): boolean => {
  const promptLower = question.prompt.toLowerCase();
  
  if (question.type === 'MCQ' && question.options && question.correctAnswer && 'selected' in question.correctAnswer) {
    const correctIndex = question.correctAnswer.selected;
    if (correctIndex !== undefined && question.options[correctIndex]) {
      const correctOption = question.options[correctIndex].toLowerCase();
      if (promptLower.includes(correctOption)) {
        return true;
      }
    }
  }
  
  return false;
};

export const validateItem = (item: QuestionOut, ctx: AlignmentContext): { ok: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  
  if (item.type === 'MCQ') {
    if (!item.options || item.options.length !== 4) {
      reasons.push('MCQ deve avere esattamente 4 opzioni');
    }
    if (!item.correctAnswer || !('selected' in item.correctAnswer)) {
      reasons.push('MCQ deve avere risposta corretta valida');
    }
  }
  
  const coverage = coverageScore(item.prompt, ctx.keywords);
  if (coverage < ctx.minItemCoverage) {
    reasons.push(`Copertura argomento bassa (${Math.round(coverage * 100)}%)`);
  }
  
  if (!readabilityOk(item.prompt, ctx.classInfo.band)) {
    reasons.push(`Lessico troppo complesso per ${ctx.classInfo.band}`);
  }
  
  if (hasSpoiler(item)) {
    reasons.push('Il prompt contiene spoiler della risposta');
  }
  
  return { ok: reasons.length === 0, reasons };
};

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
  const noSpoiler = hasSpoiler(item) ? 0 : 1;
  
  return (coverage * 0.6) + (readability * 0.2) + (noSpoiler * 0.2);
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