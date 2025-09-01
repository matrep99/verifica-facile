import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VerificheButton } from '@/components/ui/button-variants';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { store } from '@/lib/store';
import { Test, Question, Submission } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const TakeTest = () => {
  const { joinCode } = useParams<{ joinCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'join' | 'test' | 'submitted'>('join');
  const [studentName, setStudentName] = useState('');
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (joinCode) {
      // Trova il test con questo codice
      const allTests = store.getUserTests('demo-docente'); // Per il demo, usa il docente demo
      const foundTest = allTests.find(t => t.settings.joinCode === joinCode.toUpperCase());
      
      if (foundTest && foundTest.status === 'PUBLISHED') {
        setTest(foundTest);
        setQuestions(store.getQuestions(foundTest.id));
      }
    }
  }, [joinCode]);

  const handleJoinTest = () => {
    if (!test || !studentName.trim()) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci il tuo nome per continuare.",
        variant: "destructive"
      });
      return;
    }

    const newSubmission = store.createSubmission(test.settings.joinCode || '', studentName.trim());
    if (newSubmission) {
      setSubmission(newSubmission);
      setStep('test');
      
      toast({
        title: "Verifica iniziata!",
        description: "Buona fortuna con la tua verifica.",
      });
    } else {
      toast({
        title: "Errore",
        description: "Non è stato possibile accedere alla verifica.",
        variant: "destructive"
      });
    }
  };

  const handleAnswerChange = (questionId: string, response: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: response }));
    
    // Auto-save
    if (submission) {
      store.saveAnswer(submission.id, questionId, response);
    }
  };

  const handleSubmitTest = () => {
    if (!submission) return;

    // Salva tutte le risposte finali
    Object.entries(answers).forEach(([questionId, response]) => {
      store.saveAnswer(submission.id, questionId, response);
    });

    // Finalizza la submission
    const finalSubmission = store.submitSubmission(submission.id);
    if (finalSubmission) {
      setSubmission(finalSubmission);
      setStep('submitted');
      
      toast({
        title: "Verifica inviata!",
        description: "Le tue risposte sono state salvate con successo.",
        variant: "default"
      });
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Join Step
  if (step === 'join') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">
              Accedi alla Verifica
            </CardTitle>
            {test ? (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{test.title}</h3>
                <p className="text-muted-foreground text-sm">{test.description}</p>
                <Badge className="bg-primary text-primary-foreground">
                  Codice: {joinCode?.toUpperCase()}
                </Badge>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-warning mb-4" />
                <p className="text-muted-foreground">
                  Codice verifica non valido o verifica non disponibile.
                </p>
              </div>
            )}
          </CardHeader>
          
          {test && (
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="studentName">Il tuo nome</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Inserisci il tuo nome completo"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinTest()}
                />
              </div>
              
              <VerificheButton 
                variant="primary" 
                size="lg" 
                onClick={handleJoinTest}
                className="w-full"
                disabled={!studentName.trim()}
              >
                Inizia Verifica
              </VerificheButton>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Submitted Step
  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-success mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Verifica Completata!</h2>
            <p className="text-muted-foreground mb-6">
              La tua verifica è stata inviata con successo. I risultati saranno disponibili dopo la correzione del docente.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Studente:</span>
                <span className="font-medium">{submission?.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span>Verifica:</span>
                <span className="font-medium">{test?.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Domande:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo impiegato:</span>
                <span className="font-medium">
                  {Math.round((Date.now() - startTime) / 1000 / 60)} minuti
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test Step
  if (!currentQuestion) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Caricamento...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{test?.title}</h1>
              <p className="text-sm text-muted-foreground">Studente: {studentName}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{Math.round((Date.now() - startTime) / 1000 / 60)} min</span>
              </div>
              
              <Badge variant="outline">
                {currentQuestionIndex + 1} di {questions.length}
              </Badge>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </div>
      </header>

      {/* Question Content */}
      <main className="container mx-auto p-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Domanda {currentQuestionIndex + 1}
              <Badge variant="outline" className="ml-2">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'punto' : 'punti'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6 leading-relaxed">{currentQuestion.prompt}</p>

            {/* Answer Input Based on Question Type */}
            {currentQuestion.type === 'MCQ' && (
              <div className="space-y-3">
                {(currentQuestion.options || []).map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50">
                    <input
                      type="radio"
                      name="mcq-answer"
                      value={index}
                      checked={currentAnswer?.selected === index}
                      onChange={() => handleAnswerChange(currentQuestion.id, { selected: index })}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-sm">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'TF' && (
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50">
                  <input
                    type="radio"
                    name="tf-answer"
                    value="true"
                    checked={currentAnswer?.boolean === true}
                    onChange={() => handleAnswerChange(currentQuestion.id, { boolean: true })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-medium">Vero</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50">
                  <input
                    type="radio"
                    name="tf-answer"
                    value="false"
                    checked={currentAnswer?.boolean === false}
                    onChange={() => handleAnswerChange(currentQuestion.id, { boolean: false })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-medium">Falso</span>
                </label>
              </div>
            )}

            {currentQuestion.type === 'SHORT' && (
              <Input
                value={currentAnswer?.text || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, { text: e.target.value })}
                placeholder="Scrivi la tua risposta..."
                className="text-base"
              />
            )}

            {currentQuestion.type === 'LONG' && (
              <Textarea
                value={currentAnswer?.text || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, { text: e.target.value })}
                placeholder="Sviluppa la tua risposta..."
                rows={6}
                className="text-base"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <VerificheButton
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Precedente
          </VerificheButton>

          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[questions[index].id] 
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <VerificheButton variant="success" onClick={handleSubmitTest}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Consegna Verifica
            </VerificheButton>
          ) : (
            <VerificheButton
              variant="primary"
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            >
              Successiva
            </VerificheButton>
          )}
        </div>
      </main>
    </div>
  );
};