import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Heart, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaUploadZone } from "@/components/media/MediaUploadZone";

const mockMessages = [
  {
    id: "1",
    userName: "Sarah M.",
    userInitials: "SM",
    message: "Just hit a new PR on deadlifts! 140kg x 5 💪",
    timestamp: "2 hours ago",
    likes: 12,
  },
  {
    id: "2",
    userName: "Mike D.",
    userInitials: "MD",
    message: "Anyone else struggling with the tempo squats today? My legs are on fire 🔥",
    timestamp: "4 hours ago",
    likes: 8,
  },
  {
    id: "3",
    userName: "Emma L.",
    userInitials: "EL",
    message: "Week 3 complete! Loving the program so far. Feeling stronger every day 💯",
    timestamp: "1 day ago",
    likes: 15,
  },
];

const Community = () => {
  const [message, setMessage] = useState("");
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>("");
  const [uploadedMediaType, setUploadedMediaType] = useState<string>("");

  const handleSend = () => {
    if (!message.trim()) return;
    toast.success("Message posted!");
    setMessage("");
    setUploadedMediaUrl("");
    setUploadedMediaType("");
  };

  const handleMediaUpload = (mediaId: string, publicUrl: string, mediaType?: string) => {
    setUploadedMediaUrl(publicUrl);
    setUploadedMediaType(mediaType || "");
    setShowMediaDialog(false);
    toast.success("Media attached!");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Community</h1>
        <p className="text-muted-foreground mb-6">Connect with other athletes</p>

        <Tabs defaultValue="strength" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="strength">Strength</TabsTrigger>
            <TabsTrigger value="hyrox">Hyrox</TabsTrigger>
            <TabsTrigger value="run">Run</TabsTrigger>
          </TabsList>

          <TabsContent value="strength" className="space-y-4">
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
                      <Video className="w-4 h-4" />
                      Photo/Video
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Photo or Video</DialogTitle>
                    </DialogHeader>
                    <MediaUploadZone
                      bucket="community-uploads"
                      accept="all"
                      aspectRatio="1:1"
                      onUploadComplete={handleMediaUpload}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={handleSend}
                  className="ml-auto bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                  Post
                </Button>
              </div>
            </Card>

            {/* Messages Feed */}
            <div className="space-y-4">
              {mockMessages.map((msg) => (
                <Card key={msg.id} className="p-4">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                        {msg.userInitials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{msg.userName}</span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm mb-3">{msg.message}</p>
                      
                      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-accent">
                        <Heart className="w-4 h-4" />
                        {msg.likes}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hyrox" className="space-y-4">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No messages yet. Be the first to post!</p>
            </Card>
          </TabsContent>

          <TabsContent value="run" className="space-y-4">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No messages yet. Be the first to post!</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
