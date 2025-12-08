import { Badge } from "@/components/ui/badge";
import { Link2, Zap, RotateCcw } from "lucide-react";

type GroupType = "superset" | "circuit" | "dropset" | null;

interface SupersetIndicatorProps {
  groupType: GroupType;
  groupId?: string;
  exerciseCount?: number;
  currentIndex?: number;
  isActive?: boolean;
}

const GROUP_CONFIG: Record<string, { 
  label: string; 
  icon: React.ReactNode; 
  bgClass: string; 
  textClass: string;
  borderClass: string;
}> = {
  superset: {
    label: "Superset",
    icon: <Link2 className="h-3 w-3" />,
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-500",
  },
  circuit: {
    label: "Circuit",
    icon: <RotateCcw className="h-3 w-3" />,
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-500",
  },
  dropset: {
    label: "Dropset",
    icon: <Zap className="h-3 w-3" />,
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-500",
  },
};

export const SupersetIndicator = ({
  groupType,
  groupId,
  exerciseCount = 2,
  currentIndex = 0,
  isActive = false,
}: SupersetIndicatorProps) => {
  if (!groupType) return null;

  const config = GROUP_CONFIG[groupType];
  if (!config) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`${config.bgClass} ${config.textClass} ${config.borderClass} gap-1`}
      >
        {config.icon}
        {config.label}
        {exerciseCount > 1 && (
          <span className="ml-1 opacity-70">
            ({currentIndex + 1}/{exerciseCount})
          </span>
        )}
      </Badge>
      {isActive && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Geen rust tussen oefeningen
        </span>
      )}
    </div>
  );
};

// Helper component to wrap grouped exercises
interface SupersetWrapperProps {
  groupType: GroupType;
  children: React.ReactNode;
}

export const SupersetWrapper = ({ groupType, children }: SupersetWrapperProps) => {
  if (!groupType) {
    return <>{children}</>;
  }

  const config = GROUP_CONFIG[groupType];
  if (!config) {
    return <>{children}</>;
  }

  return (
    <div className={`relative pl-4 border-l-4 ${config.borderClass} ${config.bgClass} rounded-r-lg p-4 space-y-4`}>
      <div className="absolute -left-3 top-4">
        <div className={`w-6 h-6 rounded-full ${config.bgClass} ${config.textClass} flex items-center justify-center`}>
          {config.icon}
        </div>
      </div>
      {children}
    </div>
  );
};
