import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Apple, Save, Trash2, Plus } from "lucide-react";

interface NutritionGoalsAssignmentProps {
  memberId: string;
  memberUserId: string;
}

interface NutritionGoal {
  id: string;
  user_id: string;
  calories_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  notes: string | null;
  is_active: boolean;
}

export const NutritionGoalsAssignment = ({ 
  memberId, 
  memberUserId 
}: NutritionGoalsAssignmentProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    calories_target: "",
    protein_target: "",
    carbs_target: "",
    fat_target: "",
    notes: "",
  });

  // Fetch current nutrition goals
  const { data: currentGoal, isLoading } = useQuery({
    queryKey: ["nutrition-goals", memberUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", memberUserId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setFormData({
          calories_target: data.calories_target?.toString() || "",
          protein_target: data.protein_target?.toString() || "",
          carbs_target: data.carbs_target?.toString() || "",
          fat_target: data.fat_target?.toString() || "",
          notes: data.notes || "",
        });
      }
      
      return data as NutritionGoal | null;
    },
  });

  // Save/update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const goalData = {
        user_id: memberUserId,
        calories_target: formData.calories_target ? parseInt(formData.calories_target) : null,
        protein_target: formData.protein_target ? parseInt(formData.protein_target) : null,
        carbs_target: formData.carbs_target ? parseInt(formData.carbs_target) : null,
        fat_target: formData.fat_target ? parseInt(formData.fat_target) : null,
        notes: formData.notes || null,
        is_active: true,
      };

      if (currentGoal) {
        // Update existing
        const { error } = await supabase
          .from("nutrition_goals")
          .update(goalData)
          .eq("id", currentGoal.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("nutrition_goals")
          .insert(goalData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-goals", memberUserId] });
      toast.success("Voedingsdoelen opgeslagen!");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error("Fout bij opslaan: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentGoal) return;
      
      const { error } = await supabase
        .from("nutrition_goals")
        .delete()
        .eq("id", currentGoal.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-goals", memberUserId] });
      toast.success("Voedingsdoelen verwijderd");
      setFormData({
        calories_target: "",
        protein_target: "",
        carbs_target: "",
        fat_target: "",
        notes: "",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Apple className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">Voedingsdoelen</h3>
        </div>
        {!isEditing && !currentGoal && (
          <Button onClick={() => setIsEditing(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Doelen Instellen
          </Button>
        )}
        {currentGoal && !isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Bewerken
          </Button>
        )}
      </div>

      {!currentGoal && !isEditing ? (
        <div className="text-center py-8">
          <Apple className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nog geen voedingsdoelen ingesteld voor dit lid
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calorieën (kcal)</Label>
              <Input
                id="calories"
                type="number"
                placeholder="2000"
                value={formData.calories_target}
                onChange={(e) => setFormData({ ...formData, calories_target: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Eiwitten (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="150"
                value={formData.protein_target}
                onChange={(e) => setFormData({ ...formData, protein_target: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Koolhydraten (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="250"
                value={formData.carbs_target}
                onChange={(e) => setFormData({ ...formData, carbs_target: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Vetten (g)</Label>
              <Input
                id="fat"
                type="number"
                placeholder="70"
                value={formData.fat_target}
                onChange={(e) => setFormData({ ...formData, fat_target: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              placeholder="Bijv. focus op meer eiwitten na training..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
              </Button>
              {currentGoal && (
                <Button 
                  variant="destructive" 
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  if (currentGoal) {
                    setFormData({
                      calories_target: currentGoal.calories_target?.toString() || "",
                      protein_target: currentGoal.protein_target?.toString() || "",
                      carbs_target: currentGoal.carbs_target?.toString() || "",
                      fat_target: currentGoal.fat_target?.toString() || "",
                      notes: currentGoal.notes || "",
                    });
                  }
                }}
              >
                Annuleren
              </Button>
            </div>
          )}

          {!isEditing && currentGoal && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-accent">{currentGoal.calories_target || "-"}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{currentGoal.protein_target || "-"}</p>
                  <p className="text-xs text-muted-foreground">Eiwitten (g)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{currentGoal.carbs_target || "-"}</p>
                  <p className="text-xs text-muted-foreground">Koolhydraten (g)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{currentGoal.fat_target || "-"}</p>
                  <p className="text-xs text-muted-foreground">Vetten (g)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
