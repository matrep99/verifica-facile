import { Button } from './button';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

// Varianti personalizzate del button per l'app verifiche
export interface VerificheButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const VerificheButton = forwardRef<HTMLButtonElement, VerificheButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Mappa le varianti personalizzate a quelle esistenti del Button
    let buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
    
    if (variant === 'destructive' || variant === 'outline' || variant === 'secondary' || variant === 'ghost' || variant === 'link') {
      buttonVariant = variant;
    }

    return (
      <Button
        ref={ref}
        className={cn(
          // Varianti personalizzate
          variant === 'primary' && 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-card',
          variant === 'success' && 'bg-success hover:bg-success-hover text-success-foreground shadow-card',
          variant === 'warning' && 'bg-warning hover:bg-warning/90 text-warning-foreground shadow-card',
          className
        )}
        variant={buttonVariant}
        size={size}
        {...props}
      />
    );
  }
);

VerificheButton.displayName = 'VerificheButton';