import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { programs } from "@/data/programs";
import { Link } from "react-router-dom";
import { Dumbbell, Zap, Activity, ChevronRight } from "lucide-react";

const iconMap = {
  Dumbbell,
  Zap,
  Activity,
};

const Programs = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Training Programs</h1>
        <p className="text-muted-foreground mb-6">
          Choose your path to peak performance
        </p>

        <div className="space-y-4">
          {programs.map((program) => {
            const Icon = iconMap[program.icon as keyof typeof iconMap];
            
            return (
              <Card key={program.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">{program.name}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {program.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {program.weeks.length} weeks • {program.weeks[0].workouts.length} days/week
                      </span>
                      
                      <Link to={`/program/${program.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          View Program
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Current Program Details */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Current Program</h2>
          <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-accent/20 p-3 rounded-lg">
                <Dumbbell className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{programs[0].name}</h3>
                <p className="text-sm text-muted-foreground">Week 1 of 6</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">25%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent rounded-full h-2 w-1/4" />
              </div>
            </div>

            <Link to={`/program/${programs[0].id}`}>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Continue Program
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Programs;
