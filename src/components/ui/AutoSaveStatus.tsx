import { Cloud, Save, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  className?: string;
}

export function AutoSaveStatus({ status, lastSaved, className }: AutoSaveStatusProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      {status === 'saving' && (
        <>
          <Cloud className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
          <span className="text-muted-foreground">Opslaan...</span>
        </>
      )}
      
      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-green-600" />
          <span className="text-green-600">Opgeslagen</span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-destructive">Opslaan mislukt</span>
        </>
      )}
      
      {status === 'idle' && lastSaved && (
        <>
          <Save className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            Laatst opgeslagen om {formatTime(lastSaved)}
          </span>
        </>
      )}
    </div>
  );
}
