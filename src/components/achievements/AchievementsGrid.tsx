import { useAchievements } from "@/hooks/useAchievements";
import { AchievementBadge } from "./AchievementBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const AchievementsGrid = () => {
  const { achievements, userAchievements, isLoading } = useAchievements();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const categories = [
    { value: "all", label: "All" },
    { value: "milestone", label: "Milestones" },
    { value: "streak", label: "Streaks" },
    { value: "pr", label: "PRs" },
  ];

  const getUserAchievement = (achievementId: string) => {
    return userAchievements.find((ua) => ua.achievement_id === achievementId);
  };

  const renderAchievements = (category?: string) => {
    const filtered = category === "all" || !category
      ? achievements
      : achievements.filter((a) => a.category === category);

    const unlockedCount = filtered.filter((a) => {
      const userAch = getUserAchievement(a.id);
      return userAch?.is_unlocked;
    }).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Unlocked: {unlockedCount} / {filtered.length}
          </p>
          <div className="text-sm font-medium text-primary">
            Total Points: {filtered.reduce((sum, a) => {
              const userAch = getUserAchievement(a.id);
              return sum + (userAch?.is_unlocked ? (a.points || 0) : 0);
            }, 0)}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((achievement) => {
            const userAch = getUserAchievement(achievement.id);
            return (
              <AchievementBadge
                key={achievement.id}
                name={achievement.name}
                description={achievement.description}
                badgeColor={achievement.badge_color}
                badgeIcon={achievement.badge_icon}
                rarity={achievement.rarity}
                isUnlocked={userAch?.is_unlocked || false}
                progress={userAch?.progress}
                requirementValue={achievement.requirement_value}
                points={achievement.points}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-6 w-full justify-start">
        {categories.map((cat) => (
          <TabsTrigger key={cat.value} value={cat.value}>
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((cat) => (
        <TabsContent key={cat.value} value={cat.value}>
          {renderAchievements(cat.value === "all" ? undefined : cat.value)}
        </TabsContent>
      ))}
    </Tabs>
  );
};