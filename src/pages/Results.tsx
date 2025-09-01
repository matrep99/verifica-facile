import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, Download, ArrowLeft, TrendingUp, Users, Target } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerificheButton } from '@/components/ui/button-variants';
import { store } from '@/lib/store';
import { Test, Submission, Answer, Question } from '@/types';

export const Results = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!testId) return;
    
    const testData = store.getTest(testId);
    if (!testData) {
      navigate('/monitor');
      return;
    }
    
    setTest(testData);
    setQuestions(store.getQuestions(testId));
    setSubmissions(store.getTestSubmissions(testId).filter(s => s.state === 'SUBMITTED'));
  }, [testId, navigate]);

  const analytics = useMemo(() => {
    if (!test) return null;
    return store.getTestAnalytics(test.id);
  }, [test]);

  const scoreDistribution = useMemo(() => {
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const ranges = [
      { label: '0-3', min: 0, max: 3, count: 0 },
      { label: '4-5', min: 4, max: 5, count: 0 },
      { label: '6-7', min: 6, max: 7, count: 0 },
      { label: '8-9', min: 8, max: 9, count: 0 },
      { label: '10', min: 10, max: 10, count: 0 }
    ];

    submissions.forEach(submission => {
      const score = submission.totalScore || 0;
      const normalizedScore = Math.round((score / maxScore) * 10);
      
      const range = ranges.find(r => normalizedScore >= r.min && normalizedScore <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [submissions, questions]);

  const exportToCSV = () => {
    if (!test || submissions.length === 0) return;

    const headers = ['Studente', 'Punteggio Totale', 'Punteggio Max', 'Voto'];
    questions.forEach((q, index) => {
      headers.push(`Domanda ${index + 1} (${q.points}pt)`);
    });

    const rows = submissions.map(submission => {
      const answers = store.getSubmissionAnswers(submission.id);
      const totalScore = submission.totalScore || 0;
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
      const normalizedScore = Math.round((totalScore / maxScore) * 10);
      
      const row = [
        submission.studentName || 'Anonimo',
        totalScore.toString(),
        maxScore.toString(),
        normalizedScore.toString()
      ];

      questions.forEach(question => {
        const answer = answers.find(a => a.questionId === question.id);
        const score = answer?.finalScore || answer?.autoScore || 0;
        row.push(score.toString());
      });

      return row;
    });

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `risultati_${test.title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!test || !analytics) {
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
              Risultati: {test.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <span className="font-medium text-primary">{test.subject}</span>
              <span>•</span>
              <span>{test.topic}</span>
              <span>•</span>
              <span className="font-medium">{test.classLabel}</span>
            </div>
          </div>
          
          <VerificheButton
            variant="outline"
            onClick={exportToCSV}
            disabled={submissions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </VerificheButton>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elaborati</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                Totali consegnati
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Classe</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {analytics.averageScore.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Punteggio medio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voto Medio</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {submissions.length > 0 ? 
                  (submissions.reduce((sum, s) => {
                    const maxScore = questions.reduce((qSum, q) => qSum + q.points, 0);
                    return sum + ((s.totalScore || 0) / maxScore * 10);
                  }, 0) / submissions.length).toFixed(1) : '0'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Su scala 1-10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasso Completamento</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.completionRate.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Verifiche completate
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione Voti</CardTitle>
              <CardDescription>
                Distribuzione dei voti in decimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scoreDistribution.map((range, index) => {
                  const percentage = submissions.length > 0 ? (range.count / submissions.length) * 100 : 0;
                  return (
                    <div key={range.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{range.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {range.count} studenti ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Question Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analisi Domande</CardTitle>
              <CardDescription>
                Percentuale di risposte corrette per domanda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.questionStats.map((stat, index) => {
                  const percentage = stat.totalAnswers > 0 ? (stat.correctAnswers / stat.totalAnswers) * 100 : 0;
                  const difficulty = percentage >= 80 ? 'Facile' : percentage >= 60 ? 'Media' : 'Difficile';
                  const difficultyColor = percentage >= 80 ? 'text-success' : percentage >= 60 ? 'text-warning' : 'text-destructive';
                  
                  return (
                    <div key={stat.questionId}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Domanda {index + 1}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={difficultyColor}>
                            {difficulty}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`rounded-full h-2 transition-all ${
                            percentage >= 80 ? 'bg-success' : 
                            percentage >= 60 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {stat.prompt}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Risultati Studenti</CardTitle>
            <CardDescription>
              Dettaglio punteggi per ogni studente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nessun elaborato disponibile
                </h3>
                <p className="text-muted-foreground">
                  Gli elaborati appariranno qui una volta che gli studenti avranno consegnato.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Studente</th>
                      <th className="text-center p-2">Punteggio</th>
                      <th className="text-center p-2">Voto</th>
                      <th className="text-center p-2">Consegnato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(submission => {
                      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
                      const totalScore = submission.totalScore || 0;
                      const normalizedScore = Math.round((totalScore / maxScore) * 10);
                      
                      return (
                        <tr key={submission.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">
                            {submission.studentName || 'Studente anonimo'}
                          </td>
                          <td className="p-2 text-center">
                            {totalScore}/{maxScore}
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={normalizedScore >= 6 ? "default" : "destructive"}>
                              {normalizedScore}/10
                            </Badge>
                          </td>
                          <td className="p-2 text-center text-sm text-muted-foreground">
                            {submission.submittedAt?.toLocaleString('it-IT')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};