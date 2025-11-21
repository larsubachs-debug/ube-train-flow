import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGoals } from "@/hooks/useGoals";
import { Target, Plus } from "lucide-react";
import { format } from "date-fns";

interface GoalSettingDialogProps {
  userId: string;
}

export const GoalSettingDialog = ({ userId }: GoalSettingDialogProps) => {
  const { weightGoal, addGoal, updateGoal } = useGoals(userId);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    target_value: weightGoal?.target_value?.toString() || "",
    target_date: weightGoal?.target_date || "",
    notes: weightGoal?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (weightGoal) {
      await updateGoal.mutateAsync({
        id: weightGoal.id,
        target_value: parseFloat(formData.target_value),
        target_date: formData.target_date || null,
        notes: formData.notes || null,
      });
    } else {
      await addGoal.mutateAsync({
        goal_type: 'weight',
        target_value: parseFloat(formData.target_value),
        start_date: format(new Date(), 'yyyy-MM-dd'),
        target_date: formData.target_date || null,
        is_active: true,
        notes: formData.notes || null,
      });
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Target className="w-4 h-4 mr-2" />
          {weightGoal ? 'Doel Aanpassen' : 'Doel Instellen'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Doelgewicht Instellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target_weight">Doelgewicht (kg) *</Label>
            <Input
              id="target_weight"
              type="number"
              step="0.1"
              required
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              placeholder="75.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_date">Streef Datum (optioneel)</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notities (optioneel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Bijv. voor vakantie, bruiloft, etc."
            />
          </div>
          <Button type="submit" className="w-full" disabled={addGoal.isPending || updateGoal.isPending}>
            {(addGoal.isPending || updateGoal.isPending) ? "Opslaan..." : "Opslaan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
