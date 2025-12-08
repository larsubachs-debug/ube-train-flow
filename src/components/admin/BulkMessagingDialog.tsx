import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Member {
  member_id: string;
  member_user_id: string;
  member_name: string | null;
  member_avatar: string | null;
}

interface BulkMessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  preSelectedMembers?: string[];
}

export const BulkMessagingDialog = ({
  open,
  onOpenChange,
  members,
  preSelectedMembers = [],
}: BulkMessagingDialogProps) => {
  const { user } = useAuth();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(preSelectedMembers);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members.filter(
    (m) => m.member_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    setSelectedMemberIds(filteredMembers.map((m) => m.member_id));
  };

  const deselectAll = () => {
    setSelectedMemberIds([]);
  };

  const handleSend = async () => {
    if (!user || !message.trim() || selectedMemberIds.length === 0) return;

    setSending(true);
    try {
      // Get coach profile id
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coachProfile) throw new Error("Coach profile not found");

      // Create messages for all selected members
      const messages = selectedMemberIds.map((memberId) => ({
        coach_id: coachProfile.id,
        member_id: memberId,
        sender_id: user.id,
        message: message.trim(),
      }));

      const { error } = await supabase.from("chat_messages").insert(messages);

      if (error) throw error;

      toast.success(`Bericht verzonden naar ${selectedMemberIds.length} leden`);
      setMessage("");
      setSelectedMemberIds([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending bulk message:", error);
      toast.error("Kon berichten niet verzenden");
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Bericht ({selectedMemberIds.length} geselecteerd)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek leden..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All / Deselect All */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Selecteer alles
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselecteer alles
            </Button>
          </div>

          {/* Members List */}
          <ScrollArea className="flex-1 border rounded-lg max-h-[200px]">
            <div className="p-2 space-y-1">
              {filteredMembers.map((member) => (
                <div
                  key={member.member_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleMember(member.member_id)}
                >
                  <Checkbox
                    checked={selectedMemberIds.includes(member.member_id)}
                    onCheckedChange={() => toggleMember(member.member_id)}
                  />
                  <Avatar className="w-8 h-8">
                    {member.member_avatar && (
                      <AvatarImage src={member.member_avatar} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(member.member_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.member_name || "Onbekend"}</span>
                </div>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Geen leden gevonden
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Bericht</Label>
            <Textarea
              id="message"
              placeholder="Typ je bericht hier..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim() || selectedMemberIds.length === 0}
            className="w-full gap-2"
          >
            <Send className="w-4 h-4" />
            {sending
              ? "Verzenden..."
              : `Verstuur naar ${selectedMemberIds.length} leden`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
