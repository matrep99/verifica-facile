import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Wand2, Save, Share2, Trash2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { VerificheButton } from '@/components/ui/button-variants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { store } from '@/lib/store';
import { Test, Question, QuestionType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import AlignedGenerationModal from '@/components/AlignedGenerationModal';

export const TestBuilder = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!testId) return;
    
    const loadedTest = store.getTest(testId);
    const loadedQuestions = store.getQuestions(testId);
    
    if (loadedTest) {
      setTest(loadedTest);
      setQuestions(loadedQuestions);
    } else {
      navigate('/');
    }
  }, [testId, navigate]);

  const currentQuestion = questions[selectedQuestionIndex];

  const updateTest = (updates: Partial<Test>) => {
    if (!test) return;
    
    const updatedTest = store.updateTest(test.id, updates);
    if (updatedTest) {
      setTest(updatedTest);
    }
  };

  const updateQuestion = (updates: Partial<Question>) => {
    if (!currentQuestion) return;
    
    const updatedQuestion = store.updateQuestion(currentQuestion.id, updates);
    if (updatedQuestion) {
      const newQuestions = [...questions];
      newQuestions[selectedQuestionIndex] = updatedQuestion;
      setQuestions(newQuestions);
    }
  };

  const addNewQuestion = () => {
    if (!test) return;
    
    const newQuestion = store.addQuestion(test.id, {
      type: 'MCQ',
      prompt: 'Nuova domanda...',
      options: ['Opzione A', 'Opzione B', 'Opzione C', 'Opzione D'],
      correctAnswer: { selected: 0 },
      points: 1
    });
    
    const updatedQuestions = store.getQuestions(test.id);
    setQuestions(updatedQuestions);
    setSelectedQuestionIndex(updatedQuestions.length - 1);
  };

  const deleteQuestion = (questionId: string) => {
    if (questions.length <= 1) {
      toast({
        title: "Impossibile eliminare",
        description: "Una verifica deve contenere almeno una domanda.",
        variant: "destructive"
      });
      return;
    }
    
    const success = store.deleteQuestion(questionId);
    if (success) {
      const updatedQuestions = store.getQuestions(test?.id || '');
      setQuestions(updatedQuestions);
      setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1));
      
      toast({
        title: "Domanda eliminata",
        description: "La domanda è stata rimossa dalla verifica."
      });
    }
  };

  const generateQuestions = async () => {
    if (!test) return;
    setShowAiModal(true);
  };

  const handleAcceptQuestions = async (generatedQuestions: any[]) => {
    if (!test || !testId) return;

    try {
      // Try to use API first
      const response = await fetch(`/api/tests/${testId}/questions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: generatedQuestions })
      });

      if (response.ok) {
        // Reload questions from server
        const questionsResponse = await fetch(`/api/tests/${testId}/questions`);
        if (questionsResponse.ok) {
          const { questions: serverQuestions } = await questionsResponse.json();
          const convertedQuestions = serverQuestions.map((q: any) => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : undefined,
            correctAnswer: q.correctAnswer ? JSON.parse(q.correctAnswer) : undefined
          }));
          setQuestions(convertedQuestions);
        }
        
        toast({
          title: "Domande aggiunte!",
          description: `Aggiunte ${generatedQuestions.length} nuove domande alla verifica.`,
          variant: "default"
        });
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      // Fallback to local storage
      console.log('API failed, using local storage fallback');
      
      generatedQuestions.forEach(q => {
        const convertedQuestion = {
          type: q.type,
          prompt: q.prompt,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          points: q.points || 1
        };
        store.addQuestion(test.id, convertedQuestion);
      });
      
      const updatedQuestions = store.getQuestions(test.id);
      setQuestions(updatedQuestions);
      
      toast({
        title: "Domande generate!",
        description: `Aggiunte ${generatedQuestions.length} nuove domande alla verifica.`,
        variant: "default"
      });
    }
  };

  const publishTest = () => {
    if (!test) return;
    
    const publishedTest = store.publishTest(test.id);
    if (publishedTest) {
      setTest(publishedTest);
      toast({
        title: "Verifica pubblicata!",
        description: `Codice di accesso: ${publishedTest.settings.joinCode}`,
        variant: "default"
      });
    }
  };

  const updateQuestionOptions = (options: string[]) => {
    updateQuestion({ options });
  };

  const updateCorrectAnswer = (answer: any) => {
    updateQuestion({ correctAnswer: answer });
  };

  if (!test) {
    return <Layout><div>Caricamento...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <VerificheButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alla Dashboard
            </VerificheButton>
            
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{test.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={test.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {test.status === 'DRAFT' ? 'Bozza' : test.status === 'PUBLISHED' ? 'Pubblicata' : 'Chiusa'}
                </Badge>
                {test.settings.joinCode && (
                  <Badge variant="outline" className="font-mono">
                    Codice: {test.settings.joinCode}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <VerificheButton
              variant="outline"
              onClick={generateQuestions}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Genera con AI (allineata)
            </VerificheButton>
            
            {test.status === 'DRAFT' && (
              <VerificheButton variant="success" onClick={publishTest}>
                <Share2 className="mr-2 h-4 w-4" />
                Pubblica
              </VerificheButton>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Questions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Domande ({questions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    index === selectedQuestionIndex
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted/50 border-border hover:bg-muted'
                  }`}
                  onClick={() => setSelectedQuestionIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Domanda {index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {question.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {question.prompt}
                  </p>
                </div>
              ))}
              
              <VerificheButton
                variant="outline"
                size="sm"
                onClick={addNewQuestion}
                className="w-full mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Domanda
              </VerificheButton>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Verifica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titolo</Label>
                  <Input
                    id="title"
                    value={test.title}
                    onChange={(e) => updateTest({ title: e.target.value })}
                    placeholder="Titolo della verifica"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={test.description}
                    onChange={(e) => updateTest({ description: e.target.value })}
                    placeholder="Descrizione opzionale della verifica"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Question Editor */}
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Domanda {selectedQuestionIndex + 1}</CardTitle>
                    <VerificheButton
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteQuestion(currentQuestion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </VerificheButton>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo Domanda</Label>
                      <Select 
                        value={currentQuestion.type} 
                        onValueChange={(value: QuestionType) => updateQuestion({ type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCQ">Scelta multipla</SelectItem>
                          <SelectItem value="TF">Vero/Falso</SelectItem>
                          <SelectItem value="SHORT">Risposta breve</SelectItem>
                          <SelectItem value="LONG">Risposta lunga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Punti</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={currentQuestion.points}
                        onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Testo Domanda</Label>
                    <Textarea
                      value={currentQuestion.prompt}
                      onChange={(e) => updateQuestion({ prompt: e.target.value })}
                      placeholder="Inserisci il testo della domanda..."
                      rows={3}
                    />
                  </div>

                  {/* Question Type Specific Fields */}
                  {currentQuestion.type === 'MCQ' && (
                    <div className="space-y-4">
                      <Label>Opzioni di Risposta</Label>
                      {(currentQuestion.options || []).map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              updateQuestionOptions(newOptions);
                            }}
                            placeholder={`Opzione ${String.fromCharCode(65 + index)}`}
                          />
                          <VerificheButton
                            variant={currentQuestion.correctAnswer?.selected === index ? 'success' : 'outline'}
                            size="sm"
                            onClick={() => updateCorrectAnswer({ selected: index })}
                          >
                            {currentQuestion.correctAnswer?.selected === index ? '✓' : '○'}
                          </VerificheButton>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'TF' && (
                    <div className="space-y-2">
                      <Label>Risposta Corretta</Label>
                      <div className="flex space-x-4">
                        <VerificheButton
                          variant={currentQuestion.correctAnswer?.boolean === true ? 'success' : 'outline'}
                          onClick={() => updateCorrectAnswer({ boolean: true })}
                        >
                          Vero
                        </VerificheButton>
                        <VerificheButton
                          variant={currentQuestion.correctAnswer?.boolean === false ? 'success' : 'outline'}
                          onClick={() => updateCorrectAnswer({ boolean: false })}
                        >
                          Falso
                        </VerificheButton>
                      </div>
                    </div>
                  )}

                  {(currentQuestion.type === 'SHORT' || currentQuestion.type === 'LONG') && (
                    <div>
                      <Label>Risposta Modello (opzionale)</Label>
                      <Textarea
                        value={currentQuestion.correctAnswer?.value || ''}
                        onChange={(e) => updateCorrectAnswer({ value: e.target.value })}
                        placeholder="Risposta di esempio per la correzione AI..."
                        rows={currentQuestion.type === 'LONG' ? 4 : 2}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <VerificheButton variant="primary" size="sm" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salva Modifiche
              </VerificheButton>
              
              <Separator />
              
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domande:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Punti totali:</span>
                  <span className="font-medium">
                    {questions.reduce((sum, q) => sum + q.points, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stato:</span>
                  <span className="font-medium">{test.status === 'DRAFT' ? 'Bozza' : 'Pubblicata'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Generation Modal */}
        <AlignedGenerationModal
          open={showAiModal}
          onOpenChange={setShowAiModal}
          initialData={{
            subject: test?.subject || '',
            topic: test?.topic || '',
            classLabel: test?.classLabel || '',
            description: test?.description || ''
          }}
          onAccept={handleAcceptQuestions}
        />
      </div>
    </Layout>
  );
};