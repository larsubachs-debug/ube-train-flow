import { useState } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/usePrograms";
import { ProgramBuilder } from "@/components/admin/ProgramBuilder";
import { ProgramImageEditor } from "@/components/admin/ProgramImageEditor";

const AdminPrograms = () => {
  const { toast } = useToast();
  const { data: programs = [], refetch } = usePrograms();
  const [isCreating, setIsCreating] = useState(false);
  const [editingImageProgram, setEditingImageProgram] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    const { error } = await supabase.from("programs").delete().eq("id", programId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Program deleted successfully",
    });

    refetch();
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setIsCreating(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Programs
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Create New Program</h1>
            <p className="text-muted-foreground">
              Build your program step by step with all details
            </p>
          </div>

          <ProgramBuilder
            onComplete={() => {
              setIsCreating(false);
              refetch();
            }}
            onCancel={() => setIsCreating(false)}
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
            <h1 className="text-3xl font-bold text-foreground">Manage Programs</h1>
            <p className="text-muted-foreground">Create and manage training programs</p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        </div>

        <div className="grid gap-4">
          {programs.map((program) => (
            <Card key={program.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{program.name}</h3>
                    {!(program as any).is_public && (
                      <span className="text-xs px-2 py-1 bg-muted rounded">Privé</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {program.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {program.weeks.length} weeks • ID: {program.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingImageProgram({ id: program.id, name: program.name })}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(program.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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