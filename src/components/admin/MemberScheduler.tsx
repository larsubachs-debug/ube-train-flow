import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreateScheduledEvent, useScheduledEvents, useDeleteScheduledEvent, ScheduledEvent } from "@/hooks/useScheduledEvents";
import { usePrograms } from "@/hooks/usePrograms";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Plus, Trash2, Dumbbell, CheckSquare, Star, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MemberSchedulerProps {
  memberId: string;
  memberName: string;
}

const eventTypeIcons = {
  workout: Dumbbell,
  task: CheckSquare,
  custom: Star,
};

const statusColors = {
  scheduled: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-gray-500/10 text-gray-600",
  missed: "bg-red-500/10 text-red-600",
};

const MemberScheduler = ({ memberId, memberName }: MemberSchedulerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [eventType, setEventType] = useState<"workout" | "task" | "custom">("workout");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");

  const { data: events, isLoading } = useScheduledEvents(memberId);
  const { data: programs } = usePrograms();
  const createEvent = useCreateScheduledEvent();
  const deleteEvent = useDeleteScheduledEvent();

  // Get coach profile id
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

  // Flatten all workouts from all programs
  const allWorkouts = programs?.flatMap((program) =>
    program.weeks.flatMap((week) =>
      week.workouts.map((workout) => ({
        id: workout.id,
        name: `${program.name} - Week ${week.weekNumber} - ${workout.name}`,
        duration: workout.duration,
      }))
    )
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedWorkout = allWorkouts.find((w) => w.id === selectedWorkoutId);
    
    // For workout type with selected workout, title is auto-filled, otherwise title is required
    const hasValidTitle = title || (eventType === "workout" && selectedWorkout);
    
    if (!date || !hasValidTitle || !coachProfile) return;

    await createEvent.mutateAsync({
      member_id: memberId,
      coach_id: coachProfile.id,
      event_type: eventType,
      title: eventType === "workout" && selectedWorkout ? selectedWorkout.name : title,
      description: description || null,
      scheduled_date: format(date, "yyyy-MM-dd"),
      scheduled_time: time || null,
      duration_minutes: duration ? parseInt(duration) : (selectedWorkout?.duration || null),
      workout_id: eventType === "workout" ? selectedWorkoutId || null : null,
      task_id: null,
      status: "scheduled",
      notes: null,
    });

    // Reset form
    setIsOpen(false);
    setDate(undefined);
    setTitle("");
    setDescription("");
    setTime("");
    setDuration("");
    setSelectedWorkoutId("");
    setEventType("workout");
  };

  const upcomingEvents = events?.filter((e) => e.status === "scheduled") || [];
  const pastEvents = events?.filter((e) => e.status !== "scheduled") || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Agenda voor {memberName}</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Inplannen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nieuwe activiteit inplannen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="task">Taak</SelectItem>
                    <SelectItem value="custom">Anders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {eventType === "workout" && (
                <div className="space-y-2">
                  <Label>Selecteer Workout (optioneel)</Label>
                  <Select value={selectedWorkoutId} onValueChange={setSelectedWorkoutId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kies een workout..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allWorkouts.map((workout) => (
                        <SelectItem key={workout.id} value={workout.id}>
                          {workout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Titel {eventType === "workout" && selectedWorkoutId ? "(automatisch)" : "*"}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={eventType === "workout" ? "Of vul zelf een titel in" : "Titel van de activiteit"}
                  required={!selectedWorkoutId}
                  disabled={eventType === "workout" && !!selectedWorkoutId}
                />
              </div>

              <div className="space-y-2">
                <Label>Datum *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: nl }) : "Selecteer datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      locale={nl}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tijd (optioneel)</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duur (min)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beschrijving (optioneel)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Extra informatie..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createEvent.isPending || !date}>
                {createEvent.isPending ? "Bezig..." : "Inplannen"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">Laden...</div>
      ) : (
        <div className="space-y-4">
          {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nog geen activiteiten ingepland</p>
            </div>
          ) : (
            <>
              {upcomingEvents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Gepland</h4>
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => {
                      const Icon = eventTypeIcons[event.event_type];
                      return (
                        <Card key={event.id} className="p-3">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{format(parseISO(event.scheduled_date), "d MMM", { locale: nl })}</span>
                                {event.scheduled_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.scheduled_time.slice(0, 5)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => deleteEvent.mutate(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Afgelopen</h4>
                  <div className="space-y-2">
                    {pastEvents.slice(0, 5).map((event) => {
                      const Icon = eventTypeIcons[event.event_type];
                      return (
                        <Card key={event.id} className="p-3 opacity-60">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(event.scheduled_date), "d MMM", { locale: nl })}
                              </span>
                            </div>
                            <Badge variant="secondary" className={cn("text-xs", statusColors[event.status])}>
                              {event.status === "completed" ? "Voltooid" : event.status === "cancelled" ? "Geannuleerd" : "Gemist"}
                            </Badge>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberScheduler;
