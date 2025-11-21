import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaUploadZone } from "@/components/media/MediaUploadZone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  content: string;
  media_id: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  likes_count: number;
  program_id: string | null;
}

const Community = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [uploadedMediaId, setUploadedMediaId] = useState<string>("");
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>("");
  const [uploadedMediaType, setUploadedMediaType] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState("strength");
  const [loading, setLoading] = useState(false);

  const programMapping: Record<string, string> = {
    strength: "strength-program",
    hyrox: "hyrox-program",
    run: "running-program",
  };

  useEffect(() => {
    fetchPosts();
    
    // Subscribe to new posts
    const channel = supabase
      .channel('community-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        content,
        media_id,
        created_at,
        likes_count,
        program_id,
        user_id,
        media:media_id (
          file_path,
          bucket_name,
          mime_type
        ),
        profiles!inner (
          display_name,
          avatar_url
        )
      `)
      .eq('program_id', programMapping[activeTab])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    const formattedPosts: Post[] = (data || []).map((post: any) => ({
      id: post.id,
      content: post.content || '',
      media_id: post.media_id,
      media_url: post.media?.file_path 
        ? supabase.storage.from(post.media.bucket_name).getPublicUrl(post.media.file_path).data.publicUrl
        : null,
      media_type: post.media?.mime_type || null,
      created_at: post.created_at,
      user_name: post.profiles?.display_name || 'Unknown',
      user_avatar: post.profiles?.avatar_url || null,
      likes_count: post.likes_count || 0,
      program_id: post.program_id,
    }));

    setPosts(formattedPosts);
  };

  const handleSend = async () => {
    if (!message.trim() && !uploadedMediaId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user?.id,
          content: message.trim() || null,
          media_id: uploadedMediaId || null,
          program_id: programMapping[activeTab],
          post_type: uploadedMediaType?.startsWith('video') ? 'video' : 'image',
        });

      if (error) throw error;

      toast.success("Post geplaatst!");
      setMessage("");
      setUploadedMediaId("");
      setUploadedMediaUrl("");
      setUploadedMediaType("");
      fetchPosts();
    } catch (error) {
      console.error('Error posting:', error);
      toast.error("Fout bij plaatsen van post");
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = (mediaId: string, publicUrl: string, mediaType?: string) => {
    setUploadedMediaId(mediaId);
    setUploadedMediaUrl(publicUrl);
    setUploadedMediaType(mediaType || "");
    setShowMediaDialog(false);
    toast.success("Media bijgevoegd!");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Community</h1>
        <p className="text-muted-foreground mb-6">Connect with other athletes</p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="strength">Strength</TabsTrigger>
            <TabsTrigger value="hyrox">Hyrox</TabsTrigger>
            <TabsTrigger value="run">Run</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Message Input */}
            <Card className="p-4">
              <Textarea
                placeholder="Share your progress, ask questions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none mb-3"
                rows={3}
              />
              {uploadedMediaUrl && (
                <div className="mb-3 relative">
                  {uploadedMediaType?.startsWith("video") ? (
                    <video
                      src={uploadedMediaUrl}
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={uploadedMediaUrl}
                      alt="Uploaded media"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setUploadedMediaUrl("");
                      setUploadedMediaType("");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      Foto/Video
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Foto of Video</DialogTitle>
                    </DialogHeader>
                    <MediaUploadZone
                      bucket="community-uploads"
                      accept="all"
                      onUploadComplete={handleMediaUpload}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="ml-auto bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Plaatsen..." : "Post"}
                </Button>
              </div>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nog geen posts. Wees de eerste om te posten!</p>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="p-4">
                    <div className="flex gap-3">
                      <Avatar>
                        {post.user_avatar && <AvatarImage src={post.user_avatar} />}
                        <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                          {getInitials(post.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{post.user_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {post.content && <p className="text-sm mb-3">{post.content}</p>}
                        
                        {post.media_url && (
                          <div className="mb-3">
                            {post.media_type?.startsWith('video') ? (
                              <video
                                src={post.media_url}
                                controls
                                className="w-full max-h-96 object-cover rounded-lg"
                              />
                            ) : (
                              <img
                                src={post.media_url}
                                alt="Post media"
                                className="w-full max-h-96 object-cover rounded-lg"
                              />
                            )}
                          </div>
                        )}
                        
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-accent">
                          <Heart className="w-4 h-4" />
                          {post.likes_count}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
