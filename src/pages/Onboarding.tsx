import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import gymHero from "@/assets/gym-hero.jpg";
import ubeLogo from "@/assets/ube-logo.png";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && name && goals) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            <p className="text-xl mb-12 opacity-90 tracking-wider">All About U</p>
            
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 px-8"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6 pt-12">
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-bold mb-2">Vertel ons over jezelf</h2>
            <p className="text-muted-foreground mb-8">
              Je trainer zal een passend programma voor je kiezen
            </p>

            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Je Naam</Label>
                <Input
                  id="name"
                  placeholder="Vul je naam in"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="goals">Je Doelen</Label>
                <Textarea
                  id="goals"
                  placeholder="Wat wil je bereiken? Wees specifiek..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={5}
                  className="mt-1 resize-none"
                />
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!name || !goals}
              className="w-full mt-8 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              size="lg"
            >
              Start Training
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
