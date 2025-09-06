import { QuestionsOut, TQuestionOut } from "./schema";
import { keywords, validateItem, coverage } from "./align";
import { classBand } from "./ontology";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { MockAiProvider } from "./providers/MockAiProvider";

export async function generateAligned(params: {
  subject:string; topic:string; classLabel:string; description?:string;
  difficulty?: "easy"|"medium"|"hard"; count?:number; mix?:boolean; strict?:boolean;
}) {
  const { subject, topic, classLabel, description, difficulty="medium", mix=true, strict=true } = params;
  const count = Math.max(3, Math.min(10, params.count ?? 5));
  const kws = keywords(subject, topic, description);
  const band = classBand(classLabel);
  const ref = `${subject} ${topic} ${description || ""}`;
  const Provider = process.env.OPENAI_API_KEY ? OpenAIProvider : MockAiProvider;

  const MAX_TRIES = 3;
  let accepted: TQuestionOut[] = [];
  let remaining = count;
  let feedback: string | undefined;

  for (let attempt=1; attempt<=MAX_TRIES && remaining>0; attempt++) {
    try {
      const raw = await Provider.generate({ subject, topic, classLabel, description, difficulty, count: remaining, mix, feedback });
      const parsed = QuestionsOut.safeParse(raw);
      
      if (!parsed.success) {
        feedback = "Rispondi SOLO con JSON conforme allo schema. Nessun testo esterno.";
        continue;
      }

      for (const q of parsed.data.questions) {
        const v = validateItem(q, { kws, band, ref });
        if (v.ok) {
          accepted.push(q);
        } else {
          feedback = `Rendi le domande più pertinenti a "${topic}" (classe ${classLabel}); includi keyword: ${kws.slice(0,6).join(", ")}; evita: ${v.reasons.join(",")}.`;
        }
      }

      remaining = count - accepted.length;
    } catch (error) {
      console.error(`Generation attempt ${attempt} failed:`, error);
      feedback = "Errore nella generazione. Riprova con formato JSON valido.";
    }
  }

  // Calcola coverage medio
  const avgCoverage = accepted.length ? 
    accepted.map(q => coverage(q.prompt, kws)).reduce((a,b) => a+b, 0) / accepted.length : 0;

  // Soglie Strict Mode più rigorose
  if (strict && (accepted.length < Math.ceil(0.7 * count) || avgCoverage < 0.65)) {
    return { 
      ok: false, 
      code: "MISALIGNED", 
      message: "Domande non sufficientemente allineate", 
      diagnostics: { 
        accepted: accepted.length, 
        requested: count, 
        avgCoverage 
      } 
    };
  }
  
  return { 
    ok: true, 
    questions: accepted, 
    diagnostics: { 
      accepted: accepted.length, 
      requested: count, 
      avgCoverage 
    } 
  };
}