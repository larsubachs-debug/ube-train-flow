import { useEffect } from "react";
import { AchievementsGrid } from "@/components/achievements/AchievementsGrid";
import { useAchievements } from "@/hooks/useAchievements";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCw } from "lucide-react";

const Achievements = () => {
  const { checkAchievements, isChecking } = useAchievements();

  // Check achievements on mount
  useEffect(() => {
    checkAchievements();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
              <p className="text-sm text-muted-foreground">
                Unlock badges by crushing your goals
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkAchievements()}
            disabled={isChecking}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            Check Progress
          </Button>
        </div>

        {/* Achievements Grid */}
        <AchievementsGrid />
      </div>
    </div>
  );
};

export default Achievements;