import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MediaUploadZone } from "@/components/media/MediaUploadZone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
}

interface Post {
  id: string;
  content: string;
  media_id: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  likes_count: number;
  program_id: string | null;
  reactions: {
    '💪': { count: number; userReacted: boolean };
    '🔥': { count: number; userReacted: boolean };
    '👏': { count: number; userReacted: boolean };
  };
  comments: Comment[];
  comments_count: number;
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
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const programMapping: Record<string, string> = {
    strength: "strength-program",
    hyrox: "hyrox-program",
    run: "running-program",
  };

  useEffect(() => {
    fetchPosts();
    
    // Subscribe to new posts and comments
    const postsChannel = supabase
      .channel('community-posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('post-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [activeTab]);

  const fetchPosts = async () => {
    // First fetch posts
    const { data: postsData, error: postsError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('program_id', programMapping[activeTab])
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      return;
    }

    // Fetch user profiles
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Fetch media for posts that have media_id
    const mediaIds = postsData.filter(p => p.media_id).map(p => p.media_id);
    let mediaMap = new Map();
    
    if (mediaIds.length > 0) {
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .in('id', mediaIds);
      
      mediaMap = new Map(mediaData?.map(m => [m.id, m]) || []);
    }

    // Fetch reactions for all posts
    const postIds = postsData.map(p => p.id);
    const { data: reactionsData } = await supabase
      .from('post_reactions')
      .select('*')
      .in('post_id', postIds);

    // Fetch comments for all posts
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('*')
      .in('post_id', postIds)
      .order('created_at', { ascending: true });

    // Fetch profiles for comment authors
    const commentUserIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
    let commentProfilesMap = new Map();
    
    if (commentUserIds.length > 0) {
      const { data: commentProfilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', commentUserIds);
      
      commentProfilesMap = new Map(commentProfilesData?.map(p => [p.user_id, p]) || []);
    }

    // Group comments by post
    const commentsMap = new Map<string, Comment[]>();
    commentsData?.forEach(comment => {
      const profile = commentProfilesMap.get(comment.user_id);
      const formattedComment: Comment = {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        user_name: profile?.display_name || 'Unknown',
        user_avatar: profile?.avatar_url || null,
      };
      
      if (!commentsMap.has(comment.post_id)) {
        commentsMap.set(comment.post_id, []);
      }
      commentsMap.get(comment.post_id)?.push(formattedComment);
    });

    // Group reactions by post
    const reactionsMap = new Map<string, any[]>();
    reactionsData?.forEach(reaction => {
      if (!reactionsMap.has(reaction.post_id)) {
        reactionsMap.set(reaction.post_id, []);
      }
      reactionsMap.get(reaction.post_id)?.push(reaction);
    });

    const formattedPosts: Post[] = postsData.map((post) => {
      const profile = profilesMap.get(post.user_id);
      const media = post.media_id ? mediaMap.get(post.media_id) : null;
      const postReactions = reactionsMap.get(post.id) || [];
      const postComments = commentsMap.get(post.id) || [];
      
      // Count reactions by emoji type
      const reactions = {
        '💪': { 
          count: postReactions.filter(r => r.emoji_type === '💪').length,
          userReacted: postReactions.some(r => r.emoji_type === '💪' && r.user_id === user?.id)
        },
        '🔥': { 
          count: postReactions.filter(r => r.emoji_type === '🔥').length,
          userReacted: postReactions.some(r => r.emoji_type === '🔥' && r.user_id === user?.id)
        },
        '👏': { 
          count: postReactions.filter(r => r.emoji_type === '👏').length,
          userReacted: postReactions.some(r => r.emoji_type === '👏' && r.user_id === user?.id)
        },
      };
      
      return {
        id: post.id,
        content: post.content || '',
        media_id: post.media_id,
        media_url: media?.file_path 
          ? supabase.storage.from(media.bucket_name).getPublicUrl(media.file_path).data.publicUrl
          : null,
        media_type: media?.mime_type || null,
        created_at: post.created_at,
        user_id: post.user_id,
        user_name: profile?.display_name || 'Unknown',
        user_avatar: profile?.avatar_url || null,
        likes_count: post.likes_count || 0,
        program_id: post.program_id,
        reactions,
        comments: postComments,
        comments_count: postComments.length,
      };
    });

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

  const handleReaction = async (postId: string, emoji: '💪' | '🔥' | '👏') => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const userReacted = post.reactions[emoji].userReacted;

    try {
      if (userReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('emoji_type', emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            emoji_type: emoji,
          });

        if (error) throw error;
      }

      // Refresh posts to get updated reactions
      fetchPosts();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error("Fout bij verwerken van reactie");
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || !user) return;

    setSubmittingComment(postId);
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content,
        });

      if (error) throw error;

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      toast.success("Reactie geplaatst!");
      
      // Make sure comments are expanded after posting
      setExpandedComments(prev => new Set(prev).add(postId));
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error("Fout bij plaatsen van reactie");
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Reactie verwijderd");
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Fout bij verwijderen van reactie");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Kleedkamer Talk</h1>
        <p className="text-muted-foreground mb-6">Deel je successen, stel vragen en motiveer elkaar</p>

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
                placeholder="Deel je PR, stel een vraag, of moedig een teamgenoot aan..."
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
                  <p className="text-muted-foreground">De kleedkamer is nog stil... Trap af! 💪</p>
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate">{post.user_name}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: nl })}
                          </span>
                        </div>
                        
                        {post.content && <p className="text-sm mb-3 break-words">{post.content}</p>}
                        
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
                        
                        {/* Reactions and Comments Row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {(['💪', '🔥', '👏'] as const).map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReaction(post.id, emoji)}
                              className={`gap-1 h-8 px-2 transition-colors ${
                                post.reactions[emoji].userReacted 
                                  ? 'bg-accent/20 text-accent hover:bg-accent/30' 
                                  : 'text-muted-foreground hover:text-accent hover:bg-accent/10'
                              }`}
                            >
                              <span className="text-base">{emoji}</span>
                              {post.reactions[emoji].count > 0 && (
                                <span className="text-xs font-semibold">{post.reactions[emoji].count}</span>
                              )}
                            </Button>
                          ))}
                          
                          {/* Comments Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComments(post.id)}
                            className="gap-1 h-8 px-2 text-muted-foreground hover:text-accent hover:bg-accent/10"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count > 0 && (
                              <span className="text-xs font-semibold">{post.comments_count}</span>
                            )}
                            {expandedComments.has(post.id) ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        </div>

                        {/* Comments Section */}
                        <Collapsible open={expandedComments.has(post.id)}>
                          <CollapsibleContent className="mt-3 space-y-3">
                            {/* Existing Comments */}
                            {post.comments.length > 0 && (
                              <div className="space-y-2 border-l-2 border-muted pl-3">
                                {post.comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-2 group">
                                    <Avatar className="w-6 h-6">
                                      {comment.user_avatar && <AvatarImage src={comment.user_avatar} />}
                                      <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">
                                        {getInitials(comment.user_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold">{comment.user_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: nl })}
                                        </span>
                                        {comment.user_id === user?.id && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* New Comment Input */}
                            <div className="flex gap-2 items-center">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">
                                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="Schrijf een reactie..."
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs(prev => ({ 
                                    ...prev, 
                                    [post.id]: e.target.value 
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleCommentSubmit(post.id);
                                    }
                                  }}
                                  className="h-8 text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleCommentSubmit(post.id)}
                                  disabled={!commentInputs[post.id]?.trim() || submittingComment === post.id}
                                  className="h-8 px-3 bg-accent hover:bg-accent/90"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
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
