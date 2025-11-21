import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { programs as staticPrograms } from "@/data/programs";
import { usePrograms } from "@/hooks/usePrograms";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";
import { ProgramProgressOverview } from "@/components/programs/ProgramProgressOverview";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProgramDetail = () => {
  const { programId } = useParams();
  const { data: programs = [], isLoading } = usePrograms();
  const { hasRole } = useAuth();
  const [programImage, setProgramImage] = useState<string>("");
  
  const isCoachOrAdmin = hasRole("coach") || hasRole("admin");
  
  // Fallback to static programs if database is empty
  const displayPrograms = programs.length > 0 ? programs : staticPrograms;
  const program = displayPrograms.find((p) => p.id === programId);

  useEffect(() => {
    const loadProgramImage = async () => {
      if (!program) return;
      
      try {
        const { data: programMedia } = await supabase
          .from('program_media')
          .select('media_id, media(file_path)')
          .eq('program_id', program.id)
          .eq('media_type', 'tile')
          .maybeSingle();

        if (programMedia?.media) {
          const mediaData = programMedia.media as any;
          setProgramImage(mediaData.file_path);
        }
      } catch (error) {
        console.error(`Error loading image for program ${program.id}:`, error);
      }
    };

    loadProgramImage();
  }, [program?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Loading program...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Program not found</p>
      </div>
    );
  }

  if (!program.weeks || program.weeks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">No weeks found for this program</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Back Button */}
      <Link to="/programs" className="fixed top-4 left-4 z-50">
        <Button variant="ghost" size="sm" className="gap-2 bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>

      {/* Program Overview */}
      <ProgramProgressOverview program={program} programImage={programImage} />
      
      {/* Additional Action Buttons */}
      <div className="px-6 space-y-2 pb-6">
        <Link to={`/program/${program.id}`}>
          <Button variant="outline" className="w-full py-6 text-lg">
            Bekijk Volledig Programma
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

export default ProgramDetail;
