import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Copy, Check, Mail, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export const InviteMemberDialog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get coach's profile id
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Get existing invitations
  const { data: invitations = [], refetch } = useQuery({
    queryKey: ["invitations", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("coach_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const handleInvite = async () => {
    if (!user) {
      toast.error("Je moet ingelogd zijn om een uitnodiging te versturen");
      return;
    }
    if (!profile?.id) {
      toast.error("Je profiel kon niet worden geladen. Probeer de pagina te vernieuwen.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Vul een geldig e-mailadres in");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("invitations").insert({
        coach_id: profile.id,
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;

      toast.success(`Uitnodiging aangemaakt voor ${email}`);
      setEmail("");
      refetch();
    } catch (error: any) {
      toast.error("Fout bij aanmaken uitnodiging: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Uitnodiging verwijderd");
      refetch();
    } catch (error: any) {
      toast.error("Fout bij verwijderen: " + error.message);
    }
  };

  const copyInviteLink = (token: string, id: string) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(id);
    toast.success("Link gekopieerd!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    if (status === "accepted") {
      return <Badge variant="default" className="bg-green-500">Geaccepteerd</Badge>;
    }
    if (new Date(expiresAt) < new Date()) {
      return <Badge variant="destructive">Verlopen</Badge>;
    }
    return <Badge variant="secondary">In afwachting</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Lid Uitnodigen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nieuw Lid Uitnodigen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* New invitation form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mailadres</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="voorbeeld@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
                <Button onClick={handleInvite} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                De uitgenodigde persoon wordt automatisch goedgekeurd en aan jou gekoppeld als coach.
              </p>
            </div>
          </div>

          {/* Existing invitations */}
          {invitations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Uitnodigingen</h4>
              <div className="space-y-2">
                {invitations.map((invitation: any) => (
                  <Card key={invitation.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invitation.created_at), "d MMM yyyy", { locale: nl })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invitation.status, invitation.expires_at)}
                        {invitation.status === "pending" && new Date(invitation.expires_at) > new Date() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyInviteLink(invitation.token, invitation.id)}
                          >
                            {copiedId === invitation.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(invitation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
