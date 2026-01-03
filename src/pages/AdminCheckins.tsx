import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AdminCheckinAssignment } from "@/components/checkin/AdminCheckinAssignment";
import { useTranslation } from "react-i18next";
import BottomNav from "@/components/BottomNav";

export default function AdminCheckins() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "text",
    is_default: false
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['checkin-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_questions')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleCreateQuestion = async () => {
    if (!newQuestion.question_text) {
      toast({
        title: t('errors.somethingWentWrong'),
        description: t('coach.questionRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    const { error } = await supabase
      .from('checkin_questions')
      .insert({
        ...newQuestion,
        display_order: questions.length
      });

    setIsCreating(false);

    if (error) {
      toast({
        title: t('errors.savingFailed'),
        description: t('errors.tryAgain'),
        variant: "destructive"
      });
      return;
    }

    toast({
      title: t('common.success'),
      description: t('coach.questionAdded')
    });

    setNewQuestion({
      question_text: "",
      question_type: "text",
      is_default: false
    });

    queryClient.invalidateQueries({ queryKey: ['checkin-questions'] });
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm(t('coach.confirmDeleteQuestion'))) return;

    const { error } = await supabase
      .from('checkin_questions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: t('errors.somethingWentWrong'),
        description: t('errors.tryAgain'),
        variant: "destructive"
      });
      return;
    }

    toast({
      title: t('common.success'),
      description: t('coach.questionDeleted')
    });

    queryClient.invalidateQueries({ queryKey: ['checkin-questions'] });
  };

  const handleToggleDefault = async (id: string, currentDefault: boolean) => {
    const { error } = await supabase
      .from('checkin_questions')
      .update({ is_default: !currentDefault })
      .eq('id', id);

    if (error) {
      toast({
        title: t('errors.somethingWentWrong'),
        description: t('errors.tryAgain'),
        variant: "destructive"
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['checkin-questions'] });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Coach-specific header with clear context */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('coach.checkinsTitle')}</h1>
          <p className="text-muted-foreground">
            {t('coach.checkinsDescription')}
          </p>
        </div>

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">{t('coach.questionsLibrary')}</TabsTrigger>
            <TabsTrigger value="assign">{t('coach.assignToMembers')}</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            {/* Create New Question */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nieuwe Vraag Toevoegen
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Vraag</Label>
                  <Textarea
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                    placeholder="Bijvoorbeeld: Hoe voel je je vandaag?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={newQuestion.question_type}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, question_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Tekst</SelectItem>
                      <SelectItem value="scale">Schaal (1-10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={newQuestion.is_default}
                    onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, is_default: checked })}
                  />
                  <Label>Standaard vraag (voor alle nieuwe members)</Label>
                </div>

                <Button onClick={handleCreateQuestion} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Toevoegen...
                    </>
                  ) : (
                    'Vraag Toevoegen'
                  )}
                </Button>
              </div>
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Alle Vragen</h2>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : questions.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  Nog geen vragen toegevoegd
                </Card>
              ) : (
                questions.map((question: any) => (
                  <Card key={question.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={question.question_type === 'scale' ? 'default' : 'secondary'}>
                            {question.question_type === 'scale' ? 'Schaal' : 'Tekst'}
                          </Badge>
                          {question.is_default && (
                            <Badge variant="outline">Standaard</Badge>
                          )}
                        </div>
                        <p className="text-foreground font-medium">{question.question_text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.is_default}
                          onCheckedChange={() => handleToggleDefault(question.id, question.is_default)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="assign">
            <AdminCheckinAssignment questions={questions} />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}
