import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, CheckSquare, Star, Clock, User } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const eventTypeIcons = {
  workout: Dumbbell,
  task: CheckSquare,
  custom: Star,
};

const eventTypeColors = {
  workout: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  task: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  custom: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const statusColors = {
  scheduled: "border-l-blue-500",
  completed: "border-l-green-500",
  cancelled: "border-l-gray-400",
  missed: "border-l-red-500",
};

const CoachWeeklyOverview = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch coach's profile ID
  const { data: coachProfile } = useQuery({
    queryKey: ["coach-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all members' scheduled events for this week
  const { data: weekEvents, isLoading } = useQuery({
    queryKey: ["coach-week-events", format(weekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select(`
          *,
          member:member_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .gte("scheduled_date", format(weekStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(weekEnd, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Group events by date
  const eventsByDate = weekEvents?.reduce((acc, event) => {
    const dateKey = event.scheduled_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof weekEvents>) || {};

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToThisWeek = () => setCurrentWeek(new Date());

  const totalEvents = weekEvents?.length || 0;
  const completedEvents = weekEvents?.filter(e => e.status === "completed").length || 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Week Overzicht</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToThisWeek}>
            Vandaag
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week header */}
      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>
          {format(weekStart, "d MMM", { locale: nl })} - {format(weekEnd, "d MMM yyyy", { locale: nl })}
        </span>
        <div className="flex gap-4">
          <span>{totalEvents} activiteiten</span>
          <span className="text-green-600">{completedEvents} voltooid</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateKey] || [];
            const isDayToday = isToday(day);

            return (
              <div key={dateKey} className={`${isDayToday ? "bg-accent/5 rounded-lg p-3 -mx-3" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-medium capitalize ${isDayToday ? "text-accent" : "text-muted-foreground"}`}>
                    {format(day, "EEEE", { locale: nl })}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(day, "d MMM", { locale: nl })}
                  </span>
                  {isDayToday && (
                    <Badge variant="secondary" className="text-xs">Vandaag</Badge>
                  )}
                  {dayEvents.length > 0 && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      {dayEvents.length} {dayEvents.length === 1 ? "activiteit" : "activiteiten"}
                    </Badge>
                  )}
                </div>

                {dayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-2">Geen activiteiten</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((event: any) => {
                      const Icon = eventTypeIcons[event.event_type as keyof typeof eventTypeIcons];
                      const colorClass = eventTypeColors[event.event_type as keyof typeof eventTypeColors];
                      const statusClass = statusColors[event.status as keyof typeof statusColors];

                      return (
                        <div
                          key={event.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-l-4 bg-card ${statusClass}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={event.member?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {event.member?.display_name?.[0]?.toUpperCase() || "M"}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {event.member?.display_name || "Member"}
                              </span>
                              <Badge variant="outline" className={`text-xs ${colorClass}`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {event.event_type === "workout" ? "Workout" : event.event_type === "task" ? "Taak" : "Anders"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {event.title}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            {event.scheduled_time && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.scheduled_time.slice(0, 5)}
                              </span>
                            )}
                            <Badge 
                              variant="secondary" 
                              className={`text-xs mt-1 ${
                                event.status === "completed" ? "bg-green-500/10 text-green-600" :
                                event.status === "cancelled" ? "bg-gray-500/10 text-gray-600" :
                                event.status === "missed" ? "bg-red-500/10 text-red-600" :
                                ""
                              }`}
                            >
                              {event.status === "completed" ? "Voltooid" :
                               event.status === "cancelled" ? "Geannuleerd" :
                               event.status === "missed" ? "Gemist" : "Gepland"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default CoachWeeklyOverview;
