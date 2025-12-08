import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  '': 'Home',
  'programs': 'Programma\'s',
  'program': 'Programma',
  'workout': 'Workout',
  'check-in': 'Check-in',
  'community': 'Community',
  'account': 'Account',
  'education': 'Educatie',
  'membership': 'Lidmaatschap',
  'media': 'Media',
  'achievements': 'Achievements',
  'leaderboard': 'Leaderboard',
  'dashboard': 'Dashboard',
  'analytics': 'Analytics',
  'admin': 'Admin',
  'coach': 'Coach',
  'chat': 'Chat',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from URL if not provided
  const breadcrumbs = items || (() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Skip dynamic segments (like IDs)
      if (segment.includes('-') && segment.length > 20) {
        return;
      }

      generatedItems.push({
        label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
      });
    });

    return generatedItems;
  })();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm text-muted-foreground py-2', className)}
    >
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            {item.href ? (
              <Link 
                to={item.href}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {index === 0 && <Home className="w-4 h-4" />}
                <span className={index === 0 ? 'sr-only sm:not-sr-only' : ''}>
                  {item.label}
                </span>
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
