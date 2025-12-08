import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpcomingEvents, useCompleteEvent, ScheduledEvent } from "@/hooks/useScheduledEvents";
import { Calendar, Clock, Dumbbell, CheckSquare, Star, Check, ChevronRight } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const eventTypeIcons = {
  workout: Dumbbell,
  task: CheckSquare,
  custom: Star,
};

const eventTypeColors = {
  workout: "bg-orange-500/10 text-orange-600",
  task: "bg-blue-500/10 text-blue-600",
  custom: "bg-purple-500/10 text-purple-600",
};

const formatEventDate = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Vandaag";
  if (isTomorrow(date)) return "Morgen";
  return format(date, "EEEE d MMMM", { locale: nl });
};

interface EventCardProps {
  event: ScheduledEvent;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}

const EventCard = ({ event, onComplete, isCompleting }: EventCardProps) => {
  const navigate = useNavigate();
  const Icon = eventTypeIcons[event.event_type];
  const colorClass = eventTypeColors[event.event_type];
  const isCompleted = event.status === "completed";

  const handleClick = () => {
    if (event.workout_id) {
      navigate(`/workout/${event.workout_id}`);
    }
  };

  return (
    <Card 
      className={`p-4 transition-all ${isCompleted ? "opacity-60" : "hover:shadow-md"} ${event.workout_id ? "cursor-pointer" : ""}`}
      onClick={event.workout_id ? handleClick : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${isCompleted ? "line-through" : ""}`}>
              {event.title}
            </h4>
            {isCompleted && (
              <Badge variant="secondary" className="text-xs">Voltooid</Badge>
            )}
          </div>
          
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {event.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {event.scheduled_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.scheduled_time.slice(0, 5)}
              </span>
            )}
            {event.duration_minutes && (
              <span>{event.duration_minutes} min</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(event.id);
              }}
              disabled={isCompleting}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {event.workout_id && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </Card>
  );
};

const MemberAgenda = () => {
  const { data: events, isLoading } = useUpcomingEvents();
  const completeEvent = useCompleteEvent();

  // Group events by date
  const groupedEvents = events?.reduce((acc, event) => {
    const dateKey = event.scheduled_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, ScheduledEvent[]>) || {};

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-accent" />
          <h3 className="font-semibold">Jouw Agenda</h3>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  const hasEvents = events && events.length > 0;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">Jouw Agenda</h3>
      </div>

      {!hasEvents ? (
        <div className="text-center py-6 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Geen geplande activiteiten</p>
          <p className="text-xs">Je coach kan hier workouts en taken voor je inplannen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {formatEventDate(date)}
              </h4>
              <div className="space-y-2">
                {dateEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onComplete={(id) => completeEvent.mutate(id)}
                    isCompleting={completeEvent.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MemberAgenda;
