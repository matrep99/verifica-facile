import { ArrowRight, CheckCircle, Zap, BarChart, Users, Clock } from 'lucide-react';
import { VerificheButton } from '@/components/ui/button-variants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const Homepage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Riduci il tempo di preparazione con l'AI",
      description: "Genera domande personalizzate in base a disciplina, argomento e classe"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Correggi automaticamente le chiuse",
      description: "Correzione automatica per domande a scelta multipla e vero/falso"
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Statistiche chiare su classe e singole domande",
      description: "Dashboard complete per monitorare i progressi degli studenti"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Funziona anche offline con bozze locali",
      description: "Continua a lavorare anche senza connessione internet"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              QuickGrade: crea, assegna e correggi 
              <span className="text-primary"> verifiche in minuti</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La piattaforma completa per docenti italiani che semplifica la creazione, 
              gestione e correzione delle verifiche scolastiche.
            </p>
          </div>

          {/* Pricing */}
          <div className="mb-12">
            <div className="inline-flex items-center bg-primary/10 rounded-full px-6 py-3 mb-6">
              <span className="text-primary font-semibold text-lg">9,99€ al mese</span>
              <span className="ml-2 text-muted-foreground">— prova subito</span>
            </div>
            
            <VerificheButton 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/app')}
              className="text-lg px-8 py-4"
            >
              Vai all'app
              <ArrowRight className="ml-2 h-5 w-5" />
            </VerificheButton>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-16">
            {features.map((feature, index) => (
              <Card key={index} className="text-left card-hover">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-20 bg-card/50 backdrop-blur-sm rounded-2xl border p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">15 min</div>
                <p className="text-muted-foreground">Tempo medio creazione verifica</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">80%</div>
                <p className="text-muted-foreground">Riduzione tempo correzione</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">1000+</div>
                <p className="text-muted-foreground">Docenti che ci hanno scelto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Pronto per iniziare?</h2>
          <p className="text-muted-foreground mb-6">
            Unisciti a migliaia di docenti che hanno già scelto QuickGrade
          </p>
          <VerificheButton 
            variant="primary" 
            size="lg"
            onClick={() => navigate('/app')}
          >
            <Clock className="mr-2 h-4 w-4" />
            Inizia ora gratuitamente
          </VerificheButton>
        </div>
      </div>
    </div>
  );
};