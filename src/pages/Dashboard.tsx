import { useState } from 'react';
import { Plus, FileText, Users, BarChart3, Settings, Monitor, Eye } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { VerificheButton } from '@/components/ui/button-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { Test } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    topic: '',
    classLabel: '',
    description: ''
  });
  const currentUser = store.getCurrentUser();
  const tests = currentUser ? store.getUserTests(currentUser.id) : [];

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !formData.subject || !formData.topic || !formData.classLabel) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Disciplina, Argomento e Classe sono obbligatori.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    try {
      // Simula chiamata API con possibile fallback locale
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newTest = store.createTest(
        formData.title || 'Nuova Verifica',
        formData.subject,
        formData.topic,
        formData.classLabel
      );
      
      if (formData.description) {
        store.updateTest(newTest.id, { description: formData.description });
      }
      
      toast({
        title: "Verifica creata",
        description: "La nuova verifica è stata creata con successo."
      });
      
      navigate(`/builder/${newTest.id}`);
    } catch (error) {
      console.error('Errore nella creazione del test:', error);
      
      // Fallback locale
      const localId = `local-${Date.now()}`;
      localStorage.setItem(`test-${localId}`, JSON.stringify({
        ...formData,
        id: localId,
        createdAt: new Date().toISOString()
      }));
      
      toast({
        title: "Modalità offline",
        description: "Verifica salvata localmente. Sarà sincronizzata quando torni online."
      });
      
      navigate(`/builder/${localId}`);
    } finally {
      setIsCreating(false);
      setShowCreateForm(false);
      setFormData({ title: '', subject: '', topic: '', classLabel: '', description: '' });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VerificheButton
            variant="primary"
            size="lg"
            onClick={() => setShowCreateForm(true)}
            disabled={isCreating}
          >
            <Plus className="mr-2 h-5 w-5" />
            Crea Nuova Verifica
          </VerificheButton>
          
          <VerificheButton
            variant="outline"
            size="lg"
            onClick={() => navigate('/monitor')}
          >
            <Monitor className="mr-2 h-5 w-5" />
            Monitoraggio & Correzione
          </VerificheButton>
          
          <VerificheButton
            variant="outline"
            size="lg"
            onClick={() => navigate('/results')}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Risultati Generali
          </VerificheButton>
        </div>

        {/* Create Test Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Crea Nuova Verifica</CardTitle>
              <CardDescription>
                Compila i campi per creare una nuova verifica. Disciplina, Argomento e Classe sono obbligatori.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="subject">Disciplina *</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matematica">Matematica</SelectItem>
                        <SelectItem value="Italiano">Italiano</SelectItem>
                        <SelectItem value="Storia">Storia</SelectItem>
                        <SelectItem value="Geografia">Geografia</SelectItem>
                        <SelectItem value="Scienze">Scienze</SelectItem>
                        <SelectItem value="Inglese">Inglese</SelectItem>
                        <SelectItem value="Arte">Arte</SelectItem>
                        <SelectItem value="Musica">Musica</SelectItem>
                        <SelectItem value="Educazione Fisica">Educazione Fisica</SelectItem>
                        <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="Religione">Religione</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="topic">Argomento *</Label>
                    <Input
                      id="topic"
                      placeholder="es. Equazioni di primo grado"
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="classLabel">Classe *</Label>
                    <Input
                      id="classLabel"
                      placeholder="es. 2A o Seconda media"
                      value={formData.classLabel}
                      onChange={(e) => setFormData(prev => ({ ...prev, classLabel: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Titolo</Label>
                  <Input
                    id="title"
                    placeholder="Titolo della verifica (opzionale)"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrizione</Label>
                  <Input
                    id="description"
                    placeholder="Breve descrizione della verifica (opzionale)"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <VerificheButton 
                    type="submit" 
                    variant="primary"
                    disabled={isCreating || !formData.subject || !formData.topic || !formData.classLabel}
                  >
                    {isCreating ? 'Creazione in corso...' : 'Crea Verifica'}
                  </VerificheButton>
                  
                  <VerificheButton 
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annulla
                  </VerificheButton>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
                          <CardDescription className="mt-1 space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="font-medium text-primary">{test.subject}</span>
                              <span>•</span>
                              <span>{test.topic}</span>
                              <span>•</span>
                              <span className="font-medium">{test.classLabel}</span>
                            </div>
                            {test.description && (
                              <div className="text-muted-foreground">
                                {test.description}
                              </div>
                            )}
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
                          Creata il {new Date(test.createdAt).toLocaleDateString('it-IT')}
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