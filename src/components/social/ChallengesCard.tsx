import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Users, Target, Plus, Calendar, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  participants: {
    user_id: string;
    current_progress: number;
    user_name: string;
    user_avatar: string | null;
  }[];
  user_joined: boolean;
  user_progress: number;
}

export const ChallengesCard = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    challenge_type: "workouts",
    target_value: 10,
    end_date: "",
  });

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!challengesData || challengesData.length === 0) {
        setChallenges([]);
        return;
      }

      // Fetch participants for each challenge
      const challengeIds = challengesData.map(c => c.id);
      const { data: participantsData } = await supabase
        .from('challenge_participants')
        .select('*')
        .in('challenge_id', challengeIds);

      // Fetch profiles for participants
      const participantUserIds = [...new Set(participantsData?.map(p => p.user_id) || [])];
      let profilesMap = new Map();
      
      if (participantUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', participantUserIds);
        
        profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      }

      const formattedChallenges: Challenge[] = challengesData.map(challenge => {
        const challengeParticipants = participantsData?.filter(p => p.challenge_id === challenge.id) || [];
        const userParticipant = challengeParticipants.find(p => p.user_id === user.id);
        
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          challenge_type: challenge.challenge_type,
          target_value: challenge.target_value,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          is_active: challenge.is_active,
          participants: challengeParticipants.map(p => {
            const profile = profilesMap.get(p.user_id);
            return {
              user_id: p.user_id,
              current_progress: p.current_progress,
              user_name: profile?.display_name || 'Unknown',
              user_avatar: profile?.avatar_url || null,
            };
          }).sort((a, b) => b.current_progress - a.current_progress),
          user_joined: !!userParticipant,
          user_progress: userParticipant?.current_progress || 0,
        };
      });

      setChallenges(formattedChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
        current_progress: 0,
      });

      if (error) throw error;

      toast.success("Je doet mee aan de challenge! 🎯");
      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error("Kon niet deelnemen aan challenge");
    }
  };

  const handleCreateChallenge = async () => {
    if (!user || !newChallenge.title || !newChallenge.end_date) return;

    try {
      const { error } = await supabase.from('challenges').insert({
        title: newChallenge.title,
        description: newChallenge.description || null,
        challenge_type: newChallenge.challenge_type,
        target_value: newChallenge.target_value,
        start_date: new Date().toISOString().split('T')[0],
        end_date: newChallenge.end_date,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Challenge aangemaakt! 🏆");
      setCreateDialogOpen(false);
      setNewChallenge({
        title: "",
        description: "",
        challenge_type: "workouts",
        target_value: 10,
        end_date: "",
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error("Kon challenge niet aanmaken");
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'workouts': return 'Workouts';
      case 'volume': return 'kg Volume';
      case 'streak': return 'Dagen streak';
      default: return type;
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'workouts': return <Target className="w-4 h-4" />;
      case 'volume': return <Flame className="w-4 h-4" />;
      case 'streak': return <Calendar className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Challenges
        </h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="w-4 h-4" />
              Nieuw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  placeholder="Bijv. December Gainz"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  placeholder="Wat is het doel?"
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newChallenge.challenge_type}
                    onValueChange={(value) => setNewChallenge({ ...newChallenge, challenge_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workouts">Workouts</SelectItem>
                      <SelectItem value="volume">Volume (kg)</SelectItem>
                      <SelectItem value="streak">Streak (dagen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Doel</Label>
                  <Input
                    id="target"
                    type="number"
                    value={newChallenge.target_value}
                    onChange={(e) => setNewChallenge({ ...newChallenge, target_value: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Einddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newChallenge.end_date}
                  onChange={(e) => setNewChallenge({ ...newChallenge, end_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button onClick={handleCreateChallenge} className="w-full">
                Challenge Starten
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nog geen actieve challenges</p>
          <p className="text-sm">Start een nieuwe challenge!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
            const progressPercent = Math.min((challenge.user_progress / challenge.target_value) * 100, 100);

            return (
              <div key={challenge.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {getChallengeIcon(challenge.challenge_type)}
                      {challenge.title}
                    </h4>
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {daysLeft} dagen
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>{challenge.target_value} {getChallengeTypeLabel(challenge.challenge_type)}</span>
                  <span className="mx-2">•</span>
                  <Users className="w-4 h-4" />
                  <span>{challenge.participants.length} deelnemers</span>
                </div>

                {challenge.user_joined ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Jouw voortgang</span>
                      <span className="font-medium">
                        {challenge.user_progress} / {challenge.target_value}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className="w-full"
                  >
                    Doe mee!
                  </Button>
                )}

                {/* Leaderboard */}
                {challenge.participants.length > 0 && (
                  <div className="flex items-center gap-1 pt-2 border-t">
                    {challenge.participants.slice(0, 5).map((participant, index) => (
                      <div
                        key={participant.user_id}
                        className="relative"
                        title={`${participant.user_name}: ${participant.current_progress}`}
                      >
                        <Avatar className="w-8 h-8">
                          {participant.user_avatar && <AvatarImage src={participant.user_avatar} />}
                          <AvatarFallback className="text-xs">
                            {getInitials(participant.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <Trophy className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                        )}
                      </div>
                    ))}
                    {challenge.participants.length > 5 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{challenge.participants.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
