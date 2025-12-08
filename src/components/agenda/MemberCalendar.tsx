import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Calendar, Dumbbell, 
  CheckSquare, Star, Check 
} from "lucide-react";
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isToday, addMonths, subMonths, 
  startOfWeek, endOfWeek, parseISO, isSameDay 
} from "date-fns";
import { nl } from "date-fns/locale";
import { useCompleteEvent, ScheduledEvent } from "@/hooks/useScheduledEvents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const eventTypeIcons = {
  workout: Dumbbell,
  task: CheckSquare,
  custom: Star,
};

const eventTypeColors = {
  workout: "bg-orange-500",
  task: "bg-blue-500",
  custom: "bg-purple-500",
};

const MemberCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const completeEvent = useCompleteEvent();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch events for the visible calendar range
  const { data: monthEvents, isLoading } = useQuery({
    queryKey: ["member-calendar-events", format(calendarStart, "yyyy-MM-dd"), format(calendarEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select("*")
        .gte("scheduled_date", format(calendarStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(calendarEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled")
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as ScheduledEvent[];
    },
    enabled: !!user,
  });

  // Group events by date
  const eventsByDate = monthEvents?.reduce((acc, event) => {
    const dateKey = event.scheduled_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, ScheduledEvent[]>) || {};

  const goPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateEvents = selectedDate 
    ? eventsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Kalender</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Vandaag
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center mb-4">
          <h4 className="font-medium capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: nl })}
          </h4>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasEvents = dayEvents.length > 0;
                const hasCompletedAll = hasEvents && dayEvents.every(e => e.status === "completed");
                const hasPending = hasEvents && dayEvents.some(e => e.status === "scheduled");

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative aspect-square p-1 rounded-lg text-sm transition-all
                      ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
                      ${isDayToday ? "bg-accent/20 font-bold" : ""}
                      ${isSelected ? "ring-2 ring-accent" : "hover:bg-muted"}
                    `}
                  >
                    <span className={isDayToday ? "text-accent" : ""}>
                      {format(day, "d")}
                    </span>
                    
                    {/* Event indicators */}
                    {hasEvents && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <span
                            key={idx}
                            className={`
                              w-1.5 h-1.5 rounded-full
                              ${event.status === "completed" 
                                ? "bg-green-500" 
                                : eventTypeColors[event.event_type]}
                            `}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Workout
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Taak
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Voltooid
              </span>
            </div>
          </>
        )}
      </Card>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedDate && format(selectedDate, "EEEE d MMMM", { locale: nl })}
            </DialogTitle>
          </DialogHeader>

          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen activiteiten op deze dag</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => {
                const Icon = eventTypeIcons[event.event_type];
                const isCompleted = event.status === "completed";

                return (
                  <Card 
                    key={event.id} 
                    className={`p-4 ${event.workout_id ? "cursor-pointer hover:shadow-md" : ""}`}
                    onClick={() => event.workout_id && navigate(`/workout/${event.workout_id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        event.event_type === "workout" ? "bg-orange-500/10 text-orange-600" :
                        event.event_type === "task" ? "bg-blue-500/10 text-blue-600" :
                        "bg-purple-500/10 text-purple-600"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {event.title}
                          </h4>
                          {isCompleted && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                              Voltooid
                            </Badge>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {event.scheduled_time && (
                            <span>{event.scheduled_time.slice(0, 5)}</span>
                          )}
                          {event.duration_minutes && (
                            <span>{event.duration_minutes} min</span>
                          )}
                        </div>
                      </div>

                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            completeEvent.mutate(event.id);
                          }}
                          disabled={completeEvent.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Klaar
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberCalendar;
