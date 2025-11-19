import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

interface CoachInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchCoachAndMessages();
  }, [user]);

  useEffect(() => {
    if (!memberProfile || !coach) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `member_id=eq.${memberProfile.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberProfile, coach]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchCoachAndMessages = async () => {
    try {
      setLoading(true);

      // Get member's profile and coach
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, coach_id, coach:coach_id(id, display_name, avatar_url, user_id)")
        .eq("user_id", user!.id)
        .single();

      if (profileError) throw profileError;

      if (!profile.coach_id) {
        toast({
          title: "Geen coach",
          description: "Je hebt nog geen coach toegewezen.",
          variant: "destructive",
        });
        navigate("/account");
        return;
      }

      setMemberProfile(profile);
      setCoach(profile.coach as any);

      // Fetch existing messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("member_id", profile.id)
        .eq("coach_id", profile.coach_id)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
      
      // Mark unread messages as read
      await supabase
        .from("chat_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("member_id", profile.id)
        .is("read_at", null)
        .neq("sender_id", user!.id);

    } catch (error: any) {
      console.error("Error fetching chat:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !memberProfile || !coach || sending) return;

    try {
      setSending(true);

      const { error } = await supabase.from("chat_messages").insert({
        member_id: memberProfile.id,
        coach_id: coach.id,
        sender_id: user!.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Geen coach toegewezen</h2>
          <p className="text-muted-foreground mb-4">
            Je hebt nog geen coach. Neem contact op met de admin.
          </p>
          <Button onClick={() => navigate("/account")}>
            Ga terug
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/account")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src={coach.avatar_url || undefined} />
            <AvatarFallback>
              {coach.display_name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">
              {coach.display_name || "Coach"}
            </h1>
            <p className="text-xs text-muted-foreground">Jouw coach</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nog geen berichten. Start een gesprek!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user!.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Typ een bericht..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
