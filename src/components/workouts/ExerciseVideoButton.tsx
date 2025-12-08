import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Video, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseVideoButtonProps {
  exerciseName: string;
  videoUrl?: string;
  onVideoClick: (exerciseName: string, videoUrl: string) => void;
  variant?: "prominent" | "icon";
}

export const ExerciseVideoButton = ({
  exerciseName,
  videoUrl,
  onVideoClick,
  variant = "prominent",
}: ExerciseVideoButtonProps) => {
  const [libraryVideoUrl, setLibraryVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Try to fetch video from exercise library if not provided
  useEffect(() => {
    const fetchVideoFromLibrary = async () => {
      if (videoUrl) {
        setLibraryVideoUrl(videoUrl);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("exercise_library")
          .select("video_url")
          .ilike("name", `%${exerciseName}%`)
          .limit(1)
          .maybeSingle();

        if (data?.video_url) {
          setLibraryVideoUrl(data.video_url);
        }
      } catch (error) {
        console.error("Error fetching exercise video:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoFromLibrary();
  }, [exerciseName, videoUrl]);

  const effectiveVideoUrl = videoUrl || libraryVideoUrl;

  if (!effectiveVideoUrl && !isLoading) {
    return null;
  }

  if (variant === "icon") {
    return (
      <button
        onClick={() => effectiveVideoUrl && onVideoClick(exerciseName, effectiveVideoUrl)}
        className="p-2 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
        title="Bekijk instructievideo"
        disabled={isLoading || !effectiveVideoUrl}
      >
        <Video className="h-5 w-5" />
      </button>
    );
  }

  return (
    <Button
      onClick={() => effectiveVideoUrl && onVideoClick(exerciseName, effectiveVideoUrl)}
      variant="outline"
      size="sm"
      className="gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
      disabled={isLoading || !effectiveVideoUrl}
    >
      <Play className="h-4 w-4" />
      <span>Bekijk uitvoering</span>
    </Button>
  );
};
