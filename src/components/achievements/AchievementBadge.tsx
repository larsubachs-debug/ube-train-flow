import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface AchievementBadgeProps {
  name: string;
  description: string;
  badgeColor: string;
  badgeIcon: string;
  rarity: string | null;
  isUnlocked: boolean;
  progress?: number | null;
  requirementValue?: number | null;
  points?: number | null;
}

const rarityStyles = {
  common: "border-border",
  rare: "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  epic: "border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]",
  legendary: "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse",
};

export const AchievementBadge = ({
  name,
  description,
  badgeColor,
  badgeIcon,
  rarity,
  isUnlocked,
  progress = 0,
  requirementValue,
  points,
}: AchievementBadgeProps) => {
  const Icon = (LucideIcons as any)[badgeIcon] || LucideIcons.Award;
  const progressPercent = requirementValue ? ((progress || 0) / requirementValue) * 100 : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 bg-card p-4 transition-all hover:scale-105",
        isUnlocked ? rarityStyles[rarity as keyof typeof rarityStyles] || rarityStyles.common : "border-border opacity-50 grayscale"
      )}
    >
      {/* Badge Icon */}
      <div className="mb-3 flex items-center justify-center">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            isUnlocked ? "bg-gradient-to-br" : "bg-muted"
          )}
          style={
            isUnlocked
              ? {
                  backgroundImage: `linear-gradient(to bottom right, ${badgeColor}, ${badgeColor}dd)`,
                }
              : undefined
          }
        >
          <Icon className={cn("h-8 w-8", isUnlocked ? "text-white" : "text-muted-foreground")} />
        </div>
      </div>

      {/* Achievement Info */}
      <div className="text-center">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>

        {/* Progress Bar */}
        {!isUnlocked && requirementValue && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{progress || 0}</span>
              <span>{requirementValue}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Points Badge */}
        {points && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            <LucideIcons.Star className="h-3 w-3" />
            {points} pts
          </div>
        )}

        {/* Rarity Badge */}
        {rarity && isUnlocked && (
          <div className="mt-2">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                rarity === "legendary" && "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
                rarity === "epic" && "bg-purple-500/20 text-purple-400",
                rarity === "rare" && "bg-blue-500/20 text-blue-400",
                rarity === "common" && "bg-muted text-muted-foreground"
              )}
            >
              {rarity}
            </span>
          </div>
        )}
      </div>

      {/* Unlock indicator */}
      {isUnlocked && (
        <div className="absolute right-2 top-2">
          <LucideIcons.CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
      )}
    </div>
  );
};