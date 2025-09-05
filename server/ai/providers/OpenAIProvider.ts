import { TQuestionOut } from "../schema";
import { getFewShotExamples } from "../fewshot";

export class OpenAIProvider {
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
    
    const { subject, topic, classLabel, description, difficulty, count, mix, feedback } = params;
    
    const schemaSummary = `{"questions":[{"type":"MCQ|TF|SHORT|LONG","prompt":"IT","options?":["", "", "", ""],"correctAnswer?":{"selected|value|expected":...},"points":1}...]}`;
    
    const systemPrompt = "Sei un generatore di domande per docenti italiani. Rispondi SOLO con JSON valido secondo lo schema. Niente testo extra. Lingua: italiano. Rispetta disciplina/argomento/classe. MCQ con 4 opzioni.";
    
    const userPrompt = [
      `Disciplina: ${subject}`,
      `Argomento: ${topic}`,
      `Classe: ${classLabel}`,
      description ? `Descrizione: ${description}` : "",
      `Difficoltà: ${difficulty}`,
      `Numero domande: ${count}`,
      `Mix tipologie: ${mix}`,
      feedback ? `Correzioni richieste: ${feedback}` : "",
      `Schema: ${schemaSummary}`,
      `Esempi: ${JSON.stringify(getFewShotExamples(subject))}`
    ].filter(Boolean).join("\n");

    try {
      // If OpenAI API key is available, use it
      if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.0,
            top_p: 0.9,
            frequency_penalty: 0.2,
            presence_penalty: 0
          })
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('No content in OpenAI response');
        }

        // Try to extract JSON from response
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
    }

    // Fallback to mock provider
    const { MockAiProvider } = await import('./MockAiProvider');
    return MockAiProvider.generate(params);
  }
}