import { z } from 'zod';

// Schema Zod per validazione strict delle domande generate dall'AI
export const QuestionOutSchema = z.object({
  type: z.enum(['MCQ', 'TF', 'SHORT', 'LONG']),
  prompt: z.string().min(10, 'Il prompt deve essere di almeno 10 caratteri'),
  options: z.array(z.string()).length(4).optional(),
  correctAnswer: z.union([
    z.object({ selected: z.number().min(0).max(3) }), // MCQ
    z.object({ value: z.boolean() }),                 // TF  
    z.object({ expected: z.string().min(1) })         // SHORT/LONG
  ]).optional(),
  points: z.number().int().min(1).max(10),
  explainForTeacher: z.string().optional()
});

export const QuestionsOutSchema = z.object({
  questions: z.array(QuestionOutSchema).min(1)
});

export type QuestionOut = z.infer<typeof QuestionOutSchema>;
export type QuestionsOut = z.infer<typeof QuestionsOutSchema>;

// Schema per diagnostics
export const DiagnosticSchema = z.object({
  coverage: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  feedback: z.string().optional(),
  passed: z.boolean()
});

export const DiagnosticsSchema = z.object({
  questions: z.array(DiagnosticSchema),
  avgCoverage: z.number().min(0).max(1),
  passRate: z.number().min(0).max(1),
  overallFeedback: z.string().optional()
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type Diagnostics = z.infer<typeof DiagnosticsSchema>;