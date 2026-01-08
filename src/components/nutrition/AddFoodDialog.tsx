import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MealType } from "@/hooks/useFoodLogs";

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  mealLabel: string;
  onAdd: (data: {
    name: string;
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  }) => void;
  isLoading: boolean;
}

export const AddFoodDialog = ({
  open,
  onOpenChange,
  mealType,
  mealLabel,
  onAdd,
  isLoading,
}: AddFoodDialogProps) => {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [protein, setProtein] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      calories: parseInt(calories) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      protein: parseFloat(protein) || 0,
    });

    // Reset form
    setName("");
    setCalories("");
    setCarbs("");
    setFat("");
    setProtein("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voeding toevoegen - {mealLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input
              id="name"
              placeholder="bijv. Havermout met banaan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="calories">Calorieën (kcal)</Label>
            <Input
              id="calories"
              type="number"
              placeholder="0"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="carbs">Koolh. (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="0"
                min="0"
                step="0.1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Vet (g)</Label>
              <Input
                id="fat"
                type="number"
                placeholder="0"
                min="0"
                step="0.1"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Eiwit (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="0"
                min="0"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading || !name.trim()}>
              {isLoading ? "Toevoegen..." : "Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
