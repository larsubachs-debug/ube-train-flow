import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/gym-hero.jpg";

const Programs = () => {
  const { data: programs = [], isLoading } = usePrograms();
  const [programImages, setProgramImages] = useState<Record<string, string>>({});
  
  // Fallback to static programs if database is empty
  const displayPrograms = programs.length > 0 ? programs : staticPrograms;

  useEffect(() => {
    const loadProgramImages = async () => {
      const images: Record<string, string> = {};
      
      for (const program of displayPrograms) {
        try {
          const { data: programMedia } = await supabase
            .from('program_media')
            .select('media_id, media(file_path)')
            .eq('program_id', program.id)
            .eq('media_type', 'tile')
            .single();

          if (programMedia?.media) {
            const mediaData = programMedia.media as any;
            images[program.id] = mediaData.file_path;
          }
        } catch (error) {
          console.error(`Error loading image for program ${program.id}:`, error);
        }
      }
      
      setProgramImages(images);
    };

    if (displayPrograms.length > 0) {
      loadProgramImages();
    }
  }, [displayPrograms.length]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Choose a Program</h1>
          <p className="text-muted-foreground">
            You can change at anytime
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading programs...</div>
        ) : (
          <div className="space-y-6">
            {displayPrograms.map((program) => (
              <div key={program.id} className="space-y-4">
                <Card className="overflow-hidden border-0 shadow-xl">
                  {/* Hero Image with Overlay */}
                  <div className="relative h-[400px] overflow-hidden">
                    <img 
                      src={programImages[program.id] || heroImage}
                      alt={program.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                    
                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h2 className="text-4xl font-bold mb-3 uppercase tracking-wide">
                        {program.name}
                      </h2>
                      <p className="text-white/90 mb-4 leading-relaxed">
                        {program.description}
                      </p>
                      
                      {/* Badges */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm px-3 py-1">
                          <span className="mr-1">⚡</span> Hybrid
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm px-3 py-1">
                          <span className="mr-1">🏃</span> Functional Fitness
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Action Button */}
                <Link to={`/program/${program.id}`} className="block">
                  <Button 
                    size="lg" 
                    className="w-full bg-black hover:bg-black/90 text-white h-14 text-lg font-semibold rounded-full"
                  >
                    Start training
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Programs;
