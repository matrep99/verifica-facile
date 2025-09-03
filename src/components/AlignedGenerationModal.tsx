import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VerificheButton } from '@/components/ui/button-variants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Wand2 } from 'lucide-react';
import { generateAligned, type GenerateAlignedParams, type GenerateAlignedResult } from '@/ai/generateAligned';
import { Test } from '@/types';

interface AlignedGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test;
  onAcceptQuestions: (questions: any[]) => void;
}

export const AlignedGenerationModal: React.FC<AlignedGenerationModalProps> = ({
  open,
  onOpenChange,
  test,
  onAcceptQuestions
}) => {
  const [params, setParams] = useState<GenerateAlignedParams>({
    subject: test.subject,
    topic: test.topic,
    classLabel: test.classLabel,
    description: test.description,
    difficulty: 'medium',
    count: 5,
    mix: true,
    strict: true
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateAlignedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const generatedResult = await generateAligned(params);
      setResult(generatedResult);
    } catch (err: any) {
      setError(err.message || 'Errore durante la generazione');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onAcceptQuestions(result.questions);
      onOpenChange(false);
      setResult(null);
    }
  };

  const canAccept = result && (!params.strict || result.diagnostics.passRate >= 0.7);

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
              <Input value={params.subject} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Argomento</Label>
              <Input value={params.topic} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Classe</Label>
              <Input value={params.classLabel} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Difficoltà</Label>
              <Select value={params.difficulty} onValueChange={(value: any) => setParams({...params, difficulty: value})}>
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
            <div>
              <Label># Domande</Label>
              <Input 
                type="number" 
                min="3" 
                max="10" 
                value={params.count} 
                onChange={(e) => setParams({...params, count: parseInt(e.target.value) || 5})} 
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={params.strict} 
                onCheckedChange={(checked) => setParams({...params, strict: checked})}
              />
              <Label>Strict Mode (consigliato)</Label>
            </div>
          </div>

          {/* Pulsante Generate */}
          <VerificheButton 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generazione in corso...' : 'Genera'}
          </VerificheButton>

          {/* Errore */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">{error}</span>
            </div>
          )}

          {/* Risultats */}
          {result && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Panoramica</TabsTrigger>
                <TabsTrigger value="questions">Domande</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline">
                      Copertura argomento: {Math.round(result.diagnostics.avgCoverage * 100)}%
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={result.diagnostics.passRate >= 0.7 ? "default" : "destructive"}>
                      Domande valide: {Math.round(result.diagnostics.passRate * 100)}%
                    </Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="questions" className="space-y-3">
                {result.questions.map((question, index) => {
                  const diagnostic = result.diagnostics.questions[index];
                  return (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{question.type}</Badge>
                            {diagnostic.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm mb-2">{question.prompt}</p>
                          {diagnostic.reasons.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Motivi: {diagnostic.reasons.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          )}

          {/* Azioni finali */}
          {result && (
            <div className="flex justify-end space-x-2">
              <VerificheButton variant="outline" onClick={() => setResult(null)}>
                Rigenera
              </VerificheButton>
              <VerificheButton 
                onClick={handleAccept}
                disabled={!canAccept}
                variant={canAccept ? "success" : "outline"}
              >
                Accetta {result.questions.length} domande
              </VerificheButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};