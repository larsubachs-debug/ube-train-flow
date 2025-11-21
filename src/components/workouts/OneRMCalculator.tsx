import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface OneRMCalculatorProps {
  weight: number;
  reps: number;
}

export const OneRMCalculator = ({ weight, reps }: OneRMCalculatorProps) => {
  const [oneRM, setOneRM] = useState(0);

  useEffect(() => {
    if (weight > 0 && reps > 0 && reps <= 12) {
      // Epley Formula: 1RM = w(1 + r/30)
      // Also using Brzycki as alternative: 1RM = w × (36 / (37 - r))
      const epley = weight * (1 + reps / 30);
      const brzycki = weight * (36 / (37 - reps));
      
      // Average of both formulas for better accuracy
      const calculated = (epley + brzycki) / 2;
      setOneRM(Math.round(calculated * 10) / 10);
    } else if (reps === 1) {
      setOneRM(weight);
    } else {
      setOneRM(0);
    }
  }, [weight, reps]);

  if (oneRM === 0 || reps > 12) return null;

  // Calculate percentages for common training zones
  const percentages = [
    { label: "90%", value: Math.round(oneRM * 0.9 * 10) / 10 },
    { label: "85%", value: Math.round(oneRM * 0.85 * 10) / 10 },
    { label: "80%", value: Math.round(oneRM * 0.8 * 10) / 10 },
    { label: "75%", value: Math.round(oneRM * 0.75 * 10) / 10 },
  ];

  return (
    <Card className="p-3 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Geschatte 1RM</h4>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-primary">{oneRM}</span>
        <span className="text-sm text-muted-foreground">kg</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {percentages.map((p) => (
          <div key={p.label} className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{p.label}</p>
            <p className="text-sm font-semibold">{p.value}kg</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Gebaseerd op {weight}kg × {reps} reps
      </p>
    </Card>
  );
};
