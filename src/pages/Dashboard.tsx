import { ArrowRight, Plus, BookOpen, Users, BarChart, Clock, Target, Zap, Brain, Monitor as MonitorIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { store } from '@/lib/store';
import { Test } from '@/types';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    topic: '',
    classLabel: '',
    description: ''
  });

  const currentUser = store.getCurrentUser();
  const allTests = currentUser ? store.getUserTests(currentUser.id) : [];
  const recentTests = allTests.slice(0, 5);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.topic || !formData.classLabel) {
      alert('Disciplina, Argomento e Classe sono obbligatori');
      return;
    }

    setIsCreating(true);
    
    try {
      const test = store.createTest(
        formData.title || 'Nuova Verifica',
        formData.subject,
        formData.topic,
        formData.classLabel
      );

      if (formData.description) {
        store.updateTest(test.id, { description: formData.description });
      }

      navigate(`/builder/${test.id}`);
    } catch (error) {
      console.error('Errore nella creazione:', error);
      // Fallback locale verrebbe implementato qui
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: Test['status']) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Bozza</Badge>;
      case 'PUBLISHED':
        return <Badge variant="default">Pubblicata</Badge>;
      case 'CLOSED':
        return <Badge variant="outline">Chiusa</Badge>;
      default:
        return <Badge variant="secondary">Bozza</Badge>;
    }
  };

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text">VERIFICAI</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="rounded-2xl"
            >
              ← Homepage
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Welcome */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">
              Benvenuto in <span className="gradient-text">VERIFICAI</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Crea la tua prossima verifica in pochi minuti con l'aiuto dell'intelligenza artificiale
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form Creazione */}
            <div className="card-startup">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold">Crea Nuova Verifica</h2>
              </div>

              <form onSubmit={handleCreateTest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium">
                      Disciplina *
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="es. Matematica"
                      className="mt-1 rounded-2xl"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="topic" className="text-sm font-medium">
                      Argomento *
                    </Label>
                    <Input
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="es. Equazioni di primo grado"
                      className="mt-1 rounded-2xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="classLabel" className="text-sm font-medium">
                      Classe *
                    </Label>
                    <Input
                      id="classLabel"
                      value={formData.classLabel}
                      onChange={(e) => setFormData(prev => ({ ...prev, classLabel: e.target.value }))}
                      placeholder="es. 2A o Seconda media"
                      className="mt-1 rounded-2xl"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Titolo
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="es. Verifica di Matematica"
                      className="mt-1 rounded-2xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descrizione
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrizione della verifica..."
                    className="mt-1 rounded-2xl"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isCreating}
                  className="btn-primary w-full"
                >
                  {isCreating ? 'Creazione in corso...' : 'Crea Verifica'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Lista Verifiche Recenti */}
            <div className="card-startup">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold">Le Tue Verifiche</h2>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/monitor')}
                  className="rounded-2xl"
                >
                  Vedi tutte
                </Button>
              </div>

              {recentTests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna verifica ancora creata.</p>
                  <p className="text-sm">Compila il form qui accanto per iniziare!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTests.map((test) => (
                    <Card key={test.id} className="card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{test.title}</h3>
                              {getStatusBadge(test.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                {test.subject}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {test.classLabel}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(test.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/builder/${test.id}`)}
                            className="rounded-2xl"
                          >
                            Builder
                          </Button>
                          {test.status === 'PUBLISHED' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/grade/${test.id}`)}
                                className="rounded-2xl"
                              >
                                Correggi
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/results/${test.id}`)}
                                className="rounded-2xl"
                              >
                                Risultati
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <Card className="card-startup card-hover cursor-pointer" onClick={() => navigate('/monitor')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MonitorIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Monitoraggio</h3>
                <p className="text-muted-foreground text-sm">
                  Monitora tutte le tue verifiche e il loro stato
                </p>
              </CardContent>
            </Card>

            <Card className="card-startup card-hover cursor-pointer" onClick={() => navigate('/results')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Risultati</h3>
                <p className="text-muted-foreground text-sm">
                  Analizza i risultati delle tue verifiche
                </p>
              </CardContent>
            </Card>

            <Card className="card-startup card-hover cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI Assistant</h3>
                <p className="text-muted-foreground text-sm">
                  Genera domande intelligenti per le tue materie
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};