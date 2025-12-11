import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, UserPlus, Loader2, Mail, Shield, Settings, Calendar, GripVertical } from "lucide-react";
import { InviteMemberDialog } from "@/components/admin/InviteMemberDialog";
import { MemberManagementDialog } from "@/components/admin/MemberManagementDialog";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { Checkbox } from "@/components/ui/checkbox";
import CoachWeeklyOverview from "@/components/admin/CoachWeeklyOverview";
import CoachDragDropCalendar from "@/components/admin/CoachDragDropCalendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const createMemberSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
}

interface ProfileWithEmail extends Profile {
  email: string;
  coach_id?: string | null;
  coach_name?: string | null;
}

interface Coach {
  id: string;
  user_id: string;
  display_name: string | null;
}

const AdminMembers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [managingMember, setManagingMember] = useState<{ id: string; userId: string } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: pendingMembers = [], isLoading: pendingLoading } = useQuery<ProfileWithEmail[]>({
    queryKey: ["pending-members"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (profiles as ProfileWithEmail[]) || [];
    },
  });

  const { data: approvedMembers = [], isLoading: approvedLoading } = useQuery<ProfileWithEmail[]>({
    queryKey: ["approved-members"],
    queryFn: async () => {
      // Get member profiles with coach info
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          coach:coach_id (
            id,
            display_name
          )
        `)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (profiles as any[])?.map((profile) => ({
        ...profile,
        coach_name: profile.coach?.display_name || null,
      })) || [];
    },
  });

  const { data: coaches = [] } = useQuery<Coach[]>({
    queryKey: ["coaches"],
    queryFn: async () => {
      // Get all users with coach or admin role
      const { data: coachRoles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["coach", "admin"]);

      if (error) throw error;

      const coachUserIds = coachRoles?.map(r => r.user_id) || [];

      if (coachUserIds.length === 0) return [];

      const { data: coachProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, display_name")
        .in("user_id", coachUserIds);

      if (profilesError) throw profilesError;

      return coachProfiles || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Member Approved",
        description: "The member can now access the app.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["approved-members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "rejected",
          rejection_reason: "Rejected by coach",
        })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Member Rejected",
        description: "The member has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignCoachMutation = useMutation({
    mutationFn: async ({ memberId, coachId }: { memberId: string; coachId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ coach_id: coachId })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coach toegewezen aan member",
      });
      queryClient.invalidateQueries({ queryKey: ["approved-members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  const handleCreateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const displayName = formData.get("displayName") as string;
    const password = formData.get("password") as string;

    const validation = createMemberSchema.safeParse({ email, displayName, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      setCreateLoading(false);
      return;
    }

    try {
      // Create user via admin API
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
        },
      });

      if (signUpError) throw signUpError;

      // Create profile (will be auto-created by trigger, but we can ensure it's there)
      // and immediately approve since coach created it
      await supabase
        .from("profiles")
        .upsert({
          user_id: newUser.user.id,
          display_name: displayName,
          approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        });

      toast({
        title: "Success",
        description: `Member account created for ${email}`,
      });

      queryClient.invalidateQueries({ queryKey: ["approved-members"] });
      setIsCreating(false);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Member Management</h1>
            <p className="text-muted-foreground">Approve or reject member requests</p>
          </div>
          <div className="flex gap-2">
            <InviteMemberDialog />
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Direct Account
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateMember} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="member@example.com"
                    required
                    disabled={createLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="John Doe"
                    required
                    disabled={createLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    required
                    disabled={createLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this password securely with the member
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={createLoading}>
                  {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Member Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">
              <Calendar className="h-4 w-4 mr-2" />
              Week Overzicht
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <GripVertical className="h-4 w-4 mr-2" />
              Kalender
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingMembers.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedMembers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CoachWeeklyOverview />
          </TabsContent>

          <TabsContent value="calendar">
            <CoachDragDropCalendar />
          </TabsContent>

          <TabsContent value="pending">
            {pendingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingMembers.length === 0 ? (
              <Card className="p-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
                <p className="text-muted-foreground">
                  All member requests have been processed
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingMembers.map((member) => (
                  <Card key={member.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {member.display_name || "No Name"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {member.email}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Requested: {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(member.user_id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate(member.user_id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            <BulkActionToolbar
              selectedMembers={selectedMembers.map((id) => {
                const member = approvedMembers.find((m) => m.id === id);
                return {
                  id,
                  user_id: member?.user_id || "",
                  display_name: member?.display_name || null,
                };
              })}
              onClearSelection={clearSelection}
            />

            {approvedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : approvedMembers.length === 0 ? (
              <Card className="p-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Approved Members</h3>
                <p className="text-muted-foreground">
                  Approved members will appear here
                </p>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 p-3 border rounded-lg bg-muted/50">
                  <Checkbox
                    checked={selectedMembers.length === approvedMembers.length && approvedMembers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMembers(approvedMembers.map((m) => m.id));
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                  />
                  <Label className="text-sm font-medium cursor-pointer">
                    Selecteer alle members
                  </Label>
                </div>
              <div className="grid gap-4">
                {approvedMembers.map((member) => (
                  <Card key={member.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={() => toggleMemberSelection(member.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {member.display_name || "No Name"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {member.email}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Approved: {member.approved_at ? new Date(member.approved_at).toLocaleDateString() : "N/A"}
                        </p>
                        
                        <div className="mt-4">
                          <Label className="text-sm">Toegewezen Coach</Label>
                          <Select
                            value={member.coach_id || "none"}
                            onValueChange={(value) => {
                              assignCoachMutation.mutate({
                                memberId: member.id,
                                coachId: value === "none" ? null : value,
                              });
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecteer een coach" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Geen coach</SelectItem>
                              {coaches.map((coach) => (
                                <SelectItem key={coach.id} value={coach.id}>
                                  {coach.display_name || "Naamloos"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {member.coach_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Huidige coach: {member.coach_name}
                            </p>
                          )}
                        </div>
                      </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setManagingMember({ id: member.id, userId: member.user_id })}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Beheer
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          Active
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {managingMember && (
        <MemberManagementDialog
          open={!!managingMember}
          onOpenChange={(open) => !open && setManagingMember(null)}
          memberId={managingMember.id}
          memberUserId={managingMember.userId}
        />
      )}
    </div>
  );
};

export default AdminMembers;