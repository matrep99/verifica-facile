import { User, GraduationCap, LogOut } from 'lucide-react';
import { VerificheButton } from './ui/button-variants';
import { store } from '@/lib/store';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const currentUser = store.getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">VerificheApp</h1>
                <p className="text-sm text-muted-foreground">Sistema di gestione verifiche</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {currentUser?.name || currentUser?.email || 'Utente'}
                </span>
                <span className="text-muted-foreground">
                  ({currentUser?.role || 'DOCENTE'})
                </span>
              </div>
              
              <VerificheButton
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </VerificheButton>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};