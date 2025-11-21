import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Image, Sparkles, Dumbbell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/usePrograms";
import { ProgramBuilder } from "@/components/admin/ProgramBuilder";
import { ProgramImageEditor } from "@/components/admin/ProgramImageEditor";
import { AIProgramGenerator } from "@/components/admin/AIProgramGenerator";
import { Badge } from "@/components/ui/badge";

const AdminPrograms = () => {
  const { toast } = useToast();
  const { data: programs = [], refetch } = usePrograms();
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [aiGeneratedProgram, setAiGeneratedProgram] = useState<any>(null);
  const [editingImageProgram, setEditingImageProgram] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [programImages, setProgramImages] = useState<Record<string, string>>({});

  // Fetch program images
  useEffect(() => {
    const fetchProgramImages = async () => {
      const imagePromises = programs.map(async (program) => {
        const { data } = await supabase
          .from('program_media')
          .select('media_id, media:media_id(file_path, bucket_name)')
          .eq('program_id', program.id)
          .eq('media_type', 'tile')
          .single();

        if (data?.media) {
          const { data: { publicUrl } } = supabase.storage
            .from((data.media as any).bucket_name)
            .getPublicUrl((data.media as any).file_path);
          return { id: program.id, url: publicUrl };
        }
        return { id: program.id, url: null };
      });

      const images = await Promise.all(imagePromises);
      const imageMap = images.reduce((acc, { id, url }) => {
        if (url) acc[id] = url;
        return acc;
      }, {} as Record<string, string>);
      
      setProgramImages(imageMap);
    };

    if (programs.length > 0) {
      fetchProgramImages();
    }
  }, [programs]);

  const handleDelete = async (programId: string) => {
    if (!confirm("Weet je zeker dat je dit programma wilt verwijderen?")) return;

    const { error } = await supabase.from("programs").delete().eq("id", programId);

    if (error) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      description: "Programma succesvol verwijderd",
    });

    refetch();
  };

  const getTotalExercises = (program: any) => {
    return program.weeks.reduce((total: number, week: any) => {
      return total + week.workouts.reduce((weekTotal: number, workout: any) => {
        return weekTotal + (workout.warmUp?.length || 0) + 
               (workout.mainLifts?.length || 0) + 
               (workout.accessories?.length || 0) + 
               (workout.conditioning?.length || 0);
      }, 0);
    }, 0);
  };

  const getTotalWorkouts = (program: any) => {
    return program.weeks.reduce((total: number, week: any) => {
      return total + week.workouts.length;
    }, 0);
  };

  if (isGeneratingWithAI) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8">
          <AIProgramGenerator
            onProgramGenerated={(programData) => {
              setAiGeneratedProgram(programData);
              setIsGeneratingWithAI(false);
              setIsCreating(true);
            }}
            onCancel={() => setIsGeneratingWithAI(false)}
          />
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setAiGeneratedProgram(null);
              }}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Programs
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              {aiGeneratedProgram ? "Review AI Generated Program" : "Create New Program"}
            </h1>
            <p className="text-muted-foreground">
              {aiGeneratedProgram
                ? "Review en pas het AI gegenereerde programma aan indien nodig"
                : "Build your program step by step with all details"}
            </p>
          </div>

          <ProgramBuilder
            initialData={aiGeneratedProgram}
            onComplete={() => {
              setIsCreating(false);
              setAiGeneratedProgram(null);
              refetch();
            }}
            onCancel={() => {
              setIsCreating(false);
              setAiGeneratedProgram(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Programma's Beheren</h1>
            <p className="text-muted-foreground">Maak en beheer training programma's</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsGeneratingWithAI(true)} variant="secondary">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Programma
            </Button>
            <Button onClick={() => setIsCreating(true)} className="bg-ube-blue hover:bg-ube-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Handmatig
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Program Image */}
              <div className="relative h-48 bg-gradient-to-br from-ube-blue/20 to-ube-orange/20">
                {programImages[program.id] ? (
                  <img
                    src={programImages[program.id]}
                    alt={program.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Dumbbell className="h-16 w-16 text-ube-blue/40" />
                  </div>
                )}
                {!(program as any).is_public && (
                  <Badge className="absolute top-3 right-3 bg-background/90">
                    Privé
                  </Badge>
                )}
              </div>

              {/* Program Info */}
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2 line-clamp-1">{program.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {program.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium">{program.weeks.length}</p>
                    <p className="text-xs text-muted-foreground">Weken</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Dumbbell className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium">{getTotalWorkouts(program)}</p>
                    <p className="text-xs text-muted-foreground">Workouts</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <Edit className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium">{getTotalExercises(program)}</p>
                    <p className="text-xs text-muted-foreground">Oefeningen</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingImageProgram({ id: program.id, name: program.name })}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Afbeelding
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(program.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {programs.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Dumbbell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Nog geen programma's</p>
              <p className="text-sm text-muted-foreground mb-6">
                Begin met het maken van je eerste training programma
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setIsGeneratingWithAI(true)} variant="secondary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Programma
                </Button>
                <Button onClick={() => setIsCreating(true)} className="bg-ube-blue hover:bg-ube-blue/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Handmatig
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingImageProgram && (
        <ProgramImageEditor
          programId={editingImageProgram.id}
          programName={editingImageProgram.name}
          open={!!editingImageProgram}
          onOpenChange={(open) => !open && setEditingImageProgram(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

export default AdminPrograms;