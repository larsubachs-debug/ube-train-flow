import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Check, Dumbbell, Target, Clock, Trophy } from "lucide-react";
import gymHero from "@/assets/gym-hero.jpg";
import ubeLogo from "@/assets/ube-logo.png";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Profile" },
  { id: 3, title: "Goals" },
  { id: 4, title: "Experience" },
];

const GOAL_OPTIONS = [
  { id: "strength", label: "Build Strength", icon: Dumbbell, description: "Focus on getting stronger" },
  { id: "muscle", label: "Build Muscle", icon: Trophy, description: "Hypertrophy focused training" },
  { id: "fat-loss", label: "Fat Loss", icon: Target, description: "Lose weight & get lean" },
  { id: "performance", label: "Performance", icon: Clock, description: "Improve athletic performance" },
];

const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "Beginner", description: "New to training (0-1 year)" },
  { id: "intermediate", label: "Intermediate", description: "Some experience (1-3 years)" },
  { id: "advanced", label: "Advanced", description: "Experienced lifter (3+ years)" },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      localStorage.setItem("onboardingCompleted", "true");
      navigate("/");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return name.length >= 2;
      case 3:
        return selectedGoals.length > 0;
      case 4:
        return experience !== "";
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="relative h-screen flex flex-col">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${gymHero})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-6 text-center text-primary-foreground">
            <img src={ubeLogo} alt="U.be" className="h-24 mb-6 brightness-0 invert" />
            <p className="text-xl mb-4 opacity-90 tracking-wider">All About U</p>
            <p className="text-sm opacity-70 mb-12 max-w-xs">
              Welkom bij je persoonlijke fitness journey. Laten we beginnen met een paar vragen.
            </p>

            <Button
              onClick={handleNext}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 px-8"
            >
              Start
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Steps 2-4: Form Steps */}
      {step > 1 && (
        <div className="min-h-screen flex flex-col">
          {/* Header with progress */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Stap {step} van {STEPS.length}
              </span>
              <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Progress indicator */}
            <div className="flex gap-2">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all duration-300",
                    s.id <= step ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {/* Step 2: Name */}
            {step === 2 && (
              <div className="max-w-lg mx-auto animate-fade-in">
                <h2 className="text-3xl font-bold mb-2">Hoe heet je?</h2>
                <p className="text-muted-foreground mb-8">
                  Je coach zal je bij je naam aanspreken
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Naam</Label>
                    <Input
                      id="name"
                      placeholder="Je voornaam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 text-lg py-6"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div className="max-w-lg mx-auto animate-fade-in">
                <h2 className="text-3xl font-bold mb-2">Wat zijn je doelen?</h2>
                <p className="text-muted-foreground mb-8">
                  Selecteer één of meerdere doelen
                </p>

                <div className="space-y-3">
                  {GOAL_OPTIONS.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = selectedGoals.includes(goal.id);

                    return (
                      <Card
                        key={goal.id}
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-200 border-2",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        )}
                        onClick={() => toggleGoal(goal.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{goal.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {goal.description}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {step === 4 && (
              <div className="max-w-lg mx-auto animate-fade-in">
                <h2 className="text-3xl font-bold mb-2">Hoeveel ervaring heb je?</h2>
                <p className="text-muted-foreground mb-8">
                  Dit helpt je coach om het juiste programma te kiezen
                </p>

                <div className="space-y-3">
                  {EXPERIENCE_OPTIONS.map((exp) => {
                    const isSelected = experience === exp.id;

                    return (
                      <Card
                        key={exp.id}
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-200 border-2",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        )}
                        onClick={() => setExperience(exp.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{exp.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {exp.description}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer with action button */}
          <div className="p-6 border-t border-border">
            <Button
              onClick={handleNext}
              disabled={!canContinue()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              size="lg"
            >
              {step === 4 ? "Start Training" : "Volgende"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
