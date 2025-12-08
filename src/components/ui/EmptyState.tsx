import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  Calendar, 
  Users, 
  MessageSquare, 
  Trophy, 
  FileText,
  Image,
  Target,
  TrendingUp,
  ClipboardList
} from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'workout' | 'program' | 'community' | 'chat' | 'achievement' | 'media' | 'goals' | 'analytics' | 'tasks';
}

const variantIcons = {
  default: FileText,
  workout: Dumbbell,
  program: Calendar,
  community: Users,
  chat: MessageSquare,
  achievement: Trophy,
  media: Image,
  goals: Target,
  analytics: TrendingUp,
  tasks: ClipboardList,
};

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  variant = 'default' 
}: EmptyStateProps) {
  const IconComponent = variantIcons[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon || <IconComponent className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="hover-scale">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export const emptyStates = {
  workouts: {
    title: "Geen workouts gevonden",
    description: "Je hebt nog geen workouts voltooid. Start je eerste workout om je voortgang te zien!",
    variant: 'workout' as const,
  },
  programs: {
    title: "Geen programma's beschikbaar",
    description: "Er zijn momenteel geen programma's aan jou toegewezen. Neem contact op met je coach.",
    variant: 'program' as const,
  },
  messages: {
    title: "Geen berichten",
    description: "Je hebt nog geen berichten. Start een gesprek met je coach!",
    variant: 'chat' as const,
  },
  achievements: {
    title: "Nog geen achievements",
    description: "Voltooi workouts en bereik doelen om achievements te unlocken!",
    variant: 'achievement' as const,
  },
  media: {
    title: "Geen media geüpload",
    description: "Upload je eerste foto of video om je progressie te documenteren.",
    variant: 'media' as const,
  },
  tasks: {
    title: "Geen taken voor vandaag",
    description: "Je hebt alle taken voor vandaag voltooid. Goed bezig!",
    variant: 'tasks' as const,
  },
  members: {
    title: "Geen leden gevonden",
    description: "Er zijn nog geen leden aan jou gekoppeld.",
    variant: 'community' as const,
  },
  searchResults: {
    title: "Geen resultaten",
    description: "We konden niets vinden dat overeenkomt met je zoekopdracht. Probeer andere zoektermen.",
    variant: 'default' as const,
  },
};
