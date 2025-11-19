import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AdminCheckinAssignmentProps {
  questions: any[];
}

export const AdminCheckinAssignment = ({ questions }: AdminCheckinAssignmentProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['members-for-checkin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, user_id')
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch assigned questions for selected member
  const { data: assignedQuestions = [] } = useQuery({
    queryKey: ['member-checkin-questions', selectedMember],
    queryFn: async () => {
      if (!selectedMember) return [];
      
      const { data, error } = await supabase
        .from('member_checkin_questions')
        .select('question_id')
        .eq('member_id', selectedMember)
        .eq('is_active', true);
      
      if (error) throw error;
      return data?.map(q => q.question_id) || [];
    },
    enabled: !!selectedMember
  });

  // Update selected questions when assigned questions load
  useState(() => {
    if (assignedQuestions.length > 0) {
      setSelectedQuestions(assignedQuestions);
    }
  });

  const handleAssign = async () => {
    if (!selectedMember) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een member",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);

    // First, deactivate all current assignments
    await supabase
      .from('member_checkin_questions')
      .update({ is_active: false })
      .eq('member_id', selectedMember);

    // Then, insert/update new assignments
    const assignments = selectedQuestions.map((questionId, index) => ({
      member_id: selectedMember,
      question_id: questionId,
      display_order: index,
      is_active: true
    }));

    const { error } = await supabase
      .from('member_checkin_questions')
      .upsert(assignments, {
        onConflict: 'member_id,question_id'
      });

    setIsAssigning(false);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon vragen niet toewijzen",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Succesvol",
      description: "Vragen zijn toegewezen aan de member"
    });

    queryClient.invalidateQueries({ queryKey: ['member-checkin-questions'] });
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Vragen Toewijzen aan Member
        </h2>

        <div className="space-y-4">
          <div>
            <Label>Selecteer Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een member..." />
              </SelectTrigger>
              <SelectContent>
                {loadingMembers ? (
                  <div className="p-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : (
                  members.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name || 'Naamloos'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedMember && (
            <>
              <div>
                <Label className="mb-3 block">Selecteer Vragen</Label>
                <div className="space-y-3">
                  {questions.map((question: any) => (
                    <div key={question.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedQuestions.includes(question.id)}
                        onCheckedChange={() => toggleQuestion(question.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{question.question_text}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {question.question_type === 'scale' ? 'Schaal (1-10)' : 'Tekst'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleAssign} disabled={isAssigning || selectedQuestions.length === 0} className="w-full">
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Toewijzen...
                  </>
                ) : (
                  `${selectedQuestions.length} vragen toewijzen`
                )}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
