import { useState } from 'react';
import { Zap, Save } from 'lucide-react';
import { VerificheButton } from '@/components/ui/button-variants';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Answer, Question } from '@/types';

interface GradingInterfaceProps {
  answer: Answer;
  question: Question;
  questionIndex: number;
  isGrading: boolean;
  onAiGrade: () => void;
  onSaveGrade: (answer: Answer, finalScore: number, feedback: string) => void;
}

export const GradingInterface = ({ 
  answer, 
  question, 
  questionIndex, 
  isGrading, 
  onAiGrade, 
  onSaveGrade 
}: GradingInterfaceProps) => {
  const [score, setScore] = useState(answer.finalScore || answer.aiSuggestedScore || '');
  const [feedback, setFeedback] = useState(answer.feedback || '');

  const handleSave = () => {
    onSaveGrade(answer, parseFloat(score.toString()) || 0, feedback);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Punteggio suggerito AI:</label>
          <VerificheButton
            variant="outline"
            size="sm"
            onClick={onAiGrade}
            disabled={isGrading || !answer.response.text}
          >
            <Zap className="h-3 w-3 mr-1" />
            {isGrading ? 'Generazione...' : 'Suggerimento AI'}
          </VerificheButton>
        </div>
        {answer.aiSuggestedScore !== undefined && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="font-medium mb-1">
              Punteggio: {answer.aiSuggestedScore}/{question.points}
            </div>
            <p className="text-sm text-muted-foreground">
              {answer.feedback || 'Nessun feedback disponibile'}
            </p>
          </div>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Voto finale:</label>
        <div className="space-y-2">
          <Input
            type="number"
            min="0"
            max={question.points}
            step="0.1"
            placeholder="Punteggio"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
          <Textarea
            placeholder="Feedback per lo studente..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />
          <VerificheButton
            variant="primary"
            size="sm"
            onClick={handleSave}
          >
            <Save className="h-3 w-3 mr-1" />
            Salva voto
          </VerificheButton>
        </div>
      </div>
    </div>
  );
};