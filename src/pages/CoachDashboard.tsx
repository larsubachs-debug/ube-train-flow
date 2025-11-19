import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Calendar, Award, MessageCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ProgramAssigner } from "@/components/admin/ProgramAssigner";

interface Member {
  member_id: string;
  member_user_id: string;
  member_name: string | null;
  member_avatar: string | null;
}

interface MemberStats {
  total_workouts: number;
  total_prs: number;
  current_streak: number;
  last_workout_date: string | null;
}

interface CheckIn {
  id: string;
  checkin_week: number;
  created_at: string;
  notes: string | null;
}

const CoachDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [memberCheckIns, setMemberCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [assigningMember, setAssigningMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyMembers();
  }, [user]);

  const fetchMyMembers = async () => {
    try {
      setLoading(true);
      
      // Get coach's profile id
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!coachProfile) return;

      // Get all members assigned to this coach
      const { data: membersData, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url")
        .eq("coach_id", coachProfile.id);

      if (error) throw error;

      const formattedMembers = membersData?.map(m => ({
        member_id: m.id,
        member_user_id: m.user_id,
        member_name: m.display_name,
        member_avatar: m.avatar_url,
      })) || [];

      setMembers(formattedMembers);
      
      if (formattedMembers.length > 0) {
        setSelectedMember(formattedMembers[0]);
        fetchMemberData(formattedMembers[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberData = async (member: Member) => {
    try {
      setStatsLoading(true);
      
      // Fetch member stats
      const { data: stats } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", member.member_user_id)
        .maybeSingle();

      setMemberStats(stats || {
        total_workouts: 0,
        total_prs: 0,
        current_streak: 0,
        last_workout_date: null,
      });

      // Fetch member check-ins
      const { data: checkIns } = await supabase
        .from("checkin_photos")
        .select("id, checkin_week, created_at, notes")
        .eq("user_id", member.member_user_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setMemberCheckIns(checkIns || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    fetchMemberData(member);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 pb-20">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 pb-20">
        <h1 className="text-2xl font-bold mb-6">Mijn Members</h1>
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Nog geen members</h2>
          <p className="text-muted-foreground">
            Er zijn nog geen members aan jou toegewezen.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Mijn Members</h1>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
                {members.map((member) => (
                  <Card
                    key={member.member_id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedMember?.member_id === member.member_id
                        ? "border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => handleMemberSelect(member)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={member.member_avatar || undefined} />
                        <AvatarFallback>
                          {member.member_name?.[0]?.toUpperCase() || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {member.member_name || "Naamloos"}
                        </h3>
                        <p className="text-sm text-muted-foreground">Member</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Actief</Badge>
                        <Link 
                          to={`/coach/chat/${member.member_id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" variant="ghost">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigningMember(member);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {selectedMember && (
              <>
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedMember.member_avatar || undefined} />
                      <AvatarFallback className="text-2xl">
                        {selectedMember.member_name?.[0]?.toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedMember.member_name || "Naamloos"}
                      </h2>
                      <p className="text-muted-foreground">Member</p>
                    </div>
                  </div>

                  {statsLoading ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          <p className="text-sm text-muted-foreground">Workouts</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {memberStats?.total_workouts || 0}
                        </p>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-accent" />
                          <p className="text-sm text-muted-foreground">PR's</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {memberStats?.total_prs || 0}
                        </p>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-accent" />
                          <p className="text-sm text-muted-foreground">Streak</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {memberStats?.current_streak || 0}
                        </p>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-accent" />
                          <p className="text-sm text-muted-foreground">Laatste workout</p>
                        </div>
                        <p className="text-sm font-medium">
                          {memberStats?.last_workout_date
                            ? new Date(memberStats.last_workout_date).toLocaleDateString('nl-NL')
                            : "Nog niet"}
                        </p>
                      </Card>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Check-ins</h3>
                  {memberCheckIns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nog geen check-ins
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {memberCheckIns.map((checkIn) => (
                        <Card key={checkIn.id} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">Week {checkIn.checkin_week}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(checkIn.created_at).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                          {checkIn.notes && (
                            <p className="text-sm text-muted-foreground">{checkIn.notes}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {assigningMember && (
        <ProgramAssigner
          open={!!assigningMember}
          onOpenChange={(open) => !open && setAssigningMember(null)}
          memberId={assigningMember.member_id}
          memberName={assigningMember.member_name}
          memberUserId={assigningMember.member_user_id}
        />
      )}
    </div>
  );
};

export default CoachDashboard;
