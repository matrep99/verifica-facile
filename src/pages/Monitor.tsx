import { useState, useMemo } from 'react';
import { FileText, Users, BarChart3, Filter, Eye, Edit, Settings } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerificheButton } from '@/components/ui/button-variants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { Test } from '@/types';

export const Monitor = () => {
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  const allTests = currentUser ? store.getUserTests(currentUser.id) : [];
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Get unique subjects and classes for filters
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(allTests.map(test => test.subject));
    return Array.from(subjects).sort();
  }, [allTests]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(allTests.map(test => test.classLabel));
    return Array.from(classes).sort();
  }, [allTests]);

  // Filter tests
  const filteredTests = useMemo(() => {
    return allTests.filter(test => {
      if (statusFilter !== 'all' && test.status !== statusFilter) return false;
      if (subjectFilter !== 'all' && test.subject !== subjectFilter) return false;
      if (classFilter !== 'all' && test.classLabel !== classFilter) return false;
      return true;
    });
  }, [allTests, statusFilter, subjectFilter, classFilter]);

  const getStatusBadge = (status: Test['status']) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Bozza</Badge>;
      case 'PUBLISHED':
        return <Badge variant="default" className="bg-success text-success-foreground">Pubblicata</Badge>;
      case 'CLOSED':
        return <Badge variant="outline">Chiusa</Badge>;
      default:
        return null;
    }
  };

  const getSubmissionCount = (testId: string) => {
    const submissions = store.getTestSubmissions(testId);
    return {
      total: submissions.length,
      submitted: submissions.filter(s => s.state === 'SUBMITTED').length
    };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Monitoraggio & Correzione
          </h1>
          <p className="text-muted-foreground">
            Gestisci tutte le tue verifiche e monitora i progressi degli studenti.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Stato</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="DRAFT">Bozza</SelectItem>
                    <SelectItem value="PUBLISHED">Pubblicata</SelectItem>
                    <SelectItem value="CLOSED">Chiusa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Disciplina</label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le discipline</SelectItem>
                    {uniqueSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Classe</label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le classi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le classi</SelectItem>
                    {uniqueClasses.map(classLabel => (
                      <SelectItem key={classLabel} value={classLabel}>{classLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verifiche ({filteredTests.length})</CardTitle>
            <CardDescription>
              Clicca su una verifica per aprire le azioni disponibili
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nessuna verifica trovata
                </h3>
                <p className="text-muted-foreground mb-4">
                  Prova a modificare i filtri o crea una nuova verifica.
                </p>
                <VerificheButton variant="primary" onClick={() => navigate('/app')}>
                  Crea Nuova Verifica
                </VerificheButton>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTests.map((test) => {
                  const submissionStats = getSubmissionCount(test.id);
                  const questions = store.getQuestions(test.id);
                  
                  return (
                    <div key={test.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-foreground truncate">
                              {test.title}
                            </h3>
                            {getStatusBadge(test.status)}
                            {test.settings.joinCode && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {test.settings.joinCode}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span className="font-medium text-primary">{test.subject}</span>
                            <span>•</span>
                            <span>{test.topic}</span>
                            <span>•</span>
                            <span className="font-medium">{test.classLabel}</span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{questions.length} domande</span>
                            <span>•</span>
                            <span>{submissionStats.submitted}/{submissionStats.total} elaborati</span>
                            <span>•</span>
                            <span>Aggiornata il {test.updatedAt.toLocaleDateString('it-IT')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <VerificheButton
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/builder/${test.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Builder
                          </VerificheButton>
                          
                          {test.status === 'PUBLISHED' && (
                            <VerificheButton
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/grade/${test.id}`)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Correggi
                            </VerificheButton>
                          )}
                          
                          <VerificheButton
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/results/${test.id}`)}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Risultati
                          </VerificheButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};