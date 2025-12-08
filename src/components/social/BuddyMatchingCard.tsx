import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, MapPin, Target, Clock, Check, X, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface BuddyProfile {
  id: string;
  user_id: string;
  gym_name: string | null;
  goals: string[];
  preferred_workout_times: string[];
  experience_level: string;
  looking_for_buddy: boolean;
  bio: string | null;
  user_name: string;
  user_avatar: string | null;
  match_score: number;
}

interface BuddyMatch {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  other_user_name: string;
  other_user_avatar: string | null;
  is_requester: boolean;
}

const GOALS = [
  { value: 'strength', label: 'Krachttraining' },
  { value: 'hypertrophy', label: 'Spieropbouw' },
  { value: 'fat_loss', label: 'Afvallen' },
  { value: 'endurance', label: 'Uithoudingsvermogen' },
  { value: 'general', label: 'Algemene fitness' },
];

const WORKOUT_TIMES = [
  { value: 'early_morning', label: 'Vroege ochtend (6-8u)' },
  { value: 'morning', label: 'Ochtend (8-12u)' },
  { value: 'afternoon', label: 'Middag (12-17u)' },
  { value: 'evening', label: 'Avond (17-21u)' },
  { value: 'late_night', label: 'Laat (21u+)' },
];

export const BuddyMatchingCard = () => {
  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState<BuddyProfile | null>(null);
  const [potentialBuddies, setPotentialBuddies] = useState<BuddyProfile[]>([]);
  const [matches, setMatches] = useState<BuddyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    gym_name: "",
    goals: [] as string[],
    preferred_workout_times: [] as string[],
    experience_level: "intermediate",
    looking_for_buddy: true,
    bio: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch my profile
      const { data: myProfileData } = await supabase
        .from('buddy_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (myProfileData) {
        setMyProfile({
          ...myProfileData,
          user_name: '',
          user_avatar: null,
          match_score: 0,
        });
        setProfileForm({
          gym_name: myProfileData.gym_name || "",
          goals: myProfileData.goals || [],
          preferred_workout_times: myProfileData.preferred_workout_times || [],
          experience_level: myProfileData.experience_level || "intermediate",
          looking_for_buddy: myProfileData.looking_for_buddy ?? true,
          bio: myProfileData.bio || "",
        });
      }

      // Fetch potential buddies
      const { data: buddiesData } = await supabase
        .from('buddy_profiles')
        .select('*')
        .eq('looking_for_buddy', true)
        .neq('user_id', user.id);

      if (buddiesData) {
        const userIds = buddiesData.map(b => b.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        const formattedBuddies: BuddyProfile[] = buddiesData.map(buddy => {
          const profile = profilesMap.get(buddy.user_id);
          // Calculate match score based on common goals and times
          let matchScore = 0;
          if (myProfileData) {
            const commonGoals = (buddy.goals || []).filter((g: string) => (myProfileData.goals || []).includes(g)).length;
            const commonTimes = (buddy.preferred_workout_times || []).filter((t: string) => (myProfileData.preferred_workout_times || []).includes(t)).length;
            const sameGym = buddy.gym_name && myProfileData.gym_name && 
              buddy.gym_name.toLowerCase() === myProfileData.gym_name.toLowerCase();
            
            matchScore = commonGoals * 25 + commonTimes * 20 + (sameGym ? 30 : 0);
          }

          return {
            id: buddy.id,
            user_id: buddy.user_id,
            gym_name: buddy.gym_name,
            goals: buddy.goals || [],
            preferred_workout_times: buddy.preferred_workout_times || [],
            experience_level: buddy.experience_level || 'intermediate',
            looking_for_buddy: buddy.looking_for_buddy,
            bio: buddy.bio,
            user_name: profile?.display_name || 'Unknown',
            user_avatar: profile?.avatar_url || null,
            match_score: matchScore,
          };
        }).sort((a, b) => b.match_score - a.match_score);

        setPotentialBuddies(formattedBuddies);
      }

      // Fetch matches
      const { data: matchesData } = await supabase
        .from('buddy_matches')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (matchesData) {
        const otherUserIds = matchesData.map(m => 
          m.requester_id === user.id ? m.receiver_id : m.requester_id
        );
        
        const { data: matchProfilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', otherUserIds);

        const matchProfilesMap = new Map(matchProfilesData?.map(p => [p.user_id, p]) || []);

        const formattedMatches: BuddyMatch[] = matchesData.map(match => {
          const isRequester = match.requester_id === user.id;
          const otherUserId = isRequester ? match.receiver_id : match.requester_id;
          const otherProfile = matchProfilesMap.get(otherUserId);

          return {
            id: match.id,
            requester_id: match.requester_id,
            receiver_id: match.receiver_id,
            status: match.status,
            other_user_name: otherProfile?.display_name || 'Unknown',
            other_user_avatar: otherProfile?.avatar_url || null,
            is_requester: isRequester,
          };
        });

        setMatches(formattedMatches);
      }
    } catch (error) {
      console.error('Error fetching buddy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const profileData = {
        user_id: user.id,
        gym_name: profileForm.gym_name || null,
        goals: profileForm.goals,
        preferred_workout_times: profileForm.preferred_workout_times,
        experience_level: profileForm.experience_level,
        looking_for_buddy: profileForm.looking_for_buddy,
        bio: profileForm.bio || null,
        updated_at: new Date().toISOString(),
      };

      if (myProfile) {
        const { error } = await supabase
          .from('buddy_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('buddy_profiles')
          .insert(profileData);
        if (error) throw error;
      }

      toast.success("Profiel opgeslagen!");
      setProfileDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Kon profiel niet opslaan");
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('buddy_matches').insert({
        requester_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
      });

      if (error) throw error;

      toast.success("Verzoek verzonden! 🤝");
      fetchData();
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error("Kon verzoek niet verzenden");
    }
  };

  const handleRespondToRequest = async (matchId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('buddy_matches')
        .update({ 
          status: accept ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (error) throw error;

      toast.success(accept ? "Buddy toegevoegd! 💪" : "Verzoek afgewezen");
      fetchData();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error("Kon niet reageren op verzoek");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleGoal = (goal: string) => {
    setProfileForm(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const toggleTime = (time: string) => {
    setProfileForm(prev => ({
      ...prev,
      preferred_workout_times: prev.preferred_workout_times.includes(time)
        ? prev.preferred_workout_times.filter(t => t !== time)
        : [...prev.preferred_workout_times, time],
    }));
  };

  const pendingRequests = matches.filter(m => m.status === 'pending' && !m.is_requester);
  const acceptedBuddies = matches.filter(m => m.status === 'accepted');
  const sentRequests = matches.filter(m => m.status === 'pending' && m.is_requester);

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
          <Users className="w-5 h-5 text-primary" />
          Training Buddy
        </h3>
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Settings className="w-4 h-4" />
              Profiel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buddy Profiel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Zoek een buddy</Label>
                <Switch
                  checked={profileForm.looking_for_buddy}
                  onCheckedChange={(checked) => setProfileForm({ ...profileForm, looking_for_buddy: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Gym / Sportschool</Label>
                <Input
                  placeholder="Bijv. Basic-Fit Amsterdam"
                  value={profileForm.gym_name}
                  onChange={(e) => setProfileForm({ ...profileForm, gym_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Doelen</Label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(goal => (
                    <Badge
                      key={goal.value}
                      variant={profileForm.goals.includes(goal.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleGoal(goal.value)}
                    >
                      {goal.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Voorkeurstijden</Label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_TIMES.map(time => (
                    <Badge
                      key={time.value}
                      variant={profileForm.preferred_workout_times.includes(time.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTime(time.value)}
                    >
                      {time.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ervaring</Label>
                <Select
                  value={profileForm.experience_level}
                  onValueChange={(value) => setProfileForm({ ...profileForm, experience_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Over jezelf</Label>
                <Textarea
                  placeholder="Vertel iets over je trainingen..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                Opslaan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Verzoeken</h4>
          {pendingRequests.map(request => (
            <div key={request.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  {request.other_user_avatar && <AvatarImage src={request.other_user_avatar} />}
                  <AvatarFallback className="text-xs">{getInitials(request.other_user_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{request.other_user_name}</span>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleRespondToRequest(request.id, true)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleRespondToRequest(request.id, false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Buddies */}
      {acceptedBuddies.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Mijn Buddies</h4>
          <div className="flex flex-wrap gap-2">
            {acceptedBuddies.map(buddy => (
              <div key={buddy.id} className="flex items-center gap-2 p-2 border rounded-lg">
                <Avatar className="w-8 h-8">
                  {buddy.other_user_avatar && <AvatarImage src={buddy.other_user_avatar} />}
                  <AvatarFallback className="text-xs">{getInitials(buddy.other_user_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{buddy.other_user_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Find Buddies */}
      {!myProfile ? (
        <div className="text-center py-6 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Vul je buddy profiel in om matches te vinden</p>
          <Button 
            size="sm" 
            className="mt-2"
            onClick={() => setProfileDialogOpen(true)}
          >
            Profiel Maken
          </Button>
        </div>
      ) : potentialBuddies.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>Geen matches gevonden</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Suggesties</h4>
          {potentialBuddies.slice(0, 3).map(buddy => {
            const alreadyRequested = sentRequests.some(r => r.receiver_id === buddy.user_id);
            const alreadyMatched = acceptedBuddies.some(b => 
              b.requester_id === buddy.user_id || b.receiver_id === buddy.user_id
            );

            if (alreadyMatched) return null;

            return (
              <div key={buddy.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar>
                  {buddy.user_avatar && <AvatarImage src={buddy.user_avatar} />}
                  <AvatarFallback>{getInitials(buddy.user_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{buddy.user_name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {buddy.gym_name && (
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {buddy.gym_name}
                      </Badge>
                    )}
                    {buddy.match_score > 50 && (
                      <Badge variant="secondary" className="text-xs">
                        {buddy.match_score}% match
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={alreadyRequested ? "outline" : "default"}
                  disabled={alreadyRequested}
                  onClick={() => handleSendRequest(buddy.user_id)}
                >
                  {alreadyRequested ? "Verzonden" : "Connect"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
