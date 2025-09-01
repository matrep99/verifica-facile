import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, User, FileText, Zap, Save, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerificheButton } from '@/components/ui/button-variants';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { store } from '@/lib/store';
import { mockAi } from '@/lib/ai-mock';
import { Submission, Answer, Question, Test } from '@/types';
import { GradingInterface } from '@/components/GradingInterface';
import { useToast } from '@/components/ui/use-toast';

export const Grade = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [test, setTest] = useState<Test | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    if (!testId) return;
    
    const testData = store.getTest(testId);
    if (!testData) {
      navigate('/monitor');
      return;
    }
    
    setTest(testData);
    setQuestions(store.getQuestions(testId));
    setSubmissions(store.getTestSubmissions(testId));
  }, [testId, navigate]);

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setAnswers(store.getSubmissionAnswers(submission.id));
  };

  const handleAiGrade = async (answer: Answer, question: Question) => {
    if (!answer.response.text || isGrading) return;
    
    setIsGrading(true);
    try {
      const result = await mockAi.gradeAnswer({
        prompt: question.prompt,
        studentAnswer: answer.response.text,
        modelAnswer: question.correctAnswer?.value || '',
        rubric: question.rubric ? JSON.stringify(question.rubric) : '',
        maxPoints: question.points
      });
      
      // Update the answer with AI suggestion
      const updatedAnswer = {
        ...answer,
        aiSuggestedScore: result.suggestedScore,
        feedback: result.feedback
      };
      
      // Update in store (mock implementation)
      const updatedAnswers = answers.map(a => 
        a.id === answer.id ? updatedAnswer : a
      );
      setAnswers(updatedAnswers);
      
      toast({
        title: "Suggerimento AI generato",
        description: "Revisa il punteggio e il feedback prima di salvare."
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile generare il suggerimento AI.",
        variant: "destructive"
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleSaveGrade = (answer: Answer, finalScore: number, feedback: string) => {
    // Update the answer with final grade
    const updatedAnswer = {
      ...answer,
      finalScore,
      feedback
    };
    
    // Update in store (this would normally be an API call)
    const updatedAnswers = answers.map(a => 
      a.id === answer.id ? updatedAnswer : a
    );
    setAnswers(updatedAnswers);
    
    toast({
      title: "Voto salvato",
      description: "Il voto è stato registrato con successo."
    });
  };

  const getSubmissionBadge = (state: Submission['state']) => {
    return state === 'SUBMITTED' 
      ? <Badge variant="default" className="bg-success text-success-foreground">Consegnato</Badge>
      : <Badge variant="secondary">In corso</Badge>;
  };

  const calculateTotalScore = (submissionAnswers: Answer[]) => {
    return submissionAnswers.reduce((total, answer) => {
      return total + (answer.finalScore || answer.autoScore || 0);
    }, 0);
  };

  if (!test) {
    return <Layout><div>Caricamento...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <VerificheButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/monitor')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Torna al monitoraggio
              </VerificheButton>
            </div>
            <h1 className="text-3xl font-semibold text-foreground">
              Correzione: {test.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <span className="font-medium text-primary">{test.subject}</span>
              <span>•</span>
              <span>{test.topic}</span>
              <span>•</span>
              <span className="font-medium">{test.classLabel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Elaborati ({submissions.length})
              </CardTitle>
              <CardDescription>
                Clicca su uno studente per iniziare la correzione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Nessun elaborato disponibile</p>
                  </div>
                ) : (
                  submissions.map(submission => {
                    const submissionAnswers = store.getSubmissionAnswers(submission.id);
                    const totalScore = calculateTotalScore(submissionAnswers);
                    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
                    
                    return (
                      <div
                        key={submission.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSubmission?.id === submission.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleSelectSubmission(submission)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {submission.studentName || 'Studente anonimo'}
                          </span>
                          {getSubmissionBadge(submission.state)}
                        </div>
                        
                        {submission.state === 'SUBMITTED' && (
                          <div className="text-sm text-muted-foreground">
                            Punteggio: {totalScore}/{maxScore}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          Consegnato: {submission.submittedAt?.toLocaleString('it-IT') || 'N/A'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grading Interface */}
          <div className="lg:col-span-2">
            {!selectedSubmission ? (
              <Card>
                <CardContent className="pt-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Seleziona un elaborato
                  </h3>
                  <p className="text-muted-foreground">
                    Scegli uno studente dalla lista per iniziare la correzione
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Elaborato di {selectedSubmission.studentName || 'Studente anonimo'}
                    </CardTitle>
                    <CardDescription>
                      Consegnato il {selectedSubmission.submittedAt?.toLocaleString('it-IT')}
                    </CardDescription>
                  </CardHeader>
                </Card>

                        {/* Questions and Answers */}
                {questions.map((question, index) => {
                  const answer = answers.find(a => a.questionId === question.id);
                  
                  return (
                    <Card key={question.id}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Domanda {index + 1} ({question.points} punti)
                        </CardTitle>
                        <CardDescription>
                          {question.prompt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Student Response */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Risposta dello studente:</label>
                          <div className="p-3 bg-muted rounded-lg">
                            {question.type === 'MCQ' && question.options ? (
                              <span>
                                {answer?.response.selected !== undefined
                                  ? question.options[answer.response.selected as number]
                                  : 'Nessuna risposta'
                                }
                                {answer?.autoScore !== undefined && (
                                  <Badge variant={answer.autoScore > 0 ? "default" : "destructive"} className="ml-2">
                                    {answer.autoScore > 0 ? 'Corretta' : 'Errata'}
                                  </Badge>
                                )}
                              </span>
                            ) : question.type === 'TF' ? (
                              <span>
                                {answer?.response.boolean !== undefined
                                  ? (answer.response.boolean ? 'Vero' : 'Falso')
                                  : 'Nessuna risposta'
                                }
                                {answer?.autoScore !== undefined && (
                                  <Badge variant={answer.autoScore > 0 ? "default" : "destructive"} className="ml-2">
                                    {answer.autoScore > 0 ? 'Corretta' : 'Errata'}
                                  </Badge>
                                )}
                              </span>
                            ) : (
                              <p className="whitespace-pre-wrap">
                                {answer?.response.text || 'Nessuna risposta'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Grading Interface for Open Questions */}
                        {(question.type === 'SHORT' || question.type === 'LONG') && answer && (
                          <GradingInterface 
                            answer={answer}
                            question={question}
                            questionIndex={index}
                            isGrading={isGrading}
                            onAiGrade={() => handleAiGrade(answer, question)}
                            onSaveGrade={handleSaveGrade}
                          />
                        )}

                        {/* Auto Grade Display */}
                        {answer?.autoScore !== undefined && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Correzione automatica:</span>
                              <Badge variant={answer.autoScore > 0 ? "default" : "secondary"}>
                                {answer.autoScore}/{question.points} punti
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};