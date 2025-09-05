import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { QuestionOut } from "../ai/schema";

const router = Router();

// Create test with required fields
const CreateTestReq = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(2),
  topic: z.string().min(2),
  classLabel: z.string().min(1),
  duration: z.number().int().min(5).max(300).optional()
});

router.post("/", async (req, res) => {
  try {
    const p = CreateTestReq.safeParse(req.body);
    if (!p.success) {
      return res.status(400).json({ 
        error: { 
          code: "VALIDATION", 
          message: "Parametri non validi",
          details: p.error.issues
        } 
      });
    }

    const { title, description, subject, topic, classLabel, duration = 60 } = p.data;
    
    // Create demo question based on topic
    const getDemoQuestion = (subject: string, topic: string) => {
      const demoQuestions = {
        "Matematica": {
          type: "MCQ",
          prompt: `Esempio di domanda su ${topic}: quale delle seguenti è corretta?`,
          options: JSON.stringify(["Opzione A", "Opzione B corretta", "Opzione C", "Opzione D"]),
          correctAnswer: JSON.stringify({ selected: 1 }),
          points: 1
        },
        "Scienze": {
          type: "TF",
          prompt: `Il concetto di ${topic.toLowerCase()} è importante per le scienze`,
          correctAnswer: JSON.stringify({ value: true }),
          points: 1
        }
      };
      
      return demoQuestions[subject as keyof typeof demoQuestions] || {
        type: "SHORT",
        prompt: `Spiega brevemente il concetto di ${topic.toLowerCase()}`,
        correctAnswer: JSON.stringify({ expected: `Risposta su ${topic}` }),
        points: 2
      };
    };

    const result = await prisma.$transaction(async (tx) => {
      const test = await tx.test.create({
        data: {
          title,
          description,
          subject,
          topic,
          classLabel,
          duration,
          authorId: "default-user" // For dev, use default user
        }
      });

      const demoQuestion = getDemoQuestion(subject, topic);
      await tx.question.create({
        data: {
          testId: test.id,
          questionIndex: 0,
          ...demoQuestion
        }
      });

      return test;
    });

    res.status(201).json({ id: result.id });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Errore interno del server" 
      } 
    });
  }
});

// Get test by ID
router.get("/:id", async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { questions: { orderBy: { questionIndex: 'asc' } } }
    });

    if (!test) {
      return res.status(404).json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Test non trovato" 
        } 
      });
    }

    res.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Errore interno del server" 
      } 
    });
  }
});

// Get test questions
router.get("/:id/questions", async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { testId: req.params.id },
      orderBy: { questionIndex: 'asc' }
    });

    res.json({ questions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Errore interno del server" 
      } 
    });
  }
});

// Bulk add questions
const BulkQuestionsReq = z.object({
  questions: z.array(QuestionOut)
});

router.post("/:id/questions/bulk", async (req, res) => {
  try {
    const p = BulkQuestionsReq.safeParse(req.body);
    if (!p.success) {
      return res.status(400).json({ 
        error: { 
          code: "VALIDATION", 
          message: "Domande non valide",
          details: p.error.issues
        } 
      });
    }

    const { questions } = p.data;
    const testId = req.params.id;

    // Check if test exists
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return res.status(404).json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Test non trovato" 
        } 
      });
    }

    // Get current max question index
    const maxIndex = await prisma.question.findFirst({
      where: { testId },
      orderBy: { questionIndex: 'desc' },
      select: { questionIndex: true }
    });

    const startIndex = (maxIndex?.questionIndex ?? -1) + 1;

    const result = await prisma.$transaction(async (tx) => {
      const inserted = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const question = await tx.question.create({
          data: {
            testId,
            questionIndex: startIndex + i,
            type: q.type,
            prompt: q.prompt,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer ? JSON.stringify(q.correctAnswer) : null,
            points: q.points || 1,
            explainForTeacher: q.explainForTeacher
          }
        });
        inserted.push(question);
      }
      return inserted;
    });

    res.json({ inserted: result.length });
  } catch (error) {
    console.error('Bulk questions error:', error);
    res.status(500).json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Errore interno del server" 
      } 
    });
  }
});

export default router;