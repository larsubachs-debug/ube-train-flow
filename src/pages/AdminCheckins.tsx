import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, startOfWeek, startOfDay, subDays, isWithinInterval } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";

type TimeFilter = "week" | "today" | "yesterday";

export default function AdminCheckins() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");

  // Get coach profile
  const { data: coachProfile } = useQuery({
    queryKey: ["coach-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get members assigned to this coach
  const { data: members = [] } = useQuery({
    queryKey: ["coach-members", coachProfile?.id],
    queryFn: async () => {
      if (!coachProfile?.id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url")
        .eq("coach_id", coachProfile.id)
        .eq("approval_status", "approved");
      if (error) throw error;
      return data || [];
    },
    enabled: !!coachProfile?.id,
  });

  // Get all check-ins for these members
  const { data: checkins = [], isLoading } = useQuery({
    queryKey: ["coach-checkins", members.map(m => m.user_id)],
    queryFn: async () => {
      if (members.length === 0) return [];
      const userIds = members.map(m => m.user_id);
      const { data, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: members.length > 0,
  });

  // Filter check-ins based on time filter
  const filteredCheckins = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    return checkins.filter((checkin) => {
      const checkinDate = new Date(checkin.created_at);
      
      switch (timeFilter) {
        case "today":
          return isWithinInterval(checkinDate, { start: todayStart, end: now });
        case "yesterday":
          return isWithinInterval(checkinDate, { start: yesterdayStart, end: todayStart });
        case "week":
        default:
          return isWithinInterval(checkinDate, { start: weekStart, end: now });
      }
    });
  }, [checkins, timeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = filteredCheckins.filter(c => !c.completed_at).length;
    const reviewed = filteredCheckins.filter(c => c.completed_at).length;
    const total = pending + reviewed;
    const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    
    return { pending, reviewed, total, percentage };
  }, [filteredCheckins]);

  // Get member info for a check-in
  const getMember = (userId: string) => {
    return members.find(m => m.user_id === userId);
  };

  // Circular progress component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-40 h-40 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold">Check Ins</h1>

        {/* Time filter tabs */}
        <div className="flex gap-4 border-b border-border">
          {(["week", "today", "yesterday"] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`pb-2 text-sm font-medium transition-colors capitalize ${
                timeFilter === filter
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {filter === "week" ? "Week" : filter === "today" ? "Today" : "Yesterday"}
            </button>
          ))}
        </div>

        {/* Progress Card */}
        <Card className="p-6 bg-muted/30">
          <CircularProgress percentage={stats.percentage} />
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">
                {stats.pending} Pending
              </span>
            </div>
            <div className="text-muted-foreground">|</div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
              <span className="text-sm text-muted-foreground">
                {stats.reviewed} Reviewed
              </span>
            </div>
          </div>
        </Card>

        {/* Check-ins list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredCheckins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No check-ins for this period
            </div>
          ) : (
            filteredCheckins.map((checkin) => {
              const member = getMember(checkin.user_id);
              const isReviewed = !!checkin.completed_at;
              
              return (
                <Card key={checkin.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member?.avatar_url || undefined} />
                        <AvatarFallback className="bg-accent/20 text-accent">
                          {member?.display_name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member?.display_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">Weekly Check-In</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(checkin.created_at), { 
                        addSuffix: true,
                        locale: nl 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-muted-foreground">Weekly Check-In</span>
                    {isReviewed ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>Reviewed</span>
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/coach/checkin/${checkin.id}`)}
                        className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                      >
                        <span>Review Now</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
