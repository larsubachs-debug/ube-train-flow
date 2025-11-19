import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options?: any;
  display_order: number;
}

interface DailyCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const DailyCheckinDialog = ({ open, onOpenChange, onComplete }: DailyCheckinDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadQuestions();
    }
  }, [open, user]);

  const loadQuestions = async () => {
    if (!user) return;

    setLoading(true);
    
    // Get user's profile id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    // Get assigned questions for this member
    const { data: assignedQuestions } = await supabase
      .from('member_checkin_questions')
      .select(`
        question_id,
        display_order,
        checkin_questions (
          id,
          question_text,
          question_type,
          options
        )
      `)
      .eq('member_id', profile.id)
      .eq('is_active', true)
      .order('display_order');

    // If no assigned questions, get default questions
    let questionsToShow: Question[] = [];
    
    if (assignedQuestions && assignedQuestions.length > 0) {
      questionsToShow = assignedQuestions
        .map((aq: any) => ({
          id: aq.checkin_questions.id,
          question_text: aq.checkin_questions.question_text,
          question_type: aq.checkin_questions.question_type,
          options: aq.checkin_questions.options,
          display_order: aq.display_order
        }));
    } else {
      // Get default questions
      const { data: defaultQuestions } = await supabase
        .from('checkin_questions')
        .select('*')
        .eq('is_default', true)
        .order('display_order');

      if (defaultQuestions) {
        questionsToShow = defaultQuestions;
      }
    }

    setQuestions(questionsToShow);
    
    // Initialize responses
    const initialResponses: Record<string, any> = {};
    questionsToShow.forEach(q => {
      if (q.question_type === 'scale') {
        initialResponses[q.id] = 5;
      } else {
        initialResponses[q.id] = '';
      }
    });
    setResponses(initialResponses);
    
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('daily_checkins')
      .insert({
        user_id: user.id,
        checkin_date: today,
        responses: responses
      });

    setSubmitting(false);

    if (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het opslaan van je check-in.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Check-in voltooid!",
      description: "Je dagelijkse check-in is opgeslagen.",
    });

    onComplete();
  };

  const renderQuestion = (question: Question) => {
    if (question.question_type === 'scale') {
      return (
        <div key={question.id} className="space-y-4">
          <div>
            <Label className="text-base font-medium">{question.question_text}</Label>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm text-muted-foreground">1</span>
              <Slider
                value={[responses[question.id] || 5]}
                onValueChange={(value) => setResponses({ ...responses, [question.id]: value[0] })}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">10</span>
              <span className="text-lg font-bold text-primary min-w-[2rem] text-center">
                {responses[question.id] || 5}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={question.id} className="space-y-2">
        <Label className="text-base font-medium">{question.question_text}</Label>
        <Textarea
          value={responses[question.id] || ''}
          onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
          placeholder="Jouw antwoord..."
          rows={3}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Dagelijkse Check-in</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {questions.map(renderQuestion)}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={submitting}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Opslaan...
                  </>
                ) : (
                  'Check-in Voltooien'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
