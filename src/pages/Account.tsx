import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Crown, Settings, BookOpen, LogOut, Image, Users, Dumbbell, MessageCircle, ClipboardList, ListTodo, Palette, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ubeLogo from "@/assets/ube-logo.png";
import { AvatarUpload } from "@/components/admin/AvatarUpload";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

const Account = () => {
  const { t } = useTranslation();
  const { user, signOut, userRole, hasRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user?.id)
      .maybeSingle();
    
    setProfile(data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isCoachOrAdmin = hasRole("coach");

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={ubeLogo} alt="U.be" className="h-12" />
        </div>

        {/* Profile Header */}
        <Card className="p-6 mb-6">
          {isCoachOrAdmin ? (
            <div className="space-y-4">
              <AvatarUpload 
                currentAvatarUrl={profile?.avatar_url}
                onUploadComplete={fetchProfile}
              />
              <div className="text-center">
                <h2 className="text-xl font-bold">
                  {profile?.display_name || user?.user_metadata?.display_name || "Coach"}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {userRole && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
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
                {t('account.editProfile')}
              </Button>
            </>
          )}
        </Card>

        {/* Membership Status */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <div className="flex items-start gap-3">
            <div className="bg-accent/20 p-2 rounded-lg">
              <Crown className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{t('account.freeTrial')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                5 {t('account.daysRemaining')} • {t('account.expires')} May 5, 2024
              </p>
              <Link to="/membership">
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  {t('account.choosePlan')}
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
                  {t('account.adminTools').toUpperCase()}
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
                        <p className="font-medium">{t('account.memberManagement')}</p>
                        <p className="text-sm text-muted-foreground">{t('account.approveCreate')}</p>
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
                        <p className="font-medium">{t('account.myMembers')}</p>
                        <p className="text-sm text-muted-foreground">{t('account.viewMemberProgress')}</p>
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
                        <p className="font-medium">{t('account.programManagement')}</p>
                        <p className="text-sm text-muted-foreground">{t('account.createEditPrograms')}</p>
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
                        <p className="font-medium">{t('account.checkinManagement')}</p>
                        <p className="text-sm text-muted-foreground">{t('account.manageQuestions')}</p>
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
                        <p className="font-medium">{t('account.taskManagement')}</p>
                        <p className="text-sm text-muted-foreground">{t('account.manageTasks')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              <Link to="/admin/branding">
                <Card className="p-4 hover:bg-muted/50 transition-colors border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <Palette className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{t('account.brandingStyling')}</p>
                        <p className="text-sm text-muted-foreground">{t('account.customizeColors')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              <div className="mb-4 mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
                  {t('account.myAccount').toUpperCase()}
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
                      <p className="font-medium">{t('chat.chatWithCoach')}</p>
                      <p className="text-sm text-muted-foreground">{t('chat.askQuestions')}</p>
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
                    <p className="font-medium">{t('account.mediaManagement')}</p>
                    <p className="text-sm text-muted-foreground">{t('account.uploadManage')}</p>
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
                    <p className="font-medium">{t('account.trainingGuides')}</p>
                    <p className="text-sm text-muted-foreground">16 {t('education.guidesAvailable')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>

          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-lg">
                  <Sun className="w-5 h-5 text-foreground dark:hidden" />
                  <Moon className="w-5 h-5 text-foreground hidden dark:block" />
                </div>
                <div>
                  <p className="font-medium">{t('account.theme')}</p>
                  <p className="text-sm text-muted-foreground">{t('account.themeDescription')}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-foreground" />
                </div>
                <p className="font-medium">{t('nav.settings')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">12</p>
            <p className="text-xs text-muted-foreground">{t('nav.workouts')}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">5</p>
            <p className="text-xs text-muted-foreground">PR's</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">28</p>
            <p className="text-xs text-muted-foreground">{t('time.days')}</p>
          </Card>
        </div>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full gap-2 text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          {t('auth.signOut')}
        </Button>
      </div>
    </div>
  );
};

export default Account;
