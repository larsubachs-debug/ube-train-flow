import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProgramProgressOverview } from "@/components/programs/ProgramProgressOverview";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { ProgramDetailSkeleton } from "@/components/skeletons/ProgramSkeleton";

const Programs = () => {
  const { t } = useTranslation();
  const { data: programs = [], isLoading } = usePrograms();
  const { hasRole } = useAuth();
  const [programImages, setProgramImages] = useState<Record<string, string>>({});
  
  const isCoachOrAdmin = hasRole("coach") || hasRole("admin");
  
  const displayPrograms = programs;

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
            .maybeSingle();

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
    return <ProgramDetailSkeleton />;
  }

  if (displayPrograms.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">{t('programs.noPrograms')}</p>
      </div>
    );
  }

  // Show each program with the new layout
  return (
    <div className="space-y-8">
      {displayPrograms.map((program) => (
        <div key={program.id} className="relative">
          <ProgramProgressOverview 
            program={program} 
            programImage={programImages[program.id]} 
          />
          
          {/* Additional Action Buttons */}
          <div className="px-6 space-y-2 pb-6">
            <Link to={`/program/${program.id}`}>
              <Button variant="outline" className="w-full py-6 text-lg">
                {t('programs.viewFullProgram')}
              </Button>
            </Link>
            {isCoachOrAdmin && (
              <Link to="/admin/programs">
                <Button variant="ghost" className="w-full">
                  {t('programs.editProgram')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Programs;
