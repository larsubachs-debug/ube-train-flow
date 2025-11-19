import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Crown, Settings, BookOpen, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Account = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-accent/10 text-accent text-xl font-bold">
                JD
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">John Doe</h2>
              <p className="text-sm text-muted-foreground">john.doe@email.com</p>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </Card>

        {/* Membership Status */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <div className="flex items-start gap-3">
            <div className="bg-accent/20 p-2 rounded-lg">
              <Crown className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Free Trial</h3>
              <p className="text-sm text-muted-foreground mb-3">
                5 days remaining • Expires May 5, 2024
              </p>
              <Link to="/membership">
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Choose Your Plan
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          <Link to="/education">
            <Card className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Education & Mindset</p>
                    <p className="text-sm text-muted-foreground">6 modules available</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>

          <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-foreground" />
                </div>
                <p className="font-medium">Settings</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">12</p>
            <p className="text-xs text-muted-foreground">Workouts</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">5</p>
            <p className="text-xs text-muted-foreground">PR's</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">28</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </Card>
        </div>

        {/* Logout */}
        <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default Account;
