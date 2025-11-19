import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, Award, Play } from "lucide-react";
import { programs } from "@/data/programs";

const Home = () => {
  // Mock data - in real app this would come from user state
  const currentProgram = programs[0];
  const nextWorkout = currentProgram.weeks[0].workouts[0];
  const thisWeek = currentProgram.weeks[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-64 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        <div className="relative h-full flex flex-col justify-end p-6 text-primary-foreground">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-lg opacity-90">Let's get stronger today</p>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-6">
        {/* Next Workout Card */}
        <Card className="p-6 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">NEXT WORKOUT</p>
              <h2 className="text-2xl font-bold">{nextWorkout.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentProgram.name} • Week {thisWeek.weekNumber} • Day {nextWorkout.dayNumber}
              </p>
            </div>
            <div className="bg-accent/10 p-3 rounded-full">
              <Play className="w-6 h-6 text-accent" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {nextWorkout.duration} min
            </span>
            <span>
              {nextWorkout.mainLifts.length} main lifts • {nextWorkout.accessories.length} accessories
            </span>
          </div>

          <Link to={`/workout/${nextWorkout.id}`}>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Start Workout
            </Button>
          </Link>
        </Card>

        {/* This Week Overview */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">This Week</h3>
          </div>
          
          <div className="space-y-3">
            {thisWeek.workouts.map((workout) => (
              <Link key={workout.id} to={`/workout/${workout.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">Day {workout.dayNumber}: {workout.name}</p>
                    <p className="text-sm text-muted-foreground">{workout.duration} minutes</p>
                  </div>
                  {workout.completed ? (
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="bg-muted p-2 rounded-full">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Workouts completed</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">PR's</p>
            </div>
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">Personal records</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
