import { QuestionOut, TQuestionOut } from "./schema";
import { keywordBank, classBand } from "./ontology";

export function keywords(subject: string, topic: string, description?: string)
{
  const kb = keywordBank[subject as keyof typeof keywordBank];
  const seed = (kb ? [...kb.base, ...kb.syns] : []);
  const extra = (topic + " " + (description||""))
    .toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(w => w.length>3);
  return Array.from(new Set([...seed, ...extra])).slice(0, 24);
}

export function coverage(text: string, kws: string[])
{
  const t = text.toLowerCase();
  const hit = kws.filter(k => t.includes(k.toLowerCase()));
  return hit.length / Math.max(1, Math.min(kws.length, 12));
}

// bag-of-words cosine similarity between prompt and topic+desc+subject
export function cosine(a: string, b: string)
{
  const tf = (s: string) =>
  {
    const map = new Map<string, number>();
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).forEach(w =>
    {
      if (w.length<3) return;
      map.set(w, (map.get(w) || 0) + 1);
    });
    return map;
  };
  const A = tf(a), B = tf(b);
  let dot = 0, nA = 0, nB = 0;
  for (const v of A.values()) nA += v*v;
  for (const v of B.values()) nB += v*v;
  for (const [w, v] of A) if (B.has(w)) dot += v * (B.get(w) as number);
  return dot === 0 ? 0 : dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

export function noSpoiler(item: TQuestionOut)
{
  if (item.type === "MCQ" && item.options && item.correctAnswer && "selected" in item.correctAnswer)
  {
    const idx = item.correctAnswer.selected;
    const corr = item.options[idx]?.toLowerCase();
    return !corr || !item.prompt.toLowerCase().includes(corr);
  }
  if (item.type === "SHORT" && item.correctAnswer && "expected" in item.correctAnswer)
  {
    return !item.prompt.toLowerCase().includes(item.correctAnswer.expected.toLowerCase());
  }
  return true;
}

export function validateItem(item: TQuestionOut, ctx: { kws:string[]; band:{band:string;maxLen:number}; ref:string })
{
  const z = QuestionOut.safeParse(item);
  if (!z.success) return { ok:false, reasons:["schema"] };

  const cov = coverage(item.prompt, ctx.kws);
  if (cov < 0.65) return { ok:false, reasons:[`coverage:${(cov*100)|0}%`] };

  const sim = cosine(item.prompt, ctx.ref);
  if (sim < 0.6) return { ok:false, reasons:[`similarity:${(sim*100)|0}%`] };

  const words = item.prompt.split(/\s+/).length;
  if (words > ctx.band.maxLen) return { ok:false, reasons:["readability"] };

  if (!noSpoiler(item)) return { ok:false, reasons:["spoiler"] };
  if (item.type === "MCQ" && item.options && new Set(item.options).size < 4) return { ok:false, reasons:["options-duplicates"] };

  return { ok:true, reasons:[] };
}