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

export function noSpoiler(q: TQuestionOut)
{
  if(q.type==="MCQ" && q.options && q.correctAnswer && "selected" in q.correctAnswer){
    const idx=q.correctAnswer.selected;
    const corr=q.options[idx]?.toLowerCase();
    return !corr || !q.prompt.toLowerCase().includes(corr);
  }
  if(q.type==="SHORT" && q.correctAnswer && "expected" in q.correctAnswer){
    return !q.prompt.toLowerCase().includes(q.correctAnswer.expected.toLowerCase());
  }
  return true;
}

export function validateItem(q:TQuestionOut, ctx:{kws:string[]; band:{band:string;maxLen:number}; ref:string})
{
  const z=QuestionOut.safeParse(q); if(!z.success) return {ok:false,reasons:["schema"]};
  const cov=coverage(q.prompt,ctx.kws); if(cov<0.65) return {ok:false,reasons:[`coverage:${(cov*100)|0}%`]};
  const sim=cosine(q.prompt,ctx.ref); if(sim<0.60)   return {ok:false,reasons:[`similarity:${(sim*100)|0}%`]};
  const len=q.prompt.split(/\s+/).length; if(len>ctx.band.maxLen) return {ok:false,reasons:["readability"]};
  if(!noSpoiler(q)) return {ok:false,reasons:["spoiler"]};
  if(q.type==="MCQ" && q.options && new Set(q.options).size<4) return {ok:false,reasons:["options-duplicates"]};
  return {ok:true,reasons:[]};
}