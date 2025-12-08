import { useParams, useNavigate } from "react-router-dom";
import { educationModules } from "@/data/programs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, Bookmark, Brain, Heart, Dumbbell, Apple, Lightbulb, Zap, Utensils, Play } from "lucide-react";
import { useEducationFavorites } from "@/hooks/useEducationFavorites";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sleep: Heart,
  stress: Brain,
  training: Dumbbell,
  nutrition: Apple,
  mindset: Lightbulb,
  hyrox: Zap,
  lifestyle: Utensils,
};

const colorMap: Record<string, string> = {
  sleep: "bg-blue-500/10 text-blue-600",
  stress: "bg-purple-500/10 text-purple-600",
  training: "bg-orange-500/10 text-orange-600",
  nutrition: "bg-green-500/10 text-green-600",
  mindset: "bg-amber-500/10 text-amber-600",
  hyrox: "bg-red-500/10 text-red-600",
  lifestyle: "bg-pink-500/10 text-pink-600",
};

const EducationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useEducationFavorites();
  
  const module = educationModules.find((m) => m.id === id);

  // Get related guides (same category, excluding current)
  const relatedModules = educationModules
    .filter((m) => m.category === module?.category && m.id !== id)
    .slice(0, 3);

  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Guide niet gevonden</h2>
          <Button onClick={() => navigate("/education")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar overzicht
          </Button>
        </div>
      </div>
    );
  }

  const isModuleFavorite = isFavorite(module.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/education")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="secondary" className="shrink-0">
                {module.duration} min
              </Badge>
              <span className="text-sm text-muted-foreground truncate">Training Guide</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFavorite(module.id)}
          >
            <Bookmark className={`h-5 w-5 ${isModuleFavorite ? "fill-current text-accent" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">{module.title}</h1>

        {/* Key Points Summary */}
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-lg">Belangrijkste Punten</h2>
          </div>
          <ul className="space-y-2">
            {module.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-accent mt-1 shrink-0">•</span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Full Content */}
        {module.content && (
          <div className="prose prose-sm max-w-none">
            {module.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Action Items */}
        {module.actionItems && module.actionItems.length > 0 && (
          <Card className="p-5 mt-6 bg-accent/5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Direct Toepassen
            </h3>
            <ul className="space-y-2">
              {module.actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-accent mt-1">✓</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Related Guides */}
        {relatedModules.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Gerelateerde Guides</h3>
            <div className="space-y-3">
              {relatedModules.map((related) => {
                const Icon = iconMap[related.category];
                const colorClass = colorMap[related.category];
                
                return (
                  <Card
                    key={related.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/education/${related.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{related.title}</h4>
                        <p className="text-xs text-muted-foreground">{related.duration} min</p>
                      </div>
                      <Play className="w-4 h-4 text-accent shrink-0" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationDetail;
