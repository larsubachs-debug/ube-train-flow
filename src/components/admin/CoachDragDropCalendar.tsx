import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ChevronLeft, ChevronRight, Calendar, Dumbbell, CheckSquare, Star, 
  GripVertical, Filter, X, Plus, Trash2, Edit2, Clock, Users, 
  Download, Repeat, Check
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isToday, isSameMonth, parseISO, addWeeks } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  description: string | null;
  event_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
  member_id: string;
  member: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface DraggableEventProps {
  event: ScheduledEvent;
  isDragging?: boolean;
  onClick: () => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
}

const DraggableEvent = ({ event, isDragging, onClick, isSelected, onSelect, selectionMode }: DraggableEventProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: event,
    disabled: selectionMode,
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
      className={`flex items-center gap-1 p-1.5 rounded text-xs bg-card border transition-all ${
        isDragging ? "opacity-50" : ""
      } ${selectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} ${
        isSelected ? "ring-2 ring-accent bg-accent/10" : "hover:bg-accent/10"
      }`}
      onClick={(e) => {
        if (!transform) {
          e.stopPropagation();
          if (selectionMode && onSelect) {
            onSelect(event.id, !isSelected);
          } else {
            onClick();
          }
        }
      }}
      {...(selectionMode ? {} : { ...attributes, ...listeners })}
    >
      {selectionMode && (
        <Checkbox 
          checked={isSelected} 
          className="h-3 w-3"
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(checked) => onSelect?.(event.id, !!checked)}
        />
      )}
      {!selectionMode && <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />}
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
  onDayClick: (date: Date) => void;
  onEventClick: (event: ScheduledEvent) => void;
  selectedIds: string[];
  onSelectEvent: (id: string, selected: boolean) => void;
  selectionMode: boolean;
}

const DroppableDay = ({ 
  date, events, isCurrentMonth, activeId, onDayClick, onEventClick, 
  selectedIds, onSelectEvent, selectionMode 
}: DroppableDayProps) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
  });

  const isDayToday = isToday(date);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-1 border-r border-b transition-colors cursor-pointer hover:bg-accent/5 ${
        isOver ? "bg-accent/20" : ""
      } ${!isCurrentMonth ? "bg-muted/30" : ""} ${isDayToday ? "bg-accent/10" : ""}`}
      onClick={() => !selectionMode && onDayClick(date)}
    >
      <div className={`flex items-center justify-between text-xs font-medium mb-1 ${
        isDayToday ? "text-accent" : !isCurrentMonth ? "text-muted-foreground/50" : "text-muted-foreground"
      }`}>
        <span>{format(date, "d")}</span>
        {!selectionMode && <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
        {events.map((event) => (
          <DraggableEvent 
            key={event.id} 
            event={event} 
            isDragging={activeId === event.id}
            onClick={() => onEventClick(event)}
            isSelected={selectedIds.includes(event.id)}
            onSelect={onSelectEvent}
            selectionMode={selectionMode}
          />
        ))}
      </div>
    </div>
  );
};

// Generate iCal content
const generateICalEvent = (event: ScheduledEvent): string => {
  const startDate = event.scheduled_date.replace(/-/g, '');
  let startDateTime = startDate;
  let endDateTime = startDate;
  
  if (event.scheduled_time) {
    const time = event.scheduled_time.replace(/:/g, '').slice(0, 4) + '00';
    startDateTime = `${startDate}T${time}`;
    
    if (event.duration_minutes) {
      const startHour = parseInt(event.scheduled_time.slice(0, 2));
      const startMin = parseInt(event.scheduled_time.slice(3, 5));
      const totalMinutes = startHour * 60 + startMin + event.duration_minutes;
      const endHour = Math.floor(totalMinutes / 60) % 24;
      const endMin = totalMinutes % 60;
      endDateTime = `${startDate}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`;
    } else {
      endDateTime = startDateTime;
    }
  }
  
  const uid = `${event.id}@ubeheath.app`;
  const summary = event.title;
  const description = event.description || '';
  
  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${summary}
DESCRIPTION:${description}
END:VEVENT`;
};

