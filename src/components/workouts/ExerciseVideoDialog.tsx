import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface ExerciseVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  videoUrl?: string;
}

// Helper to detect and convert YouTube/Vimeo URLs to embed format
const getEmbedUrl = (url: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } => {
  // YouTube patterns
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo patterns
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Direct video URL
  return { type: 'direct', embedUrl: url };
};

export const ExerciseVideoDialog = ({
  open,
  onOpenChange,
  exerciseName,
  videoUrl,
}: ExerciseVideoDialogProps) => {
  const videoInfo = useMemo(() => {
    if (!videoUrl) return null;
    return getEmbedUrl(videoUrl);
  }, [videoUrl]);

  if (!videoUrl || !videoInfo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{exerciseName}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative aspect-video bg-black">
          {videoInfo.type === 'direct' ? (
            <video
              controls
              autoPlay
              className="w-full h-full"
              src={videoInfo.embedUrl}
            >
              <source src={videoInfo.embedUrl} type="video/mp4" />
              Je browser ondersteunt geen video playback.
            </video>
          ) : (
            <iframe
              src={videoInfo.embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={exerciseName}
            />
          )}
        </div>

        <div className="p-6 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="h-4 w-4" />
            <span>Bekijk de correcte uitvoering van deze oefening</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
