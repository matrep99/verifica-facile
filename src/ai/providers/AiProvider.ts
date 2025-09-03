import { QuestionsOut } from '../schema';

export interface GenerateParams {
  subject: string;
  topic: string;
  classLabel: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  mix: boolean;
  feedback?: string; // Per rigenerazioni mirate
}

export interface GradeParams {
  prompt: string;
  studentAnswer: string;
  modelAnswer?: string;
  rubric?: string;
  maxPoints: number;
}

export interface GradeResponse {
  suggestedScore: number;
  feedback: string;
}

/**
 * Interfaccia base per provider AI
 */
export abstract class AiProvider {
  abstract generate(params: GenerateParams): Promise<QuestionsOut>;
  abstract grade(params: GradeParams): Promise<GradeResponse>;
}