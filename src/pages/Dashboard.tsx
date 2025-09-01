import { useState } from 'react';
import { Plus, FileText, Users, BarChart3, Settings } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { VerificheButton } from '@/components/ui/button-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { Test } from '@/types';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const currentUser = store.getCurrentUser();
  const tests = currentUser ? store.getUserTests(currentUser.id) : [];

  const handleCreateTest = async () => {
    if (!currentUser) return;
    
    setIsCreating(true);
    try {
      // Simula un piccolo delay per UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newTest = store.createTest('Nuova Verifica');
      navigate(`/builder/${newTest.id}`);
    } catch (error) {
      console.error('Errore nella creazione del test:', error);
    } finally {
      setIsCreating(false);
    }
  };

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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Dashboard */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Benvenuto, {currentUser?.name || 'Docente'}
          </h1>
          <p className="text-muted-foreground">
            Gestisci le tue verifiche e monitora i risultati degli studenti.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verifiche Totali</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tests.length}</div>
              <p className="text-xs text-muted-foreground">
                {tests.filter(t => t.status === 'PUBLISHED').length} pubblicate
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bozze</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {tests.filter(t => t.status === 'DRAFT').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Da completare
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Studenti Attivi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">24</div>
              <p className="text-xs text-muted-foreground">
                Ultimo mese
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Voti</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">7.8</div>
              <p className="text-xs text-muted-foreground">
                +0.3 dal mese scorso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <VerificheButton
            variant="primary"
            size="lg"
            onClick={handleCreateTest}
            disabled={isCreating}
            className="mb-6"
          >
            <Plus className="mr-2 h-5 w-5" />
            {isCreating ? 'Creazione in corso...' : 'Crea Nuova Verifica'}
          </VerificheButton>
        </div>

        {/* Tests List */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Le Tue Verifiche</h2>
          
          {tests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nessuna verifica creata
                </h3>
                <p className="text-muted-foreground mb-4">
                  Inizia creando la tua prima verifica per gli studenti.
                </p>
                <VerificheButton variant="primary" onClick={handleCreateTest}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crea Prima Verifica
                </VerificheButton>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => {
                const questions = store.getQuestions(test.id);
                const submissions = store.getTestSubmissions(test.id);
                
                return (
                  <Card key={test.id} className="card-hover cursor-pointer" 
                        onClick={() => navigate(`/builder/${test.id}`)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{test.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {test.description || 'Nessuna descrizione'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(test.status)}
                          {test.settings.joinCode && (
                            <Badge variant="outline" className="font-mono">
                              {test.settings.joinCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span>{questions.length} domande</span>
                          <span>{submissions.length} invii</span>
                        </div>
                        <div>
                          Creata il {test.createdAt.toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};