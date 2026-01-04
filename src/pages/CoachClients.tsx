import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

const CoachClients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "archived">("active");

  // First get the coach's profile id
  const { data: coachProfile } = useQuery({
    queryKey: ["coach-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["coach-clients", coachProfile?.id],
    queryFn: async () => {
      if (!coachProfile?.id) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          display_name,
          avatar_url,
          approval_status,
          updated_at
        `)
        .eq("coach_id", coachProfile.id)
        .eq("approval_status", "approved");

      if (error) throw error;
      return data || [];
    },
    enabled: !!coachProfile?.id,
  });

  const filteredMembers = members.filter((member) =>
    member.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clients</h1>
          <Button variant="ghost" size="icon">
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "active"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("archived")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "archived"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Archived
          </button>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clients found
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => navigate(`/coach/chat/${member.id}`)}
                className="flex items-center justify-between py-3 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent/20 text-accent">
                      {member.display_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.display_name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">
                      Last active {formatDistanceToNow(new Date(member.updated_at || new Date()), { 
                        addSuffix: true,
                        locale: nl 
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {formatDistanceToNow(new Date(member.updated_at || new Date()), { 
                    addSuffix: true,
                    locale: nl 
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CoachClients;
