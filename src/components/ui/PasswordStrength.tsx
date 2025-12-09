import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  labelKey: string;
  fallback: string;
  met: boolean;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useTranslation();

  const requirements: Requirement[] = useMemo(() => [
    { labelKey: 'password.minChars', fallback: 'Minimaal 8 karakters', met: password.length >= 8 },
    { labelKey: 'password.uppercase', fallback: 'Bevat een hoofdletter', met: /[A-Z]/.test(password) },
    { labelKey: 'password.lowercase', fallback: 'Bevat een kleine letter', met: /[a-z]/.test(password) },
    { labelKey: 'password.number', fallback: 'Bevat een cijfer', met: /[0-9]/.test(password) },
    { labelKey: 'password.special', fallback: 'Bevat een speciaal teken', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    if (metCount <= 1) return { level: 'weak', labelKey: 'password.weak', fallback: 'Zwak', color: 'bg-destructive' };
    if (metCount <= 3) return { level: 'fair', labelKey: 'password.fair', fallback: 'Matig', color: 'bg-yellow-500' };
    if (metCount <= 4) return { level: 'good', labelKey: 'password.good', fallback: 'Goed', color: 'bg-blue-500' };
    return { level: 'strong', labelKey: 'password.strong', fallback: 'Sterk', color: 'bg-green-500' };
  }, [requirements]);

  const progressWidth = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    return `${(metCount / requirements.length) * 100}%`;
  }, [requirements]);

  if (!password) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t('password.strength', 'Wachtwoordsterkte')}</span>
          <span className={`font-medium ${
            strength.level === 'weak' ? 'text-destructive' :
            strength.level === 'fair' ? 'text-yellow-600' :
            strength.level === 'good' ? 'text-blue-600' :
            'text-green-600'
          }`}>
            {t(strength.labelKey, strength.fallback)}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li 
            key={index} 
            className={`flex items-center gap-2 text-xs transition-colors ${
              req.met ? 'text-green-600' : 'text-muted-foreground'
            }`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            {t(req.labelKey, req.fallback)}
          </li>
        ))}
      </ul>
    </div>
  );
}
