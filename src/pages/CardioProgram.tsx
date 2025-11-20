import { Button } from "@/components/ui/button";
import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProgramProgressOverview } from "@/components/programs/ProgramProgressOverview";

const CardioProgram = () => {
  const { data: programs = [], isLoading } = usePrograms();
  const { hasRole } = useAuth();
  const [programImages, setProgramImages] = useState<Record<string, string>>({});
  
  const isCoachOrAdmin = hasRole("coach") || hasRole("admin");
  
  // Fallback to static programs if database is empty, filter for cardio programs
  const displayPrograms = programs.length > 0 
    ? programs.filter(p => 
        p.name.toLowerCase().includes('cardio') || 
        p.name.toLowerCase().includes('hyrox') || 
        p.name.toLowerCase().includes('run') ||
        p.name.toLowerCase().includes('conditioning') ||
        p.name.toLowerCase().includes('engine')
      )
    : staticPrograms.filter(p => 
        p.name.toLowerCase().includes('cardio') || 
        p.name.toLowerCase().includes('hyrox') || 
        p.name.toLowerCase().includes('run') ||
        p.name.toLowerCase().includes('conditioning') ||
        p.name.toLowerCase().includes('engine')
      );

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Loading programs...</p>
      </div>
    );
  }

  if (displayPrograms.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">No cardio programs available</p>
      </div>
    );
  }

  // Show first cardio program with progress overview
  const program = displayPrograms[0];
  const programImage = programImages[program.id];

  return (
    <div>
      <ProgramProgressOverview program={program} programImage={programImage} />
      
      {/* Action Buttons */}
      <div className="px-6 space-y-2 pb-6">
        <Link to={`/programs/${program.id}/workout/${program.weeks[0]?.workouts[0]?.id}`}>
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-lg">
            Start Training
          </Button>
        </Link>
        <Link to={`/program/${program.id}`}>
          <Button variant="outline" className="w-full py-6 text-lg">
            View Full Program
          </Button>
        </Link>
        {isCoachOrAdmin && (
          <Link to="/admin/programs">
            <Button variant="ghost" className="w-full">
              Edit Program
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default CardioProgram;
