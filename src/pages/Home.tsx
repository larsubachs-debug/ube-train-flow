import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, Award, Play, Users, BookOpen, ArrowRight, CheckCircle2, Utensils, PartyPopper, Target } from "lucide-react";
import ubeLogo from "@/assets/ube-logo.png";
import defaultCoach from "@/assets/default-coach.jpg";
import { useUserProgress } from "@/hooks/useUserProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrograms } from "@/hooks/usePrograms";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DailyCheckinCard } from "@/components/checkin/DailyCheckinCard";
import { DailyTasksCard } from "@/components/tasks/DailyTasksCard";
import { DailyHabitsCard } from "@/components/habits/DailyHabitsCard";
import { UnplannedWorkoutDialog } from "@/components/workouts/UnplannedWorkoutDialog";
import { WeeklyTaskProgress } from "@/components/tasks/WeeklyTaskProgress";
import { useBranding } from "@/hooks/useBranding";
import { StreakIndicator } from "@/components/StreakIndicator";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { PullToRefresh } from "@/components/PullToRefresh";
import { programs as staticPrograms } from "@/data/programs";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { NoProgramState } from "@/components/programs/NoProgramState";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import BottomNav from "@/components/BottomNav";

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: branding } = useBranding();
  const [userProgramId, setUserProgramId] = useState<string | null>(null);
  const [coachAvatar, setCoachAvatar] = useState<string | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 0 });
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<Set<string>>(new Set());
  const hasShownCongrats = useRef(sessionStorage.getItem('weeklyCongratsShown') === 'true');
  const { data: programs = [], refetch: refetchPrograms, isLoading: programsLoading } = usePrograms();
  const queryClient = useQueryClient();

  // Use database programs or fallback to static programs for display
  const displayPrograms = programs.length > 0 ? programs : staticPrograms;

  // Get user's assigned program and weekly workout progress
  useEffect(() => {
    if (!user) return;

    const fetchUserProgramAndProgress = async () => {
      // Get user's most recent valid program (sometimes old assignments point to deleted programs)
      const { data: progressRows } = await supabase
        .from("user_program_progress")
        .select("program_id, current_week_number, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      let chosen: { program_id: string; current_week_number: number | null } | null = null;

      for (const row of progressRows || []) {
        if (!row?.program_id) continue;
        const { data: programExists } = await supabase
          .from("programs")
          .select("id")
          .eq("id", row.program_id)
          .maybeSingle();

        if (programExists?.id) {
          chosen = { program_id: row.program_id, current_week_number: row.current_week_number };
          break;
        }
      }

      setUserProgramId(chosen?.program_id || null);

      if (chosen?.program_id) {
        // Get current week's workouts
        const { data: weekData } = await supabase
          .from("weeks")
          .select("id")
          .eq("program_id", chosen.program_id)
          .eq("week_number", chosen.current_week_number || 1)
          .maybeSingle();

        if (weekData?.id) {
          // Get workouts for this week
          const { data: workouts } = await supabase
            .from("workouts")
            .select("id")
            .eq("week_id", weekData.id);

          const totalWorkouts = workouts?.length || 0;

          if (totalWorkouts > 0) {
            const workoutIds = workouts!.map(w => w.id);
            
            // Get completions for these workouts (current week only)
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diff);
            startOfWeek.setHours(0, 0, 0, 0);
            const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

            const { data: completions } = await supabase
              .from("workout_completions")
              .select("workout_id")
              .eq("user_id", user.id)
              .in("workout_id", workoutIds)
              .gte("completion_date", startOfWeekStr);

            // Track completed workout IDs for stamp display
            const completedIds = new Set(completions?.map(c => c.workout_id) || []);
            setCompletedWorkoutIds(completedIds);
            
            setWeeklyProgress({ completed: completedIds.size, total: totalWorkouts });
          } else {
            setWeeklyProgress({ completed: 0, total: 0 });
          }
        }
      }
    };
    fetchUserProgramAndProgress();
  }, [user]);

  // Get coach's avatar
  useEffect(() => {
    if (!user) return;
    const fetchCoachAvatar = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.coach_id) {
        const { data: coachProfile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", profile.coach_id)
          .maybeSingle();
        setCoachAvatar(coachProfile?.avatar_url || null);
      }
    };
    fetchCoachAvatar();
  }, [user]);

  // Show congratulations when all workouts are completed (once per session)
  useEffect(() => {
    if (
      weeklyProgress.total > 0 && 
      weeklyProgress.completed === weeklyProgress.total && 
      !hasShownCongrats.current
    ) {
      hasShownCongrats.current = true;
      sessionStorage.setItem('weeklyCongratsShown', 'true');
      toast({
        title: "Gefeliciteerd! 🎉",
        description: "Je hebt alle workouts van deze week voltooid. Geweldig gedaan!",
      });
    }
  }, [weeklyProgress, toast]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    // Don't reset congrats - only show once per session
    await Promise.all([
      refetchPrograms(),
      queryClient.invalidateQueries({ queryKey: ["branding"] }),
      queryClient.invalidateQueries({ queryKey: ["userProgress"] }),
    ]);
  }, [refetchPrograms, queryClient]);

  // Use assigned program - only use DB programs, not static fallback
  const currentProgram = programs.find((p) => p.id === userProgramId);
  const { progress, currentWeek, loading } = useUserProgress(currentProgram?.id);

  // Check if user actually has a valid program with workouts
  const hasValidProgram = currentProgram && currentProgram.weeks && currentProgram.weeks.length > 0;

  // Find the actual week from the program data based on progress
  const thisWeek = hasValidProgram
    ? currentProgram.weeks.find((w) => w.weekNumber === (progress?.current_week_number || 1)) ||
      currentProgram.weeks[0]
    : null;

  // Remove early return - the training plan section is already conditional

  if (programsLoading && loading) {
    return <DashboardSkeleton />;
  }

  const completedWorkouts = weeklyProgress.completed;
  const totalWorkouts = weeklyProgress.total;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen pb-20 bg-background">
      {/* Header with centered logo */}
      <div className="relative flex items-center px-6 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('home.today')}</h1>
          {user && <p className="text-sm text-muted-foreground">
              {t('home.welcome')}, {user.user_metadata?.display_name || user.email?.split('@')[0]}
            </p>}
        </div>
        
      </div>

      <div className="px-6 space-y-6">
        {/* Weekly Progress */}
        {branding?.show_weekly_progress !== false && totalWorkouts > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{t('home.weeklyProgress')}</h2>
              <span className="text-sm text-muted-foreground">{completedWorkouts}/{totalWorkouts} {t('home.sessions')}</span>
            </div>
            
            <div className="flex gap-2">
              {Array.from({ length: totalWorkouts }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i < completedWorkouts ? 'bg-foreground' : 'bg-muted'}`} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-2">
          <Link to="/nutrition" className="group">
            <div className="bg-muted rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <Utensils className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-foreground text-center">Voeding</span>
            </div>
          </Link>
          <Link to="/habits" className="group">
            <div className="bg-muted rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <Target className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-foreground text-center">Gewoontes</span>
            </div>
          </Link>
          <Link to="/education" className="group">
            <div className="bg-muted rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-foreground text-center">{t('home.guides')}</span>
            </div>
          </Link>
          <Link to="/dashboard" className="group">
            <div className="bg-muted rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-foreground text-center">{t('home.kpi')}</span>
            </div>
          </Link>
          <Link to="/community" className="group">
            <div className="bg-muted rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors hover:bg-muted/80">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-foreground text-center">{t('nav.community')}</span>
            </div>
          </Link>
        </div>

        {/* Program Phase Card - only show if program exists */}
        {hasValidProgram && (
          loading ? (
            <Card className="p-4 bg-foreground text-background">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-foreground text-background">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={coachAvatar || defaultCoach} alt="Coach" className="w-full h-full object-cover scale-[1.1] object-center" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold mb-1">
                    {currentWeek?.phase_name || `Weeks ${progress?.current_week_number || 1}-4, Accumulation`}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {currentWeek?.description || "Je bouwt geleidelijk op met meer volume en intensiteit."}
                  </p>
                </div>
              </div>
            </Card>
          )
        )}

        {/* Streak Indicator */}
        <div data-tour="streak">
          <ComponentErrorBoundary componentName="StreakIndicator">
            <StreakIndicator />
          </ComponentErrorBoundary>
        </div>

        {/* Niet geplande workout */}
        <div data-tour="activity">
          <UnplannedWorkoutDialog />
        </div>

        {/* Daily Check-in */}
        <div data-tour="checkin">
          <ComponentErrorBoundary componentName="DailyCheckinCard">
            <DailyCheckinCard />
          </ComponentErrorBoundary>
        </div>

        {/* Daily Habits */}
        <ComponentErrorBoundary componentName="DailyHabitsCard">
          <DailyHabitsCard />
        </ComponentErrorBoundary>

        {/* Weekly Task Progress */}
        <ComponentErrorBoundary componentName="WeeklyTaskProgress">
          <WeeklyTaskProgress />
        </ComponentErrorBoundary>

        {/* Daily Tasks */}
        <div data-tour="tasks">
          <ComponentErrorBoundary componentName="DailyTasksCard">
            <DailyTasksCard />
          </ComponentErrorBoundary>
        </div>

        {/* No Program State - show when no valid program */}
        {!hasValidProgram && (
          <NoProgramState />
        )}

        {/* Your Training Plan - only show if program is assigned and has workouts */}
        {hasValidProgram && thisWeek?.workouts && thisWeek.workouts.length > 0 && (
          <div className="space-y-4" data-tour="workouts">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('home.yourTrainingPlan')}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t('home.nextWeekDrops')}</p>
              </div>
              <Link to="/programs">
                <Button variant="outline" size="sm">
                  {t('nav.programs')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {thisWeek.workouts.slice(0, 3).map((workout, index) => {
                const totalExercises = (workout.warmUp?.length || 0) + (workout.mainLifts?.length || 0) + (workout.accessories?.length || 0);
                const isCompleted = completedWorkoutIds.has(workout.id);
                
                // Motivational messages for completed workouts - use workout.id as seed for consistent message
                const motivationalMessages = [
                  "Beast Mode! 💪",
                  "Crushed It! 🔥",
                  "Champion! 🏆",
                  "Unstoppable! ⚡",
                  "Legend! 🌟",
                  "Warrior! 🦁",
                  "On Fire! 🔥",
                  "Nailed It! ✨",
                  "Hero! 🎯",
                  "Machine! 🤖"
                ];
                // Use a hash of the workout id to get a consistent but "random" message per workout
                const messageIndex = workout.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % motivationalMessages.length;
                const motivationalMessage = motivationalMessages[messageIndex];
                
                return (
                  <Link key={workout.id} to={`/programs/${currentProgram.id}/workout/${workout.id}`} className="block">
                    <Card className={`p-4 hover:shadow-md transition-shadow bg-card border border-border relative overflow-hidden ${isCompleted ? 'ring-2 ring-accent' : ''}`}>
                      {/* Completed stamp overlay */}
                      {isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <div className="bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg transform -rotate-12 shadow-lg border-4 border-accent-foreground/20">
                            <div className="text-center">
                              <p className="text-2xl font-black tracking-tight">U did it</p>
                              <p className="text-lg font-bold">{(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '').split(' ')[0]}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex items-start justify-between mb-3 ${isCompleted ? 'opacity-40' : ''}`}>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Thurs 7th</p>
                          <h3 className="text-lg font-bold text-foreground">{workout.name}</h3>
                        </div>
                        {isCompleted ? (
                          <div className="w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-foreground" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full border-2 border-muted flex items-center justify-center flex-shrink-0">
                            <Play className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className={`grid grid-cols-4 gap-3 ${isCompleted ? 'opacity-40' : ''}`}>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t('home.time')}</p>
                          <p className="text-sm font-bold text-foreground">{workout.duration}:00</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t('home.weight')}</p>
                          <p className="text-sm font-bold text-foreground">-</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t('home.sets')}</p>
                          <p className="text-sm font-bold text-foreground">{totalExercises}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t('home.pb')}</p>
                          <p className="text-sm font-bold text-foreground">-</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <Link to={`/programs/${currentProgram.id}`}>
              <Button variant="outline" className="w-full">
                {t('home.viewAllWorkouts')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />

      {/* Onboarding Tour */}
      <OnboardingTour 
        tourId="home-tour"
        steps={[
          {
            target: '[data-tour="streak"]',
            title: t('onboarding.streakTitle', 'Je Streak'),
            content: t('onboarding.streakContent', 'Hier zie je hoeveel dagen achter elkaar je hebt getraind. Houd je streak vast voor extra motivatie!'),
            placement: 'bottom',
          },
          {
            target: '[data-tour="activity"]',
            title: t('onboarding.activityTitle', 'Spontane Activiteit'),
            content: t('onboarding.activityContent', 'Heb je buiten je schema om gesport? Log het hier om je voortgang bij te houden.'),
            placement: 'bottom',
          },
          {
            target: '[data-tour="checkin"]',
            title: t('onboarding.checkinTitle', 'Dagelijkse Check-in'),
            content: t('onboarding.checkinContent', 'Laat je coach weten hoe het met je gaat. Dit helpt bij het aanpassen van je programma.'),
            placement: 'bottom',
          },
          {
            target: '[data-tour="tasks"]',
            title: t('onboarding.tasksTitle', 'Dagelijkse Taken'),
            content: t('onboarding.tasksContent', 'Dit zijn je dagelijkse taken van je coach. Vink ze af wanneer je ze hebt voltooid.'),
            placement: 'bottom',
          },
          {
            target: '[data-tour="workouts"]',
            title: t('onboarding.workoutsTitle', 'Je Trainingsplan'),
            content: t('onboarding.workoutsContent', 'Hier vind je je workouts. Tik op een workout om te beginnen!'),
            placement: 'top',
          },
          {
            target: '[data-tour="navigation"]',
            title: t('onboarding.navigationTitle', 'Navigatie'),
            content: t('onboarding.navigationContent', 'Gebruik de navigatiebalk onderaan om door de app te navigeren.'),
            placement: 'top',
          },
        ]}
      />
      </div>
    </PullToRefresh>
  );
};

export default Home;