const generateICalFile = (events: ScheduledEvent[]): string => {
  const header = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UBE Health//Coach Calendar//NL
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:UBE Health Agenda`;

  const footer = `END:VCALENDAR`;
  
  const eventStrings = events.map(generateICalEvent).join('\n');
  
  return `${header}\n${eventStrings}\n${footer}`;
};

const CoachDragDropCalendar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<ScheduledEvent | null>(null);
  
  // Filters
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection mode for bulk delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  // Dialogs
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formEventType, setFormEventType] = useState<string>("workout");
  const [formMemberId, setFormMemberId] = useState<string>("");
  
  // Recurring event options
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState("4");

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

  // Fetch coach profile
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

  // Fetch all members for filter
  const { data: members } = useQuery({
    queryKey: ["all-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("approval_status", "approved")
        .order("display_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all scheduled events for this month view
  const { data: monthEvents, isLoading } = useQuery({
    queryKey: ["coach-calendar-events", format(calendarStart, "yyyy-MM-dd"), format(calendarEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select(`
          id,
          title,
          description,
          event_type,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          status,
          notes,
          member_id,
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

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!monthEvents) return [];
    return monthEvents.filter((event) => {
      const matchesMember = memberFilter === "all" || event.member_id === memberFilter;
      const matchesType = typeFilter === "all" || event.event_type === typeFilter;
      return matchesMember && matchesType;
    });
  }, [monthEvents, memberFilter, typeFilter]);

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

  // Update event mutation
  const updateEvent = useMutation({
    mutationFn: async (updates: Partial<ScheduledEvent> & { id: string }) => {
      const { error } = await supabase
        .from("scheduled_events")
        .update({
          title: updates.title,
          description: updates.description,
          scheduled_time: updates.scheduled_time,
          duration_minutes: updates.duration_minutes,
          event_type: updates.event_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", updates.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["coach-week-events"] });
      toast.success("Activiteit bijgewerkt");
      setIsDetailOpen(false);
      setIsEditMode(false);
    },
    onError: () => {
      toast.error("Kon activiteit niet bijwerken");
    },
  });

  // Delete event mutation
  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("scheduled_events")
        .delete()
        .eq("id", eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["coach-week-events"] });
      toast.success("Activiteit verwijderd");
      setIsDeleteOpen(false);
      setIsDetailOpen(false);
    },
    onError: () => {
      toast.error("Kon activiteit niet verwijderen");
    },
  });

  // Bulk delete mutation
  const bulkDeleteEvents = useMutation({
    mutationFn: async (eventIds: string[]) => {
      const { error } = await supabase
        .from("scheduled_events")
        .delete()
        .in("id", eventIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["coach-week-events"] });
      toast.success(`${selectedIds.length} activiteiten verwijderd`);
      setIsBulkDeleteOpen(false);
      setSelectedIds([]);
      setSelectionMode(false);
    },
    onError: () => {
      toast.error("Kon activiteiten niet verwijderen");
    },
  });

  // Create event mutation (with recurring support)
  const createEvent = useMutation({
    mutationFn: async (event: {
      member_id: string;
      coach_id: string;
      title: string;
      description: string | null;
      event_type: string;
      scheduled_date: string;
      scheduled_time: string | null;
      duration_minutes: number | null;
      recurring: boolean;
      recurringWeeks: number;
    }) => {
      const events = [];
      const baseDate = parseISO(event.scheduled_date);
      
      if (event.recurring && event.recurringWeeks > 1) {
        for (let i = 0; i < event.recurringWeeks; i++) {
          const eventDate = addWeeks(baseDate, i);
          events.push({
            member_id: event.member_id,
            coach_id: event.coach_id,
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            scheduled_date: format(eventDate, "yyyy-MM-dd"),
            scheduled_time: event.scheduled_time,
            duration_minutes: event.duration_minutes,
            status: "scheduled",
          });
        }
      } else {
        events.push({
          member_id: event.member_id,
          coach_id: event.coach_id,
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          scheduled_date: event.scheduled_date,
          scheduled_time: event.scheduled_time,
          duration_minutes: event.duration_minutes,
          status: "scheduled",
        });
      }
      
      const { error } = await supabase
        .from("scheduled_events")
        .insert(events);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["coach-week-events"] });
      const message = isRecurring 
        ? `${parseInt(recurringWeeks)} activiteiten aangemaakt` 
        : "Activiteit aangemaakt";
      toast.success(message);
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: () => {
      toast.error("Kon activiteit niet aanmaken");
    },
  });

  // Group events by date
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const dateKey = event.scheduled_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, ScheduledEvent[]>);

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

  const handleEventClick = (event: ScheduledEvent) => {
    if (selectionMode) return;
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    setFormTime(event.scheduled_time?.slice(0, 5) || "");
    setFormDuration(event.duration_minutes?.toString() || "");
    setFormEventType(event.event_type);
    setIsEditMode(false);
    setIsDetailOpen(true);
  };

  const handleDayClick = (date: Date) => {
    if (selectionMode) return;
    setCreateDate(date);
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const handleSelectEvent = (id: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  const resetCreateForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormTime("");
    setFormDuration("");
    setFormEventType("workout");
    setFormMemberId("");
    setIsRecurring(false);
    setRecurringWeeks("4");
  };

  const handleSaveEdit = () => {
    if (!selectedEvent) return;
    updateEvent.mutate({
      id: selectedEvent.id,
      title: formTitle,
      description: formDescription || null,
      scheduled_time: formTime || null,
      duration_minutes: formDuration ? parseInt(formDuration) : null,
      event_type: formEventType,
    });
  };

  const handleCreateEvent = () => {
    if (!createDate || !coachProfile || !formMemberId || !formTitle) return;
    createEvent.mutate({
      member_id: formMemberId,
      coach_id: coachProfile.id,
      title: formTitle,
      description: formDescription || null,
      event_type: formEventType,
      scheduled_date: format(createDate, "yyyy-MM-dd"),
      scheduled_time: formTime || null,
      duration_minutes: formDuration ? parseInt(formDuration) : null,
      recurring: isRecurring,
      recurringWeeks: parseInt(recurringWeeks),
    });
  };

  const handleExportCalendar = () => {
    if (!filteredEvents.length) {
      toast.error("Geen activiteiten om te exporteren");
      return;
    }
    
    const icalContent = generateICalFile(filteredEvents);
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ube-agenda-${format(currentMonth, "yyyy-MM")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Agenda geëxporteerd als .ics bestand");
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToThisMonth = () => setCurrentMonth(new Date());

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  const activeFiltersCount = (memberFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: nl })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCalendar}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporteer</span>
            </Button>
            <Button 
              variant={selectionMode ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedIds([]);
              }}
              className="gap-2"
            >
              {selectionMode ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              <span className="hidden sm:inline">{selectionMode ? "Annuleren" : "Selecteren"}</span>
            </Button>
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
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

        {/* Bulk delete bar */}
        {selectionMode && selectedIds.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.length} activiteit{selectedIds.length !== 1 ? "en" : ""} geselecteerd
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIds([])}
              >
                Deselecteren
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsBulkDeleteOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Verwijderen
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={memberFilter} onValueChange={setMemberFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alle members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle members</SelectItem>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name || "Naamloos"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Alle types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="workout">Workout</SelectItem>
                  <SelectItem value="task">Taak</SelectItem>
                  <SelectItem value="custom">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setMemberFilter("all"); setTypeFilter("all"); }}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          {selectionMode 
            ? "Klik op activiteiten om ze te selecteren voor bulk verwijderen"
            : "Klik op een dag om toe te voegen • Sleep om te verplaatsen • Klik voor details"
          }
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
                      onDayClick={handleDayClick}
                      onEventClick={handleEventClick}
                      selectedIds={selectedIds}
                      onSelectEvent={handleSelectEvent}
                      selectionMode={selectionMode}
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

      {/* Event Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (
                <>
                  {(() => {
                    const Icon = eventTypeIcons[selectedEvent.event_type as keyof typeof eventTypeIcons] || Star;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {isEditMode ? "Activiteit bewerken" : selectedEvent.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && !isEditMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedEvent.member?.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedEvent.member?.display_name?.[0]?.toUpperCase() || "M"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedEvent.member?.display_name || "Member"}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(selectedEvent.scheduled_date), "EEEE d MMMM yyyy", { locale: nl })}
                  </p>
                </div>
              </div>

              {selectedEvent.scheduled_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.scheduled_time.slice(0, 5)}</span>
                  {selectedEvent.duration_minutes && (
                    <span className="text-muted-foreground">({selectedEvent.duration_minutes} min)</span>
                  )}
                </div>
              )}

              {selectedEvent.description && (
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
              )}

              <Badge className={eventTypeColors[selectedEvent.event_type as keyof typeof eventTypeColors]}>
                {selectedEvent.event_type === "workout" ? "Workout" : selectedEvent.event_type === "task" ? "Taak" : "Anders"}
              </Badge>
            </div>
          )}

          {selectedEvent && isEditMode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formEventType} onValueChange={setFormEventType}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tijd</Label>
                  <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Duur (min)</Label>
                  <Input 
                    type="number" 
                    value={formDuration} 
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Textarea 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {!isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(true)} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Bewerken
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Verwijderen
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateEvent.isPending}>
                  {updateEvent.isPending ? "Opslaan..." : "Opslaan"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activiteit verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je "{selectedEvent?.title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedEvent && deleteEvent.mutate(selectedEvent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activiteiten verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je {selectedIds.length} activiteit{selectedIds.length !== 1 ? "en" : ""} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => bulkDeleteEvents.mutate(selectedIds)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteEvents.isPending ? "Verwijderen..." : `${selectedIds.length} verwijderen`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Event Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nieuwe activiteit op {createDate && format(createDate, "d MMMM", { locale: nl })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Member *</Label>
              <Select value={formMemberId} onValueChange={setFormMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een member..." />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name || "Naamloos"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input 
                value={formTitle} 
                onChange={(e) => setFormTitle(e.target.value)} 
                placeholder="Titel van de activiteit"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formEventType} onValueChange={setFormEventType}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tijd</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duur (min)</Label>
                <Input 
                  type="number" 
                  value={formDuration} 
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschrijving</Label>
              <Textarea 
                value={formDescription} 
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Extra informatie..."
                rows={2}
              />
            </div>

            {/* Recurring option */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Wekelijks herhalen</p>
                  <p className="text-xs text-muted-foreground">Maak deze activiteit voor meerdere weken</p>
                </div>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <Label>Aantal weken</Label>
                <Select value={recurringWeeks} onValueChange={setRecurringWeeks}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 weken</SelectItem>
                    <SelectItem value="4">4 weken</SelectItem>
                    <SelectItem value="6">6 weken</SelectItem>
                    <SelectItem value="8">8 weken</SelectItem>
                    <SelectItem value="12">12 weken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateEvent} 
              disabled={createEvent.isPending || !formMemberId || !formTitle}
            >
              {createEvent.isPending 
                ? "Aanmaken..." 
                : isRecurring 
                  ? `${recurringWeeks}x Aanmaken`
                  : "Aanmaken"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoachDragDropCalendar;
