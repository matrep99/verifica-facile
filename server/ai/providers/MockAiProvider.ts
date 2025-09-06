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
    
    // Template per disciplina
    const templates = {
      "Matematica": {
        mcq: `Quale operazione risolve l'equazione di ${topic.toLowerCase()}?`,
        tf: `In ${topic.toLowerCase()}, l'incognita può essere isolata bilanciando`,
        short: `Spiega i passaggi per risolvere ${topic.toLowerCase()}`
      },
      "Scienze": {
        mcq: `Durante il processo di ${topic.toLowerCase()}, cosa produce la pianta?`,
        tf: `La ${topic.toLowerCase()} avviene solo con la luce solare`,
        short: `Descrivi il ruolo della clorofilla nella ${topic.toLowerCase()}`
      },
      "Storia": {
        mcq: `Chi governava durante ${topic.toLowerCase()}?`,
        tf: `Il periodo di ${topic.toLowerCase()} durò molti secoli`,
        short: `Quali furono le conseguenze di ${topic.toLowerCase()}?`
      },
      "Italiano": {
        mcq: `Nell'${topic.toLowerCase()}, quale elemento è principale?`,
        tf: `L'${topic.toLowerCase()} comprende subordinate e coordinate`,
        short: `Analizza la struttura di ${topic.toLowerCase()}`
      },
      "Inglese": {
        mcq: `Quando si usa ${topic.toLowerCase()}?`,
        tf: `Il ${topic.toLowerCase()} indica azioni passate`,
        short: `Coniuga il verbo 'to be' al ${topic.toLowerCase()}`
      }
    };
    
    const template = templates[subject as keyof typeof templates] || templates["Matematica"];
    
    // Generate questions based on subject and topic
    for (let i = 0; i < count; i++) {
      const questionType = i % 3 === 0 ? "MCQ" : i % 3 === 1 ? "TF" : "SHORT";
      const points = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      
      if (questionType === "MCQ") {
        questions.push({
          type: "MCQ",
          prompt: template.mcq,
          options: [
            `Opzione A per ${topic}`,
            `Opzione B corretta per ${topic}`,
            `Opzione C errata per ${topic}`,
            `Opzione D plausibile per ${topic}`
          ],
          correctAnswer: { selected: 1 },
          points,
          explainForTeacher: `Domanda ${questionType} su ${topic} per ${classLabel}`
        });
      } else if (questionType === "TF") {
        questions.push({
          type: "TF",
          prompt: template.tf,
          correctAnswer: { value: true },
          points,
          explainForTeacher: `Domanda ${questionType} su ${topic} per ${classLabel}`
        });
      } else {
        questions.push({
          type: "SHORT",
          prompt: template.short,
          correctAnswer: { expected: `Risposta breve su ${topic}` },
          points,
          explainForTeacher: `Domanda ${questionType} su ${topic} per ${classLabel}`
        });
      }
    }
    
    return { questions };
  }
}