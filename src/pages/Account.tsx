import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Crown, Settings, BookOpen, LogOut, Image, Users, Dumbbell, MessageCircle, ClipboardList, ListTodo } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ubeLogo from "@/assets/ube-logo.png";

const Account = () => {
  const { user, signOut, userRole, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isCoachOrAdmin = hasRole("coach");

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={ubeLogo} alt="U.be" className="h-12" />
        </div>

        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-accent/10 text-accent text-xl font-bold">
                {user?.email?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">
                {user?.user_metadata?.display_name || "User"}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {userRole && (
                <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
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
          {isCoachOrAdmin && (
            <>
              <div className="mb-4 mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
                  ADMIN TOOLS
                </h3>
              </div>
              
              <Link to="/admin/members">
                <Card className="p-4 hover:bg-muted/50 transition-colors border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">Member Management</p>
                        <p className="text-sm text-muted-foreground">Approve & create members</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              <Link to="/coach/dashboard">
                <Card className="p-4 hover:bg-muted/50 transition-colors border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">Mijn Members</p>
                        <p className="text-sm text-muted-foreground">Bekijk voortgang members</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              <Link to="/admin/programs">
                <Card className="p-4 hover:bg-muted/50 transition-colors border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <Dumbbell className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">Program Management</p>
                        <p className="text-sm text-muted-foreground">Create & edit programs</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              <Link to="/admin/checkins">
                <Card className="p-4 hover:bg-muted/50 transition-colors border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">Check-in Beheer</p>
                        <p className="text-sm text-muted-foreground">Beheer vragen & toewijzingen</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              <Link to="/admin/tasks">
                <Card className="p-4 hover:bg-muted/50 transition-colors border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <ListTodo className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">Taken Beheer</p>
                        <p className="text-sm text-muted-foreground">Beheer taken & toewijzingen</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              <div className="mb-4 mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
                  MY ACCOUNT
                </h3>
              </div>
            </>
          )}

          {!isCoachOrAdmin && (
            <Link to="/chat">
              <Card className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-2 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Chat met Coach</p>
                      <p className="text-sm text-muted-foreground">Stel vragen aan je coach</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          )}

          <Link to="/media">
            <Card className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 p-2 rounded-lg">
                    <Image className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Media Management</p>
                    <p className="text-sm text-muted-foreground">Upload & manage photos and videos</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>

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
        <Button 
          variant="outline" 
          className="w-full gap-2 text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Account;
