import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ListTodo, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { TaskAssignment } from "@/components/tasks/TaskAssignment";

const iconOptions = [
  'CheckSquare', 'Camera', 'Salad', 'Droplet', 'Footprints', 
  'Moon', 'Wine', 'Smartphone', 'Heart', 'Apple', 'Dumbbell',
  'Target', 'Coffee', 'BookOpen', 'Clock'
];

export default function AdminTasks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "general",
    default_duration_days: 7,
    icon: "CheckSquare"
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks_library')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleCreateTask = async () => {
    if (!newTask.title) {
      toast({
        title: "Fout",
        description: "Titel is verplicht",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    const { error } = await supabase
      .from('tasks_library')
      .insert(newTask);

    setIsCreating(false);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon taak niet aanmaken",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Succesvol",
      description: "Taak is toegevoegd aan de bibliotheek"
    });

    setNewTask({
      title: "",
      description: "",
      category: "general",
      default_duration_days: 7,
      icon: "CheckSquare"
    });

    queryClient.invalidateQueries({ queryKey: ['tasks-library'] });
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze taak wilt verwijderen?')) return;

    const { error } = await supabase
      .from('tasks_library')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon taak niet verwijderen",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Succesvol",
      description: "Taak is verwijderd"
    });

    queryClient.invalidateQueries({ queryKey: ['tasks-library'] });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'nutrition': return 'Voeding';
      case 'training': return 'Training';
      case 'lifestyle': return 'Leefstijl';
      default: return 'Algemeen';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'training': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'lifestyle': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.CheckSquare;
    return Icon;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Taken Beheer</h1>
          <p className="text-muted-foreground">
            Beheer taken en wijs ze toe aan members
          </p>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Takenbibliotheek</TabsTrigger>
            <TabsTrigger value="assign">Toewijzen aan Members</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            {/* Create New Task */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nieuwe Taak Toevoegen
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Titel</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Bijvoorbeeld: Eet 400 gram groente"
                  />
                </div>

                <div>
                  <Label>Beschrijving</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Consumeer minimaal 400 gram groente vandaag"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categorie</Label>
                    <Select
                      value={newTask.category}
                      onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Algemeen</SelectItem>
                        <SelectItem value="nutrition">Voeding</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="lifestyle">Leefstijl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Standaard duur (dagen)</Label>
                    <Input
                      type="number"
                      value={newTask.default_duration_days}
                      onChange={(e) => setNewTask({ ...newTask, default_duration_days: parseInt(e.target.value) })}
                      min={1}
                    />
                  </div>
                </div>

                <div>
                  <Label>Icoon</Label>
                  <Select
                    value={newTask.icon}
                    onValueChange={(value) => setNewTask({ ...newTask, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((iconName) => {
                        const Icon = getIcon(iconName);
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {iconName}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateTask} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Toevoegen...
                    </>
                  ) : (
                    'Taak Toevoegen'
                  )}
                </Button>
              </div>
            </Card>

            {/* Tasks List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Alle Taken
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tasks.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  Nog geen taken toegevoegd
                </Card>
              ) : (
                tasks.map((task: any) => {
                  const Icon = getIcon(task.icon);
                  return (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getCategoryColor(task.category)}>
                                {getCategoryLabel(task.category)}
                              </Badge>
                              <Badge variant="outline">
                                {task.default_duration_days} dagen
                              </Badge>
                            </div>
                            <h3 className="font-semibold mb-1">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="assign">
            <TaskAssignment tasks={tasks} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
