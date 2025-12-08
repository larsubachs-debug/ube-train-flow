import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Users, TrendingUp, Dumbbell, Flame, Trophy, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MemberStats {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_workouts: number;
  total_volume: number;
  total_prs: number;
  current_streak: number;
  avg_rpe: number;
}

interface MemberComparisonProps {
  members: Array<{
    member_id: string;
    member_user_id: string;
    member_name: string | null;
    member_avatar: string | null;
  }>;
}

export const MemberComparison = ({ members }: MemberComparisonProps) => {
  const { user } = useAuth();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<"bar" | "radar">("bar");

  const handleAddMember = (userId: string) => {
    if (selectedMembers.length < 4 && !selectedMembers.includes(userId)) {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((id) => id !== userId));
  };

  useEffect(() => {
    if (selectedMembers.length > 0) {
      fetchMemberStats();
    } else {
      setMemberStats([]);
    }
  }, [selectedMembers]);

  const fetchMemberStats = async () => {
    setLoading(true);
    try {
      // Fetch stats for all selected members
      const { data: statsData, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .in("user_id", selectedMembers);

      if (statsError) throw statsError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", selectedMembers);

      if (profilesError) throw profilesError;

      // Fetch workout sets for volume and RPE
      const { data: setsData } = await supabase
        .from("workout_sets")
        .select("user_id, weight, reps, rpe")
        .in("user_id", selectedMembers)
        .eq("completed", true);

      // Calculate additional stats
      const statsMap = new Map(statsData?.map((s) => [s.user_id, s]) || []);
      const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

      // Group sets by user
      const userSets: Record<string, any[]> = {};
      setsData?.forEach((set) => {
        if (!userSets[set.user_id]) {
          userSets[set.user_id] = [];
        }
        userSets[set.user_id].push(set);
      });

      const formattedStats: MemberStats[] = selectedMembers.map((userId) => {
        const stats = statsMap.get(userId);
        const profile = profilesMap.get(userId);
        const sets = userSets[userId] || [];

        // Calculate total volume
        const totalVolume = sets.reduce(
          (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
          0
        );

        // Calculate average RPE
        const rpeValues = sets.filter((s) => s.rpe).map((s) => s.rpe);
        const avgRpe = rpeValues.length > 0
          ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
          : 0;

        return {
          user_id: userId,
          display_name: profile?.display_name || "Onbekend",
          avatar_url: profile?.avatar_url || null,
          total_workouts: stats?.total_workouts || 0,
          total_volume: Math.round(totalVolume / 1000), // Convert to tons
          total_prs: stats?.total_prs || 0,
          current_streak: stats?.current_streak || 0,
          avg_rpe: Math.round(avgRpe * 10) / 10,
        };
      });

      setMemberStats(formattedStats);
    } catch (error) {
      console.error("Error fetching member stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const barChartData = [
    {
      name: "Workouts",
      ...Object.fromEntries(
        memberStats.map((s) => [s.display_name, s.total_workouts])
      ),
    },
    {
      name: "PRs",
      ...Object.fromEntries(
        memberStats.map((s) => [s.display_name, s.total_prs])
      ),
    },
    {
      name: "Streak",
      ...Object.fromEntries(
        memberStats.map((s) => [s.display_name, s.current_streak])
      ),
    },
    {
      name: "Volume (ton)",
      ...Object.fromEntries(
        memberStats.map((s) => [s.display_name, s.total_volume])
      ),
    },
  ];

  const radarData = [
    { metric: "Workouts", fullMark: 100 },
    { metric: "PRs", fullMark: 50 },
    { metric: "Streak", fullMark: 30 },
    { metric: "Volume", fullMark: 100 },
    { metric: "Consistentie", fullMark: 100 },
  ];

  // Normalize data for radar chart
  const normalizedRadarData = radarData.map((item) => {
    const result: Record<string, any> = { metric: item.metric, fullMark: item.fullMark };
    memberStats.forEach((member) => {
      let value = 0;
      switch (item.metric) {
        case "Workouts":
          value = Math.min((member.total_workouts / 100) * 100, 100);
          break;
        case "PRs":
          value = Math.min((member.total_prs / 50) * 100, 100);
          break;
        case "Streak":
          value = Math.min((member.current_streak / 30) * 100, 100);
          break;
        case "Volume":
          value = Math.min((member.total_volume / 100) * 100, 100);
          break;
        case "Consistentie":
          value = member.avg_rpe > 0 ? Math.min(member.avg_rpe * 10, 100) : 50;
          break;
      }
      result[member.display_name] = value;
    });
    return result;
  });

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b"];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Leden Vergelijken
        </h3>
        {memberStats.length > 1 && (
          <div className="flex gap-2">
            <Button
              variant={viewType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("bar")}
            >
              Staafdiagram
            </Button>
            <Button
              variant={viewType === "radar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("radar")}
            >
              Radar
            </Button>
          </div>
        )}
      </div>

      {/* Member Selector */}
      <div className="mb-4">
        <Select onValueChange={handleAddMember}>
          <SelectTrigger>
            <SelectValue placeholder="Voeg lid toe om te vergelijken (max 4)" />
          </SelectTrigger>
          <SelectContent>
            {members
              .filter((m) => !selectedMembers.includes(m.member_user_id))
              .map((member) => (
                <SelectItem key={member.member_id} value={member.member_user_id}>
                  {member.member_name || "Onbekend"}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {memberStats.map((member, index) => (
            <Badge
              key={member.user_id}
              variant="secondary"
              className="flex items-center gap-2 pr-1"
              style={{ borderLeftColor: COLORS[index], borderLeftWidth: 3 }}
            >
              <Avatar className="w-5 h-5">
                {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                <AvatarFallback className="text-[10px]">
                  {getInitials(member.display_name)}
                </AvatarFallback>
              </Avatar>
              {member.display_name}
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5 ml-1"
                onClick={() => handleRemoveMember(member.user_id)}
              >
                ×
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : memberStats.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Selecteer leden om te vergelijken</p>
          </div>
        </div>
      ) : viewType === "bar" ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              {memberStats.map((member, index) => (
                <Bar
                  key={member.user_id}
                  dataKey={member.display_name}
                  fill={COLORS[index]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={normalizedRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" className="text-xs" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {memberStats.map((member, index) => (
                <Radar
                  key={member.user_id}
                  name={member.display_name}
                  dataKey={member.display_name}
                  stroke={COLORS[index]}
                  fill={COLORS[index]}
                  fillOpacity={0.3}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats Table */}
      {memberStats.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Lid</th>
                <th className="text-center py-2">
                  <Dumbbell className="w-4 h-4 mx-auto" />
                </th>
                <th className="text-center py-2">
                  <Trophy className="w-4 h-4 mx-auto" />
                </th>
                <th className="text-center py-2">
                  <Flame className="w-4 h-4 mx-auto" />
                </th>
                <th className="text-center py-2">
                  <TrendingUp className="w-4 h-4 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map((member, index) => (
                <tr key={member.user_id} className="border-b">
                  <td className="py-2 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    {member.display_name}
                  </td>
                  <td className="text-center">{member.total_workouts}</td>
                  <td className="text-center">{member.total_prs}</td>
                  <td className="text-center">{member.current_streak}</td>
                  <td className="text-center">{member.total_volume} ton</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
