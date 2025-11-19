import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Image as ImageIcon, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
  media_type: string | null;
  media_url: string | null;
}

interface Member {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const CoachChat = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !memberId) return;
    fetchMemberAndMessages();
  }, [user, memberId]);

  useEffect(() => {
    if (!coachProfile || !member) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('coach_chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `member_id=eq.${member.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message]);
            scrollToBottom();
            
            // Mark as read if sender is not me
            if (payload.new.sender_id !== user!.id) {
              setTimeout(() => markAsRead(), 500);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coachProfile, member]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMemberAndMessages = async () => {
    try {
      setLoading(true);

      // Get coach's profile
      const { data: coachData, error: coachError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("user_id", user!.id)
        .single();

      if (coachError) throw coachError;
      setCoachProfile(coachData);

      // Get member's profile and verify they're assigned to this coach
      const { data: memberData, error: memberError } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, coach_id")
        .eq("id", memberId)
        .single();

      if (memberError) throw memberError;

      if (memberData.coach_id !== coachData.id) {
        toast({
          title: "Geen toegang",
          description: "Deze member is niet aan jou toegewezen.",
          variant: "destructive",
        });
        navigate("/coach/dashboard");
        return;
      }

      setMember(memberData);

      // Fetch existing messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("member_id", memberId)
        .eq("coach_id", coachData.id)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
      
      // Count and mark unread messages
      const unread = messagesData?.filter(
        m => !m.read_at && m.sender_id !== user!.id
      ).length || 0;
      setUnreadCount(unread);

      // Mark messages as read
      await markAsRead();

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

  const markAsRead = async () => {
    if (!coachProfile || !member) return;
    
    await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("member_id", member.id)
      .eq("coach_id", coachProfile.id)
      .is("read_at", null)
      .neq("sender_id", user!.id);
      
    setUnreadCount(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    
    if (![...validImageTypes, ...validVideoTypes].includes(file.type)) {
      toast({
        title: "Ongeldig bestand",
        description: "Upload alleen afbeeldingen (JPG, PNG, WEBP, GIF) of video's (MP4, MOV, WEBM)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Bestand te groot",
        description: "Upload bestanden kleiner dan 20MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload mislukt",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !coachProfile || !member || sending) return;

    try {
      setSending(true);

      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (selectedFile) {
        mediaUrl = await uploadMedia(selectedFile);
        if (!mediaUrl) {
          setSending(false);
          return;
        }
        mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      const { error } = await supabase.from("chat_messages").insert({
        member_id: member.id,
        coach_id: coachProfile.id,
        sender_id: user!.id,
        message: newMessage.trim() || (mediaType === 'image' ? '📷 Afbeelding' : '🎥 Video'),
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;

      setNewMessage("");
      clearSelectedFile();
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

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Member niet gevonden</h2>
          <Button onClick={() => navigate("/coach/dashboard")}>
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
            onClick={() => navigate("/coach/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback>
              {member.display_name?.[0]?.toUpperCase() || "M"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-semibold">
              {member.display_name || "Member"}
            </h1>
            <p className="text-xs text-muted-foreground">Jouw member</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
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
                    className={`max-w-[75%] rounded-2xl overflow-hidden ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.media_url && (
                      <div className="p-0">
                        {msg.media_type === 'image' ? (
                          <img
                            src={msg.media_url}
                            alt="Shared image"
                            className="w-full max-w-xs rounded-t-2xl"
                          />
                        ) : (
                          <video
                            src={msg.media_url}
                            controls
                            className="w-full max-w-xs rounded-t-2xl"
                          />
                        )}
                      </div>
                    )}
                    <div className="px-4 py-2">
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
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card p-4">
        {previewUrl && (
          <div className="mb-3 relative inline-block">
            <div className="relative">
              {selectedFile?.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-32 rounded-lg"
                />
              ) : (
                <video
                  src={previewUrl}
                  className="max-h-32 rounded-lg"
                />
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={clearSelectedFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Typ een bericht..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || (!newMessage.trim() && !selectedFile)}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CoachChat;
