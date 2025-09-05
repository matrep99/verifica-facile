import { z } from "zod";

export const QuestionOut = z.object({
  type: z.enum(["MCQ","TF","SHORT","LONG"]),
  prompt: z.string().min(8),
  options: z.array(z.string().min(1)).length(4).optional(), // MCQ-only
  correctAnswer: z.union([
    z.object({ selected: z.number().int().min(0).max(3) }), // MCQ
    z.object({ value: z.boolean() }),                       // TF
    z.object({ expected: z.string().min(1) })               // SHORT
  ]).optional(),
  points: z.number().int().min(1).max(10).default(1),
  explainForTeacher: z.string().optional()
}).refine(q => q.type !== "MCQ" || (!!q.options && !!q.correctAnswer && "selected" in q.correctAnswer), "MCQ richiede 4 opzioni e indice corretto")
  .refine(q => q.type !== "TF"   || (!!q.correctAnswer && "value" in q.correctAnswer), "TF richiede booleano corretto")
  .refine(q => q.type !== "SHORT"|| (!!q.correctAnswer && "expected" in q.correctAnswer), "SHORT richiede expected");

export const QuestionsOut = z.object({ questions: z.array(QuestionOut).min(1).max(10) });
export type TQuestionOut = z.infer<typeof QuestionOut>;