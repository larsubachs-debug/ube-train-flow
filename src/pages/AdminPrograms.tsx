import { useState } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/usePrograms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminPrograms = () => {
  const { toast } = useToast();
  const { data: programs = [], refetch } = usePrograms();
  const [isCreating, setIsCreating] = useState(false);
  const [newProgram, setNewProgram] = useState({
    id: "",
    name: "",
    description: "",
    icon: "Dumbbell",
  });

  const handleCreate = async () => {
    if (!newProgram.id || !newProgram.name || !newProgram.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("programs").insert([
      {
        id: newProgram.id,
        name: newProgram.name,
        description: newProgram.description,
        icon: newProgram.icon,
      },
    ]);

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
      description: "Program created successfully",
    });

    setIsCreating(false);
    setNewProgram({ id: "", name: "", description: "", icon: "Dumbbell" });
    refetch();
  };

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Programs</h1>
            <p className="text-muted-foreground">Create and manage training programs</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Program</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Program ID</label>
                  <Input
                    placeholder="e.g., strength-muscle"
                    value={newProgram.id}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, id: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="e.g., Strength & Muscle"
                    value={newProgram.name}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Program description..."
                    value={newProgram.description}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Input
                    placeholder="Lucide icon name (e.g., Dumbbell)"
                    value={newProgram.icon}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, icon: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {programs.map((program) => (
            <Card key={program.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{program.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {program.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {program.weeks.length} weeks • ID: {program.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
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
    </div>
  );
};

export default AdminPrograms;