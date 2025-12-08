import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PlateCalculatorProps {
  targetWeight?: number;
  barWeight?: number;
}

// Standard plate weights in kg
const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

// Plate colors for visualization
const PLATE_COLORS: Record<number, string> = {
  25: "bg-red-500",
  20: "bg-blue-500",
  15: "bg-yellow-500",
  10: "bg-green-500",
  5: "bg-white border border-border",
  2.5: "bg-red-300",
  1.25: "bg-slate-400",
};

const PLATE_WIDTHS: Record<number, string> = {
  25: "w-8",
  20: "w-7",
  15: "w-6",
  10: "w-5",
  5: "w-4",
  2.5: "w-3",
  1.25: "w-2",
};

export const PlateCalculator = ({ 
  targetWeight = 0, 
  barWeight = 20 
}: PlateCalculatorProps) => {
  const [inputWeight, setInputWeight] = useState(targetWeight);
  const [customBarWeight, setCustomBarWeight] = useState(barWeight);

  useEffect(() => {
    if (targetWeight > 0) {
      setInputWeight(targetWeight);
    }
  }, [targetWeight]);

  const plateBreakdown = useMemo(() => {
    const weightPerSide = (inputWeight - customBarWeight) / 2;
    
    if (weightPerSide <= 0) {
      return { plates: [], totalPerSide: 0, valid: inputWeight >= customBarWeight };
    }

    const plates: number[] = [];
    let remaining = weightPerSide;

    for (const plate of STANDARD_PLATES) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
      }
    }

    // Check if we achieved exact weight
    const totalPerSide = plates.reduce((sum, p) => sum + p, 0);
    const valid = Math.abs(totalPerSide - weightPerSide) < 0.01;

    return { plates, totalPerSide, valid };
  }, [inputWeight, customBarWeight]);

  const plateCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    plateBreakdown.plates.forEach((plate) => {
      counts[plate] = (counts[plate] || 0) + 1;
    });
    return counts;
  }, [plateBreakdown.plates]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="p-2 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
          title="Plate Calculator"
        >
          <Calculator className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Plate Calculator</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Doelgewicht (kg)</Label>
              <Input
                type="number"
                value={inputWeight || ""}
                onChange={(e) => setInputWeight(parseFloat(e.target.value) || 0)}
                className="h-9 mt-1"
                placeholder="100"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Stang (kg)</Label>
              <Input
                type="number"
                value={customBarWeight || ""}
                onChange={(e) => setCustomBarWeight(parseFloat(e.target.value) || 20)}
                className="h-9 mt-1"
                placeholder="20"
              />
            </div>
          </div>

          {inputWeight > 0 && inputWeight >= customBarWeight && (
            <>
              {/* Visual plate representation */}
              <div className="flex items-center justify-center gap-1 py-3">
                {/* Left plates (reversed) */}
                <div className="flex items-center gap-0.5">
                  {[...plateBreakdown.plates].reverse().map((plate, idx) => (
                    <div
                      key={`left-${idx}`}
                      className={`${PLATE_COLORS[plate]} ${PLATE_WIDTHS[plate]} h-12 rounded-sm`}
                    />
                  ))}
                </div>
                
                {/* Bar */}
                <div className="w-20 h-3 bg-slate-600 rounded-full" />
                
                {/* Right plates */}
                <div className="flex items-center gap-0.5">
                  {plateBreakdown.plates.map((plate, idx) => (
                    <div
                      key={`right-${idx}`}
                      className={`${PLATE_COLORS[plate]} ${PLATE_WIDTHS[plate]} h-12 rounded-sm`}
                    />
                  ))}
                </div>
              </div>

              {/* Plate breakdown */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Per kant:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(plateCounts).map(([plate, count]) => (
                    <Badge
                      key={plate}
                      variant="secondary"
                      className="flex items-center gap-1.5"
                    >
                      <div className={`w-3 h-3 rounded-sm ${PLATE_COLORS[parseFloat(plate)]}`} />
                      {count}× {plate}kg
                    </Badge>
                  ))}
                </div>
                
                {plateBreakdown.plates.length === 0 && (
                  <p className="text-sm text-muted-foreground">Alleen de stang</p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Totaal per kant:</span>
                <span className="font-semibold">{plateBreakdown.totalPerSide}kg</span>
              </div>

              {!plateBreakdown.valid && inputWeight > customBarWeight && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Dit gewicht kan niet exact worden bereikt met standaard plates. 
                    Dichtstbijzijnd: {customBarWeight + (plateBreakdown.totalPerSide * 2)}kg
                  </p>
                </div>
              )}
            </>
          )}

          {inputWeight > 0 && inputWeight < customBarWeight && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Het doelgewicht moet minimaal het stanggewicht zijn ({customBarWeight}kg)
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
