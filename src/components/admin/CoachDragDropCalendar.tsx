import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, CheckSquare, Star, GripVertical } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isToday, isSameMonth, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

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

interface ScheduledEvent {
  id: string;
  title: string;
  event_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  member: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface DraggableEventProps {
  event: ScheduledEvent;
  isDragging?: boolean;
}

const DraggableEvent = ({ event, isDragging }: DraggableEventProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: event,
  });

  const Icon = eventTypeIcons[event.event_type as keyof typeof eventTypeIcons] || Star;
  const colorClass = eventTypeColors[event.event_type as keyof typeof eventTypeColors] || eventTypeColors.custom;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 p-1.5 rounded text-xs bg-card border cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
      <Avatar className="h-5 w-5">
        <AvatarImage src={event.member?.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">
          {event.member?.display_name?.[0]?.toUpperCase() || "M"}
        </AvatarFallback>
      </Avatar>
      <span className="truncate flex-1">{event.title}</span>
      <Icon className={`h-3 w-3 shrink-0 ${colorClass.includes("orange") ? "text-orange-600" : colorClass.includes("blue") ? "text-blue-600" : "text-purple-600"}`} />
    </div>
  );
};

interface DroppableDayProps {
  date: Date;
  events: ScheduledEvent[];
  isCurrentMonth: boolean;
  activeId: string | null;
}

const DroppableDay = ({ date, events, isCurrentMonth, activeId }: DroppableDayProps) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
  });

  const isDayToday = isToday(date);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-1 border-r border-b transition-colors ${
        isOver ? "bg-accent/20" : ""
      } ${!isCurrentMonth ? "bg-muted/30" : ""} ${isDayToday ? "bg-accent/10" : ""}`}
    >
      <div className={`text-xs font-medium mb-1 ${
        isDayToday ? "text-accent" : !isCurrentMonth ? "text-muted-foreground/50" : "text-muted-foreground"
      }`}>
        {format(date, "d")}
      </div>
      <div className="space-y-1">
        {events.map((event) => (
          <DraggableEvent 
            key={event.id} 
            event={event} 
            isDragging={activeId === event.id}
          />
        ))}
      </div>
    </div>
  );
};

const CoachDragDropCalendar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<ScheduledEvent | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // Fetch all scheduled events for this month view
  const { data: monthEvents, isLoading } = useQuery({
    queryKey: ["coach-calendar-events", format(calendarStart, "yyyy-MM-dd"), format(calendarEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select(`
          id,
          title,
          event_type,
          scheduled_date,
          scheduled_time,
          status,
          member:profiles!scheduled_events_member_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .gte("scheduled_date", format(calendarStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(calendarEnd, "yyyy-MM-dd"))
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as unknown as ScheduledEvent[];
    },
    enabled: !!user,
  });

  // Update event date mutation
  const updateEventDate = useMutation({
    mutationFn: async ({ eventId, newDate }: { eventId: string; newDate: string }) => {
      const { error } = await supabase
        .from("scheduled_events")
        .update({ scheduled_date: newDate, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["coach-week-events"] });
      toast.success("Activiteit verplaatst");
    },
    onError: () => {
      toast.error("Kon activiteit niet verplaatsen");
    },
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveEvent(event.active.data.current as ScheduledEvent);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveEvent(null);

    if (!over) return;

    const eventId = active.id as string;
    const newDate = over.id as string;
    const currentEvent = monthEvents?.find(e => e.id === eventId);
    
    if (currentEvent && currentEvent.scheduled_date !== newDate) {
      updateEventDate.mutate({ eventId, newDate });
    }
  }, [monthEvents, updateEventDate]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToThisMonth = () => setCurrentMonth(new Date());

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: nl })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToThisMonth}>
            Vandaag
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Sleep activiteiten naar een andere dag om ze te verplaatsen
      </p>

      {isLoading ? (
        <Skeleton className="h-[500px] w-full" />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="border-l border-t rounded-lg overflow-hidden">
            {/* Week day headers */}
            <div className="grid grid-cols-7">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-medium text-muted-foreground bg-muted/50 border-r border-b"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <DroppableDay
                    key={dateKey}
                    date={day}
                    events={dayEvents}
                    isCurrentMonth={isCurrentMonth}
                    activeId={activeId}
                  />
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeEvent ? (
              <div className="flex items-center gap-1 p-1.5 rounded text-xs bg-card border shadow-lg">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={activeEvent.member?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {activeEvent.member?.display_name?.[0]?.toUpperCase() || "M"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{activeEvent.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Dumbbell className="h-3 w-3 text-orange-600" />
          <span>Workout</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckSquare className="h-3 w-3 text-blue-600" />
          <span>Taak</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-purple-600" />
          <span>Anders</span>
        </div>
      </div>
    </Card>
  );
};

export default CoachDragDropCalendar;
