import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AIProgramGeneratorProps {
  onProgramGenerated: (programData: any) => void;
  onCancel: () => void;
}

export const AIProgramGenerator = ({ onProgramGenerated, onCancel }: AIProgramGeneratorProps) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    programName: "",
    programType: "",
    duration: "8",
    frequency: "4",
    goal: "",
    level: "intermediate",
    equipment: "",
    additionalInfo: "",
  });

  const handleGenerate = async () => {
    if (!formData.programName || !formData.goal) {
      toast({
        title: "Vul verplichte velden in",
        description: "Programma naam en doel zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const context = {
        programName: formData.programName,
        programType: formData.programType || "Algemeen fitness",
        duration: parseInt(formData.duration),
        frequency: parseInt(formData.frequency),
        goal: formData.goal,
        level: formData.level,
        equipment: formData.equipment || "Volledige gym",
        additionalInfo: formData.additionalInfo,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-program`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ type: "generate-full-program", context }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI generatie mislukt");
      }

      const data = await response.json();
      
      // Transform AI response to program builder format
      const programData = {
        name: data.program.name,
        description: data.program.description,
        icon: "Dumbbell",
        is_public: true,
        weeks: data.program.weeks.map((week: any, wIdx: number) => ({
          name: week.name,
          weekNumber: wIdx + 1,
          description: week.description,
          phase_name: week.phase_name,
          workouts: week.workouts.map((workout: any, workoutIdx: number) => ({
            id: `temp-workout-${Date.now()}-${wIdx}-${workoutIdx}`,
            name: workout.name,
            dayNumber: workout.dayNumber,
            duration: workout.duration || 60,
            exercises: workout.exercises.map((ex: any, exIdx: number) => ({
              ...ex,
              id: `temp-ex-${Date.now()}-${wIdx}-${workoutIdx}-${exIdx}`,
            })),
          })),
        })),
      };

      toast({
        title: "Programma gegenereerd! 🎉",
        description: `${data.program.weeks.length} weken met workouts zijn klaar`,
      });

      onProgramGenerated(programData);
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast({
        title: "AI generatie fout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Programma Generator
          </h2>
          <p className="text-muted-foreground">
            Laat Gemini een compleet programma voor je opstellen
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Programma Naam *</Label>
            <Input
              placeholder="bijv. Hyrox Conditioning Program"
              value={formData.programName}
              onChange={(e) =>
                setFormData({ ...formData, programName: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Programma Type</Label>
              <Input
                placeholder="bijv. Kracht, Hyrox, CrossFit"
                value={formData.programType}
                onChange={(e) =>
                  setFormData({ ...formData, programType: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Niveau</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData({ ...formData, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Gevorderd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Duur (weken)</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 weken</SelectItem>
                  <SelectItem value="6">6 weken</SelectItem>
                  <SelectItem value="8">8 weken</SelectItem>
                  <SelectItem value="12">12 weken</SelectItem>
                  <SelectItem value="16">16 weken</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frequentie (x per week)</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3x per week</SelectItem>
                  <SelectItem value="4">4x per week</SelectItem>
                  <SelectItem value="5">5x per week</SelectItem>
                  <SelectItem value="6">6x per week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Doel / Focus *</Label>
            <Textarea
              placeholder="bijv. Voorbereiding op Hyrox wedstrijd, focus op aerobe capaciteit en kracht-uithoudingsvermogen"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Beschikbare Apparatuur</Label>
            <Input
              placeholder="bijv. Barbell, dumbbells, rower, ski-erg, assault bike"
              value={formData.equipment}
              onChange={(e) =>
                setFormData({ ...formData, equipment: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Extra Informatie (optioneel)</Label>
            <Textarea
              placeholder="Specifieke wensen, beperkingen, of aanvullende details..."
              value={formData.additionalInfo}
              onChange={(e) =>
                setFormData({ ...formData, additionalInfo: e.target.value })
              }
              rows={4}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Programma wordt gegenereerd...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Genereer Compleet Programma
              </>
            )}
          </Button>

          {generating && (
            <p className="text-sm text-muted-foreground text-center">
              Dit kan 30-60 seconden duren. Even geduld... ☕
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};