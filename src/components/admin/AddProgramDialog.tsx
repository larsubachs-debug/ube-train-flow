import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, LayoutGrid, Dumbbell } from "lucide-react";

type ProgramType = "calendar" | "fixed";

interface AddProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string; type: ProgramType }) => void;
}

export const AddProgramDialog = ({ open, onOpenChange, onSubmit }: AddProgramDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProgramType>("fixed");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), type });
    setName("");
    setDescription("");
    setType("fixed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Dumbbell className="h-5 w-5" />
            Programma Toevoegen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Program Name */}
          <div className="space-y-2">
            <Label htmlFor="program-name">
              Programma Naam <span className="text-destructive">*</span>
            </Label>
            <Input
              id="program-name"
              placeholder="Bijv. Full Body Workout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Program Description */}
          <div className="space-y-2">
            <Label htmlFor="program-description">Programma Beschrijving</Label>
            <Textarea
              id="program-description"
              placeholder="Voeg extra informatie toe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Program Type */}
          <div className="space-y-3">
            <Label>
              Programma Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Calendar Type */}
              <button
                type="button"
                onClick={() => setType("calendar")}
                className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  type === "calendar"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">Kalender</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    type === "calendar" ? "border-accent" : "border-muted-foreground/30"
                  }`}>
                    {type === "calendar" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plan workouts op specifieke data. Ideaal voor leden die dagelijkse structuur nodig hebben.
                </p>
              </button>

              {/* Fixed Type */}
              <button
                type="button"
                onClick={() => setType("fixed")}
                className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  type === "fixed"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">Vast</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    type === "fixed" ? "border-accent" : "border-muted-foreground/30"
                  }`}>
                    {type === "fixed" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maak vaste programma&apos;s die leden op eigen tempo kunnen volgen, zonder data.
                </p>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Sluiten
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim()}
            className="bg-accent hover:bg-accent/90"
          >
            Programma Toevoegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
