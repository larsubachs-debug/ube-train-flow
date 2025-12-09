import { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import ubyAvatar from '@/assets/uby-avatar.jpg';

export const UbyFeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('beta_feedback').insert({
        user_id: user.id,
        message: message.trim(),
        page_url: window.location.pathname,
      });

      if (error) throw error;

      toast.success(t('feedback.success', 'Bedankt voor je feedback!'));
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(t('feedback.error', 'Er ging iets mis. Probeer het opnieuw.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Open feedback"
      >
        <div className="relative">
          <img
            src={ubyAvatar}
            alt="Uby"
            className="w-14 h-14 rounded-full border-2 border-primary shadow-lg object-cover"
          />
          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
            <MessageCircle className="w-3 h-3" />
          </div>
        </div>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl transition-all duration-300 ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <img
            src={ubyAvatar}
            alt="Uby"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Uby</h3>
            <p className="text-xs text-muted-foreground">
              {t('feedback.subtitle', 'Beta Feedback')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Message Bubble */}
        <div className="p-4">
          <div className="bg-muted rounded-2xl rounded-tl-sm p-3 mb-4">
            <p className="text-sm text-foreground">
              {t(
                'feedback.greeting',
                'Hey! 👋 Heb je iets gevonden dat niet werkt of beter kan? Laat het me weten!'
              )}
            </p>
          </div>

          {/* Input */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('feedback.placeholder', 'Typ je feedback hier...')}
            className="min-h-[80px] resize-none mb-3"
            disabled={isSubmitting}
          />

          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {t('feedback.send', 'Verstuur')}
          </Button>
        </div>
      </div>
    </>
  );
};
