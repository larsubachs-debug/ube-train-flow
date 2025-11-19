import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Calendar, TrendingUp, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const CheckIn = () => {
  const [energy, setEnergy] = useState([7]);
  const [stress, setStress] = useState([5]);
  const [sleep, setSleep] = useState([7]);
  const [steps, setSteps] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Check-in saved successfully!");
    // Reset form
    setEnergy([7]);
    setStress([5]);
    setSleep([7]);
    setSteps("");
    setWeight("");
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Weekly Check-In</h1>
            <p className="text-sm text-muted-foreground">Week 1 • April 2024</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Energy Level */}
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Energy Level</Label>
            <div className="space-y-4">
              <Slider
                value={energy}
                onValueChange={setEnergy}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low</span>
                <span className="font-bold text-lg">{energy[0]}/10</span>
                <span className="text-muted-foreground">High</span>
              </div>
            </div>
          </Card>

          {/* Stress Level */}
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Stress Level</Label>
            <div className="space-y-4">
              <Slider
                value={stress}
                onValueChange={setStress}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low</span>
                <span className="font-bold text-lg">{stress[0]}/10</span>
                <span className="text-muted-foreground">High</span>
              </div>
            </div>
          </Card>

          {/* Sleep Quality */}
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Sleep Quality</Label>
            <div className="space-y-4">
              <Slider
                value={sleep}
                onValueChange={setSleep}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Poor</span>
                <span className="font-bold text-lg">{sleep[0]}/10</span>
                <span className="text-muted-foreground">Excellent</span>
              </div>
            </div>
          </Card>

          {/* Metrics */}
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Metrics</Label>
            <div className="space-y-4">
              <div>
                <Label htmlFor="steps">Average Daily Steps</Label>
                <Input
                  id="steps"
                  type="number"
                  placeholder="e.g. 10000"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 75.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6">
            <Label htmlFor="notes" className="text-lg font-semibold mb-4 block">
              How was your week?
            </Label>
            <Textarea
              id="notes"
              placeholder="Share your thoughts, challenges, wins..."
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </Card>

          {/* Photo Upload */}
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Progress Photos</Label>
            <Button type="button" variant="outline" className="w-full gap-2">
              <ImageIcon className="w-4 h-4" />
              Upload Photos
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Front, side, and back photos recommended
            </p>
          </Card>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-lg">
            Submit Check-In
          </Button>
        </form>

        {/* Previous Check-ins */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold">Previous Check-Ins</h2>
          </div>
          
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Week {4 - i} Check-In</p>
                    <p className="text-sm text-muted-foreground">March {25 - i * 7}, 2024</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
