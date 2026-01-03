import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Search, LayoutGrid, Calendar, Dumbbell, Layers, Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/usePrograms";
import { ProgramBuilder } from "@/components/admin/ProgramBuilder";
import { AIProgramGenerator } from "@/components/admin/AIProgramGenerator";
import { AddProgramDialog } from "@/components/admin/AddProgramDialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BottomNav from "@/components/BottomNav";
import { ExerciseLibrary } from "@/components/admin/ExerciseLibrary";

const AdminPrograms = () => {
  const { toast } = useToast();
  const { data: programs = [], refetch } = usePrograms();
  const [activeTab, setActiveTab] = useState("programs");
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aiGeneratedProgram, setAiGeneratedProgram] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProgram, setEditingProgram] = useState<any>(null);

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

    toast({ description: "Programma succesvol verwijderd" });
    refetch();
  };

  const handleAddProgram = (data: { name: string; description: string; type: "calendar" | "fixed" }) => {
    setShowAddDialog(false);
    setEditingProgram({
      name: data.name,
      goal: data.description,
      type: data.type,
      sessionsPerWeek: 3,
      weeks: [{
        id: `week-${Date.now()}`,
        name: "Week 1",
        weekNumber: 1,
        days: []
      }]
    });
    setIsCreating(true);
  };

  const filteredPrograms = programs.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isGeneratingWithAI) {
    return (
      <div className="min-h-screen bg-background pb-24">
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
        <BottomNav />
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto px-4 py-8">
          <ProgramBuilder
            initialData={aiGeneratedProgram || editingProgram}
            onComplete={() => {
              setIsCreating(false);
              setAiGeneratedProgram(null);
              setEditingProgram(null);
              refetch();
            }}
            onCancel={() => {
              setIsCreating(false);
              setAiGeneratedProgram(null);
              setEditingProgram(null);
            }}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Training</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="h-12 bg-transparent p-0 gap-1">
                  <TabsTrigger 
                    value="programs" 
                    className="data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Programma&apos;s
                  </TabsTrigger>
                  <TabsTrigger 
                    value="workouts"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Workouts
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sections"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Secties
                  </TabsTrigger>
                  <TabsTrigger 
                    value="exercises"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
                  >
                    <Library className="h-4 w-4 mr-2" />
                    Oefeningen
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  {activeTab === "programs" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsGeneratingWithAI(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setShowAddDialog(true)}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Programma
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Programs Tab */}
          <TabsContent value="programs" className="mt-0">
            <div className="rounded-lg border border-border bg-card">
              {/* Table Header */}
              <div className="border-b border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50%]">
                        <div className="flex items-center gap-2">
                          Programma
                          <div className="relative ml-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Zoeken..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 h-8 w-48 bg-muted/50"
                            />
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[30%]">Type</TableHead>
                      <TableHead className="w-[15%] text-right">Tags</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>

              {/* Table Body */}
              <Table>
                <TableBody>
                  {filteredPrograms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <Dumbbell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">Nog geen programma&apos;s</p>
                        <Button 
                          size="sm" 
                          className="mt-4"
                          onClick={() => setShowAddDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Eerste programma maken
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrograms.map((program) => (
                      <TableRow key={program.id} className="group">
                        <TableCell className="font-medium">
                          {program.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            <LayoutGrid className="h-3 w-3 mr-1.5" />
                            Vast
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-muted-foreground text-sm">—</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingProgram(program);
                                setIsCreating(true);
                              }}>
                                Bewerken
                              </DropdownMenuItem>
                              <DropdownMenuItem>Dupliceren</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(program.id)}
                              >
                                Verwijderen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="mt-0">
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-medium mb-1">Workouts beheren</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Standalone workouts die je kunt hergebruiken in programma&apos;s
              </p>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Workout toevoegen
              </Button>
            </div>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="mt-0">
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-medium mb-1">Secties beheren</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Herbruikbare workout secties zoals warm-up of cooldown
              </p>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Sectie toevoegen
              </Button>
            </div>
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="mt-0">
            <ExerciseLibrary />
          </TabsContent>
        </Tabs>
      </div>

      <AddProgramDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddProgram}
      />

      <BottomNav />
    </div>
  );
};

export default AdminPrograms;
