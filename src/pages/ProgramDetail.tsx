import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { ChevronLeft, Calendar, Clock, Award } from "lucide-react";
import heroImage from "@/assets/gym-hero.jpg";

const ProgramDetail = () => {
  const { programId } = useParams();
  const { data: programs = [], isLoading } = usePrograms();
  
  // Fallback to static programs if database is empty
  const displayPrograms = programs.length > 0 ? programs : staticPrograms;
  const program = displayPrograms.find((p) => p.id === programId);

  if (isLoading) {
    return <div className="p-6">Loading program...</div>;
  }

  if (!program) {
    return <div className="p-6">Program not found</div>;
  }

  const currentWeek = program.weeks[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-br from-primary to-primary/70 overflow-hidden">
        <img 
          src={heroImage} 
          alt={program.name}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <Link to="/programs" className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-bold text-white mb-2">{program.name}</h1>
          <p className="text-white/90">{program.description}</p>
        </div>
      </div>

      <div className="p-6">
        {/* Program Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Calendar className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-sm font-semibold">{program.weeks.length}</p>
            <p className="text-xs text-muted-foreground">Weeks</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-sm font-semibold">{currentWeek.workouts[0].duration}</p>
            <p className="text-xs text-muted-foreground">Min/Day</p>
          </Card>
          <Card className="p-4 text-center">
            <Award className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-sm font-semibold">{currentWeek.workouts.length}</p>
            <p className="text-xs text-muted-foreground">Days/Week</p>
          </Card>
        </div>

        {/* Weeks */}
        <div className="space-y-6">
          {program.weeks.map((week) => (
            <div key={week.id}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Week {week.weekNumber}</h2>
                  <p className="text-sm text-muted-foreground">{week.name}</p>
                </div>
                <Badge variant="secondary">
                  {week.workouts.filter((w) => w.completed).length}/{week.workouts.length} Complete
                </Badge>
              </div>

              <div className="space-y-3">
                {week.workouts.map((workout) => (
                  <Link key={workout.id} to={`/workout/${workout.id}`}>
                    <Card className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-accent">
                              Day {workout.dayNumber}
                            </span>
                            {workout.completed && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold mb-1">{workout.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {workout.duration} min • {workout.mainLifts.length} main lifts
                          </p>
                        </div>
                        <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          Start
                        </Button>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgramDetail;
