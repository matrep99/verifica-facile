import { Router } from "express";
import { z } from "zod";
import { generateAligned } from "../ai/generateAligned";
import { QuestionsOut } from "../ai/schema";

const router = Router();

const Req = z.object({
  subject: z.string().min(2),
  topic: z.string().min(2),
  classLabel: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.enum(["easy","medium","hard"]).optional(),
  count: z.number().int().min(3).max(10).optional(),
  mix: z.boolean().optional(),
  strict: z.boolean().optional()
});

router.post("/generate-questions", async (req, res) => {
  try {
    const p = Req.safeParse(req.body);
    if (!p.success) {
      return res.status(400).json({ 
        error: { 
          code: "VALIDATION", 
          message: "Parametri non validi",
          details: p.error.issues
        } 
      });
    }

    const out = await generateAligned(p.data);
    if (!out.ok) {
      return res.status(422).json({ 
        error: { 
          code: out.code, 
          message: out.message, 
          details: out.diagnostics 
        } 
      });
    }

    const final = QuestionsOut.safeParse({ questions: out.questions });
    if (!final.success) {
      return res.status(500).json({ 
        error: { 
          code: "POST_VALIDATE_FAIL", 
          message: "Output non valido" 
        } 
      });
    }

    res.json({ 
      questions: final.data.questions, 
      diagnostics: out.diagnostics 
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Errore interno del server" 
      } 
    });
  }
});

export default router;