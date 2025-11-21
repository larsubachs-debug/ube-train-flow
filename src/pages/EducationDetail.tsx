import { useParams, useNavigate } from "react-router-dom";
import { educationModules } from "@/data/programs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";

const EducationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const module = educationModules.find((m) => m.id === id);

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 flex items-center gap-3">
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
      </div>
    </div>
  );
};

export default EducationDetail;
