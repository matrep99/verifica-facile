import { ArrowRight, CheckCircle, Zap, BarChart, Users, Clock, Brain, Target, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const Homepage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Crea verifiche in minuti con l'AI",
      description: "Genera domande personalizzate in base a disciplina, argomento e classe con validazione intelligente"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Correggi automaticamente le domande chiuse",
      description: "Correzione istantanea per domande a scelta multipla e vero/falso"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Suggerimenti AI sulle domande aperte",
      description: "Intelligenza artificiale ti aiuta a valutare le risposte elaborate"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Statistiche chiare su classi e argomenti",
      description: "Dashboard complete per monitorare i progressi e identificare aree di miglioramento"
    }
  ];

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">VERIFICAI</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="rounded-2xl"
          >
            Accedi all'app
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
              L'AI che prepara e corregge
              <span className="gradient-text block"> le tue verifiche</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              La piattaforma intelligente che trasforma il modo in cui crei, assegni e correggi le verifiche scolastiche. 
              Pensata per docenti italiani innovativi.
            </p>
          </div>

          {/* Pricing CTA */}
          <div className="mb-16">
            <div className="inline-flex items-center card-startup mb-6">
              <span className="gradient-text font-bold text-2xl">Solo 9,99€ al mese</span>
              <span className="ml-3 text-muted-foreground">— Provalo ora</span>
            </div>
            
            <Button 
              size="lg"
              onClick={() => navigate('/app')}
              className="btn-primary text-lg px-8 py-4 mb-8"
            >
              Inizia subito
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="text-sm text-muted-foreground">
              ✓ Nessun setup richiesto  ✓ Funziona subito  ✓ Dati al sicuro in Italia
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mt-20">
            {features.map((feature, index) => (
              <Card key={index} className="card-startup card-hover text-left">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center text-white">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold mb-2">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-24 card-startup">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-3">5 min</div>
                <p className="text-muted-foreground">Tempo medio creazione verifica</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-3">85%</div>
                <p className="text-muted-foreground">Riduzione tempo correzione</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text mb-3">1000+</div>
                <p className="text-muted-foreground">Docenti che ci hanno scelto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto per la rivoluzione AI?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Unisciti a migliaia di docenti che hanno già trasformato il loro modo di lavorare con VERIFICAI
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/app')}
            className="btn-primary text-lg px-8 py-4"
          >
            <Zap className="mr-2 h-5 w-5" />
            Inizia la trasformazione
          </Button>
        </div>
      </section>
    </div>
  );
};