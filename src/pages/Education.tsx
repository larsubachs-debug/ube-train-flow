import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { educationModules } from "@/data/programs";
import { Brain, Heart, Dumbbell, Apple, Lightbulb, Play } from "lucide-react";

const iconMap = {
  sleep: Heart,
  stress: Brain,
  training: Dumbbell,
  nutrition: Apple,
  mindset: Lightbulb,
};

const colorMap = {
  sleep: "bg-blue-500/10 text-blue-600",
  stress: "bg-purple-500/10 text-purple-600",
  training: "bg-orange-500/10 text-orange-600",
  nutrition: "bg-green-500/10 text-green-600",
  mindset: "bg-amber-500/10 text-amber-600",
};

const Education = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Education & Mindset</h1>
        <p className="text-muted-foreground mb-6">
          Knowledge is power. Learn the fundamentals.
        </p>

        <div className="space-y-4">
          {educationModules.map((module) => {
            const Icon = iconMap[module.category];
            const colorClass = colorMap[module.category];
            
            return (
              <Card key={module.id} className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg leading-tight">{module.title}</h3>
                      <Badge variant="secondary" className="ml-2">
                        {module.duration} min
                      </Badge>
                    </div>
                    
                    <ul className="space-y-1 mb-3">
                      {module.keyPoints.slice(0, 3).map((point, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-2 text-accent text-sm font-medium">
                      <Play className="w-4 h-4" />
                      <span>Watch Now</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon */}
        <Card className="p-8 mt-8 text-center bg-muted/30">
          <Lightbulb className="w-12 h-12 text-accent mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">More Content Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            We're constantly adding new modules to help you optimize every aspect of your training.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Education;
