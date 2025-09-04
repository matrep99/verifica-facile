import { z } from 'zod';

export const QuestionOutSchema = z.object({
  type: z.enum(["MCQ","TF","SHORT","LONG"]),
  prompt: z.string().min(8, 'Il prompt deve essere di almeno 8 caratteri'),
  options: z.array(z.string().min(1)).length(4).optional(), // solo MCQ
  correctAnswer: z.union([
    z.object({ selected: z.number().int().min(0).max(3) }),  // MCQ
    z.object({ value: z.boolean() }),                        // TF
    z.object({ expected: z.string().min(1) })                // SHORT/LONG
  ]).optional(),
  points: z.number().int().min(1).max(10).default(1),
  explainForTeacher: z.string().optional()
})
.refine(q => q.type !== "MCQ" || (!!q.options && !!q.correctAnswer && "selected" in q.correctAnswer), "MCQ richiede 4 opzioni e indice corretto")
.refine(q => q.type !== "TF"   || (!!q.correctAnswer && "value" in q.correctAnswer), "TF richiede booleano corretto")
.refine(q => q.type !== "SHORT"|| (!!q.correctAnswer && "expected" in q.correctAnswer), "SHORT richiede expected");

export const QuestionsOutSchema = z.object({
  questions: z.array(QuestionOutSchema).min(1).max(10)
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