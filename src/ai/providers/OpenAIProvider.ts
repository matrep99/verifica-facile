import { AiProvider, GenerateParams, GradeParams, GradeResponse } from './AiProvider';
import { QuestionsOut, QuestionsOutSchema } from '../schema';
import { getFewShotExamples } from '../fewshot';

export class OpenAIProvider extends AiProvider {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async generate(params: GenerateParams): Promise<QuestionsOut> {
    const fewShotExamples = getFewShotExamples(params.subject, params.classLabel);
    const fewShotJson = JSON.stringify({ questions: fewShotExamples }, null, 0);
    
    const systemPrompt = `Sei un generatore di domande per docenti italiani. 
Devi restituire solo JSON valido conforme allo schema. 
Domande sempre in italiano, senza soluzione nel prompt. 
Rispetta rigorosamente Disciplina, Argomento e Classe.
Per MCQ usa sempre 4 opzioni plausibili.
Evita spoiler della risposta nel testo della domanda.`;

    const userPrompt = `Genera ${params.count} domande per:
DISCIPLINA: ${params.subject}
ARGOMENTO: ${params.topic} 
CLASSE: ${params.classLabel}
${params.description ? `DESCRIZIONE: ${params.description}` : ''}
DIFFICOLTÀ: ${params.difficulty}
MIX: ${params.mix ? 'Varia i tipi di domanda' : 'Solo MCQ'}

${params.feedback ? `FEEDBACK PRECEDENTE: ${params.feedback}` : ''}

SCHEMA JSON:
{
  "questions": [
    {
      "type": "MCQ|TF|SHORT|LONG",
      "prompt": "string",
      "options": ["string", "string", "string", "string"], // solo per MCQ
      "correctAnswer": {"selected": 0} | {"value": true} | {"expected": "string"},
      "points": 1-10,
      "explainForTeacher": "string opzionale"
    }
  ]
}

ESEMPIO PERTINENTE:
${fewShotJson}

Rispondi solo con JSON valido, senza testo extra.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Tenta di estrarre JSON se non è puro
      let jsonContent = content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);
      const validated = QuestionsOutSchema.parse(parsed);
      
      return validated;
    } catch (error) {
      console.error('OpenAI generation error:', error);
      
      // Se parsing JSON fallisce, rigenera una volta
      if (error instanceof SyntaxError) {
        console.warn('JSON parsing failed, retrying...');
        return this.generate({ ...params, feedback: 'Risposta precedente non era JSON valido. Rispondi solo con JSON.' });
      }
      
      throw error;
    }
  }

  async grade(params: GradeParams): Promise<GradeResponse> {
    const prompt = `Valuta questa risposta di uno studente:

DOMANDA: ${params.prompt}
RISPOSTA STUDENTE: ${params.studentAnswer}
${params.modelAnswer ? `RISPOSTA MODELLO: ${params.modelAnswer}` : ''}
${params.rubric ? `RUBRICA: ${params.rubric}` : ''}
PUNTI MASSIMI: ${params.maxPoints}

Fornisci voto (0-${params.maxPoints}) e feedback costruttivo in italiano.
Rispondi in JSON: {"suggestedScore": number, "feedback": "string"}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      
      return {
        suggestedScore: Math.max(0, Math.min(params.maxPoints, parsed.suggestedScore)),
        feedback: parsed.feedback || 'Valutazione completata.'
      };
    } catch (error) {
      console.error('OpenAI grading error:', error);
      throw error;
    }
  }
}