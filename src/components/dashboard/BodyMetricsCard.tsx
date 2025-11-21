import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { Scale, Percent, Activity, Plus } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface BodyMetricsCardProps {
  userId: string;
}

export const BodyMetricsCard = ({ userId }: BodyMetricsCardProps) => {
  const { latestMetric, addMetric } = useBodyMetrics(userId);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    body_fat_percentage: "",
    muscle_mass: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addMetric.mutateAsync({
      recorded_at: new Date().toISOString(),
      weight: formData.weight ? parseFloat(formData.weight) : null,
      body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
      muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null,
      notes: formData.notes || null,
      front_photo_url: null,
      side_photo_url: null,
      back_photo_url: null,
    });

    setFormData({
      weight: "",
      body_fat_percentage: "",
      muscle_mass: "",
      notes: "",
    });
    setOpen(false);
  };

  const metrics = [
    {
      label: "Gewicht",
      value: latestMetric?.weight ? `${latestMetric.weight} kg` : "Geen data",
      icon: Scale,
      color: "text-primary",
    },
    {
      label: "Vetpercentage",
      value: latestMetric?.body_fat_percentage ? `${latestMetric.body_fat_percentage}%` : "Geen data",
      icon: Percent,
      color: "text-accent",
    },
    {
      label: "Spiermassa",
      value: latestMetric?.muscle_mass ? `${latestMetric.muscle_mass} kg` : "Geen data",
      icon: Activity,
      color: "text-secondary",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lichaamssamenstelling</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Body Metrics Toevoegen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Gewicht (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="75.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body_fat">Vetpercentage (%)</Label>
                <Input
                  id="body_fat"
                  type="number"
                  step="0.1"
                  value={formData.body_fat_percentage}
                  onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                  placeholder="15.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="muscle_mass">Spiermassa (kg)</Label>
                <Input
                  id="muscle_mass"
                  type="number"
                  step="0.1"
                  value={formData.muscle_mass}
                  onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                  placeholder="60.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notities (optioneel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Bijv. na het ontbijt, nuchter, etc."
                />
              </div>
              <Button type="submit" className="w-full" disabled={addMetric.isPending}>
                {addMetric.isPending ? "Opslaan..." : "Opslaan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                  <span className="font-medium">{metric.label}</span>
                </div>
                <span className="text-lg font-bold">{metric.value}</span>
              </div>
            );
          })}
          {latestMetric && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Laatst bijgewerkt: {format(new Date(latestMetric.recorded_at), 'dd MMMM yyyy', { locale: nl })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
