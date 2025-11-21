import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { educationModules } from "@/data/programs";
import { Brain, Heart, Dumbbell, Apple, Lightbulb, Play, Zap, Utensils } from "lucide-react";
import React from "react";

const iconMap = {
  sleep: Heart,
  stress: Brain,
  training: Dumbbell,
  nutrition: Apple,
  mindset: Lightbulb,
  hyrox: Zap,
  lifestyle: Utensils,
};

const colorMap = {
  sleep: "bg-blue-500/10 text-blue-600",
  stress: "bg-purple-500/10 text-purple-600",
  training: "bg-orange-500/10 text-orange-600",
  nutrition: "bg-green-500/10 text-green-600",
  mindset: "bg-amber-500/10 text-amber-600",
  hyrox: "bg-red-500/10 text-red-600",
  lifestyle: "bg-pink-500/10 text-pink-600",
};

const Education = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  
  const categories = [
    { id: null, name: "Alle", icon: Play },
    { id: "hyrox", name: "Hyrox Training", icon: Zap },
    { id: "training", name: "Training", icon: Dumbbell },
    { id: "nutrition", name: "Voeding", icon: Apple },
    { id: "sleep", name: "Slaap", icon: Heart },
    { id: "stress", name: "Stress", icon: Brain },
    { id: "mindset", name: "Mindset", icon: Lightbulb },
    { id: "lifestyle", name: "Lifestyle", icon: Utensils },
  ];

  const filteredModules = selectedCategory
    ? educationModules.filter(module => module.category === selectedCategory)
    : educationModules;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Training Guides</h1>
        <p className="text-muted-foreground mb-6">
          Leer alles over trainen naar Hyrox en optimaliseer je prestaties.
        </p>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {filteredModules.map((module) => {
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
                      <span>Lees Guide</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Geen guides gevonden in deze categorie.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Education;
