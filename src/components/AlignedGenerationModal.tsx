import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionOut {
  type: "MCQ" | "TF" | "SHORT" | "LONG";
  prompt: string;
  options?: string[];
  correctAnswer?: { selected: number } | { value: boolean } | { expected: string };
  points: number;
  explainForTeacher?: string;
}

interface AlignedGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    subject: string;
    topic: string;
    classLabel: string;
    description?: string;
  };
  onAccept: (questions: QuestionOut[]) => void;
}

export default function AlignedGenerationModal({ open, onOpenChange, initialData, onAccept }: AlignedGenerationModalProps) {
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [classLabel, setClassLabel] = useState(initialData?.classLabel || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  const [strict, setStrict] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuestionOut[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!subject || !topic || !classLabel) {
      toast.error('Disciplina, Argomento e Classe sono obbligatori');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          topic,
          classLabel,
          description,
          difficulty,
          count,
          mix: true,
          strict
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.error?.code === 'MISALIGNED') {
          setError(`Generazione non allineata: ${data.error.message}`);
          setDiagnostics(data.error.details);
          toast.error('Domande non sufficientemente allineate. Prova ad arricchire la descrizione con parole chiave specifiche.');
        } else {
          setError(data.error?.message || 'Errore durante la generazione');
          toast.error(data.error?.message || 'Errore durante la generazione');
        }
        return;
      }

      setQuestions(data.questions || []);
      setDiagnostics(data.diagnostics);
      toast.success(`Generati ${data.questions?.length || 0} domande`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore di connessione';
      setError(errorMessage);
      toast.error('Errore durante la generazione: ' + errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (questions.length === 0) return;
    onAccept(questions);
    onOpenChange(false);
    toast.success(`Aggiunte ${questions.length} domande al test`);
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 0.8) return 'bg-green-500';
    if (coverage >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Genera con AI (allineata a Disciplina/Argomento/Classe)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Parametri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Disciplina</Label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                placeholder="es. Matematica, Storia, Scienze..."
              />
            </div>
            <div>
              <Label>Argomento</Label>
              <Input 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                placeholder="es. Equazioni di primo grado..."
              />
            </div>
            <div>
              <Label>Classe</Label>
              <Input 
                value={classLabel} 
                onChange={(e) => setClassLabel(e.target.value)}
                placeholder="es. 2ª media, 1ª superiore..."
              />
            </div>
            <div>
              <Label>Difficoltà</Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Facile</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="hard">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Descrizione (3-6 parole chiave consigliate)</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="es. numeri piccoli, bilanciamento su entrambi i membri, niente frazioni complesse..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label># Domande</Label>
              <Input 
                type="number" 
                min="3" 
                max="10" 
                value={count} 
                onChange={(e) => setCount(parseInt(e.target.value) || 5)} 
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch 
                checked={strict} 
                onCheckedChange={setStrict}
              />
              <Label>Strict Mode (consigliato)</Label>
            </div>
          </div>

          {/* Pulsante Generate */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !subject || !topic || !classLabel}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              'Genera'
            )}
          </Button>

          {/* Errore */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                {diagnostics && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Domande accettate: {diagnostics.accepted}/{diagnostics.requested}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Risultati */}
          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Anteprima Domande</span>
                  <div className="flex items-center space-x-2">
                    {diagnostics && (
                      <Badge variant="outline">
                        Copertura: {Math.round((diagnostics.accepted / diagnostics.requested) * 100)}%
                      </Badge>
                    )}
                    <Badge variant={questions.length >= count * 0.7 ? "default" : "destructive"}>
                      {questions.length} domande
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions.map((question, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{question.type}</Badge>
                          <Badge variant="outline">{question.points} pt</Badge>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-sm mb-2">{question.prompt}</p>
                        {question.type === 'MCQ' && question.options && (
                          <div className="text-xs text-muted-foreground">
                            Opzioni: {question.options.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Azioni finali */}
          {questions.length > 0 && (
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setQuestions([]); setError(null); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Rigenera
              </Button>
              <Button 
                onClick={handleAccept}
                disabled={strict && questions.length < count * 0.7}
                variant={(!strict || questions.length >= count * 0.7) ? "default" : "secondary"}
              >
                Accetta {questions.length} domande
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}