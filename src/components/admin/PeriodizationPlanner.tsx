import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Trash2, Dumbbell, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Phase {
  id: string;
  name: string;
  type: "accumulation" | "intensification" | "realization" | "deload" | "peak";
  weeks: number;
  color: string;
  intensity: "low" | "medium" | "high" | "max";
  volume: "low" | "medium" | "high";
}

interface PeriodizationPlan {
  id: string;
  name: string;
  phases: Phase[];
  total_weeks: number;
}

const PHASE_TYPES = [
  { value: "accumulation", label: "Accumulatie", color: "bg-blue-500", description: "Volume opbouwen" },
  { value: "intensification", label: "Intensificatie", color: "bg-orange-500", description: "Intensiteit verhogen" },
  { value: "realization", label: "Realisatie", color: "bg-green-500", description: "Peak prestatie" },
  { value: "deload", label: "Deload", color: "bg-gray-400", description: "Herstel week" },
  { value: "peak", label: "Peak", color: "bg-purple-500", description: "Competitie/test" },
];

const DEFAULT_PHASES: Phase[] = [
  { id: "1", name: "Hypertrofie", type: "accumulation", weeks: 4, color: "bg-blue-500", intensity: "medium", volume: "high" },
  { id: "2", name: "Kracht", type: "intensification", weeks: 4, color: "bg-orange-500", intensity: "high", volume: "medium" },
  { id: "3", name: "Deload", type: "deload", weeks: 1, color: "bg-gray-400", intensity: "low", volume: "low" },
  { id: "4", name: "Peak", type: "realization", weeks: 2, color: "bg-green-500", intensity: "max", volume: "low" },
];

export const PeriodizationPlanner = () => {
  const { user } = useAuth();
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPhase, setNewPhase] = useState<Partial<Phase>>({
    name: "",
    type: "accumulation",
    weeks: 4,
    intensity: "medium",
    volume: "medium",
  });

  const totalWeeks = phases.reduce((sum, phase) => sum + phase.weeks, 0);

  const handleAddPhase = () => {
    if (!newPhase.name) return;

    const phaseType = PHASE_TYPES.find((t) => t.value === newPhase.type);
    const phase: Phase = {
      id: Date.now().toString(),
      name: newPhase.name,
      type: newPhase.type as Phase["type"],
      weeks: newPhase.weeks || 4,
      color: phaseType?.color || "bg-gray-500",
      intensity: newPhase.intensity as Phase["intensity"],
      volume: newPhase.volume as Phase["volume"],
    };

    setPhases([...phases, phase]);
    setShowAddDialog(false);
    setNewPhase({
      name: "",
      type: "accumulation",
      weeks: 4,
      intensity: "medium",
      volume: "medium",
    });
    toast.success("Fase toegevoegd");
  };

  const handleRemovePhase = (id: string) => {
    setPhases(phases.filter((p) => p.id !== id));
  };

  const getIntensityBars = (intensity: Phase["intensity"]) => {
    const levels = { low: 1, medium: 2, high: 3, max: 4 };
    const level = levels[intensity];
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm ${
              i <= level ? "bg-red-500" : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const getVolumeBars = (volume: Phase["volume"]) => {
    const levels = { low: 1, medium: 2, high: 3 };
    const level = levels[volume];
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm ${
              i <= level ? "bg-blue-500" : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Periodisering
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalWeeks} weken totaal
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Fase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Fase</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input
                  placeholder="Bijv. Hypertrofie Blok"
                  value={newPhase.name}
                  onChange={(e) =>
                    setNewPhase({ ...newPhase, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newPhase.type}
                    onValueChange={(value) =>
                      setNewPhase({ ...newPhase, type: value as Phase["type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weken</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={newPhase.weeks}
                    onChange={(e) =>
                      setNewPhase({ ...newPhase, weeks: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intensiteit</Label>
                  <Select
                    value={newPhase.intensity}
                    onValueChange={(value) =>
                      setNewPhase({ ...newPhase, intensity: value as Phase["intensity"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Laag</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hoog</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Volume</Label>
                  <Select
                    value={newPhase.volume}
                    onValueChange={(value) =>
                      setNewPhase({ ...newPhase, volume: value as Phase["volume"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Laag</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hoog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddPhase} className="w-full">
                Toevoegen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visual Timeline */}
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-1 min-w-max">
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className="relative group"
              style={{ width: `${phase.weeks * 40}px`, minWidth: "80px" }}
            >
              {/* Phase Block */}
              <div
                className={`${phase.color} rounded-lg p-2 h-24 flex flex-col justify-between relative overflow-hidden`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-white text-xs font-medium truncate">
                    {phase.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-5 h-5 opacity-0 group-hover:opacity-100 text-white hover:bg-white/20"
                    onClick={() => handleRemovePhase(phase.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-white/80 text-xs">
                  {phase.weeks}w
                </div>
                {/* Intensity/Volume indicators */}
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-white/70" />
                    {getIntensityBars(phase.intensity)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="w-3 h-3 text-white/70" />
                    {getVolumeBars(phase.volume)}
                  </div>
                </div>
              </div>
              {/* Week markers */}
              <div className="flex mt-1">
                {Array.from({ length: phase.weeks }).map((_, weekIndex) => {
                  const weekNumber = phases
                    .slice(0, index)
                    .reduce((sum, p) => sum + p.weeks, 0) + weekIndex + 1;
                  return (
                    <div
                      key={weekIndex}
                      className="flex-1 text-center text-[10px] text-muted-foreground"
                    >
                      W{weekNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
        {PHASE_TYPES.map((type) => (
          <Badge key={type.value} variant="outline" className="text-xs">
            <div className={`w-2 h-2 rounded-full ${type.color} mr-1`} />
            {type.label}
          </Badge>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <span className="text-muted-foreground">Intensiteit</span>
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-blue-500" />
          <span className="text-muted-foreground">Volume</span>
        </div>
      </div>
    </Card>
  );
};
