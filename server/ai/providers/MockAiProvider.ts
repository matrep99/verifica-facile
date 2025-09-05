import { TQuestionOut } from "../schema";
import { classBand } from "../ontology";

export class MockAiProvider {
  static async generate(params: {
    subject: string;
    topic: string;
    classLabel: string;
    description?: string;
    difficulty: string;
    count: number;
    mix: boolean;
    feedback?: string;
  }): Promise<{ questions: TQuestionOut[] }> {
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { subject, topic, classLabel, count, difficulty } = params;
    const band = classBand(classLabel);
    const questions: TQuestionOut[] = [];
    
    // Generate questions based on subject and topic
    for (let i = 0; i < count; i++) {
      const questionType = i % 3 === 0 ? "MCQ" : i % 3 === 1 ? "TF" : "SHORT";
      const points = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      
      if (questionType === "MCQ") {
        questions.push({
          type: "MCQ",
          prompt: `Domanda ${i + 1} su ${topic} per ${subject} (${classLabel}): Quale delle seguenti affermazioni è corretta riguardo ${topic.toLowerCase()}?`,
          options: [
            `Opzione A su ${topic}`,
            `Opzione B corretta su ${topic}`,
            `Opzione C errata su ${topic}`,
            `Opzione D plausibile su ${topic}`
          ],
          correctAnswer: { selected: 1 },
          points,
          explainForTeacher: `Domanda ${questionType} su ${topic} per ${classLabel}`
        });
      } else if (questionType === "TF") {
        questions.push({
          type: "TF",
          prompt: `Il concetto di ${topic.toLowerCase()} è fondamentale per comprendere ${subject.toLowerCase()}`,
          correctAnswer: { value: true },
          points,
          explainForTeacher: `Domanda ${questionType} su ${topic} per ${classLabel}`
        });
      } else {
        questions.push({
          type: "SHORT",
          prompt: `Spiega brevemente il concetto di ${topic.toLowerCase()} in ${subject.toLowerCase()}`,
          correctAnswer: { expected: `Risposta breve su ${topic}` },
          points,
          explainForTeacher: `Domanda ${questionType} su ${topic} per ${classLabel}`
        });
      }
    }
    
    return { questions };
  }
}