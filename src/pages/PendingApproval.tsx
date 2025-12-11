import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Mail, RefreshCw } from "lucide-react";
import ubeLogo from "@/assets/ube-logo.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PendingApproval = () => {
  const { signOut, user, approvalStatus, loading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [forceShowContent, setForceShowContent] = useState(false);

  // Force show content after 3 seconds to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceShowContent(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Auto-check approval status and redirect if approved
  useEffect(() => {
    if (!user) return;

    const checkAndRedirect = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.approval_status === "approved") {
        // Force reload to update auth context
        window.location.href = "/";
      }
    };

    // Check immediately and then every 3 seconds for the first minute
    checkAndRedirect();
    
    const interval = setInterval(() => {
      setCheckAttempts(prev => {
        if (prev < 20) { // Check for about 60 seconds
          checkAndRedirect();
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  // Redirect if already approved
  useEffect(() => {
    if (approvalStatus === "approved") {
      navigate("/", { replace: true });
    }
  }, [approvalStatus, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const handleRefresh = async () => {
    setIsChecking(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profile?.approval_status === "approved") {
        window.location.href = "/";
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading only briefly
  if (loading && !forceShowContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <img src={ubeLogo} alt="U.be" className="h-16" />
          </div>
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-accent animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Even geduld...
            </h1>
            <p className="text-muted-foreground">
              We controleren je account status
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <img src={ubeLogo} alt="U.be" className="h-16" />
        </div>

        {(approvalStatus === "pending" || approvalStatus === null) && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Account in behandeling
              </h1>
              <p className="text-muted-foreground">
                Je account wordt beoordeeld door een coach. Je krijgt toegang zodra je bent goedgekeurd.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <Mail className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Email Notificatie</p>
                  <p className="text-sm text-muted-foreground">
                    We sturen je een email naar <strong>{user?.email}</strong> zodra je account is goedgekeurd.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isChecking}
              className="w-full mb-3"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Status controleren
            </Button>
          </>
        )}

        {approvalStatus === "rejected" && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Account niet goedgekeurd
              </h1>
              <p className="text-muted-foreground mb-4">
                Helaas is je account op dit moment niet goedgekeurd. Neem contact op voor meer informatie.
              </p>
            </div>
          </>
        )}

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full"
        >
          Uitloggen
        </Button>
      </Card>
    </div>
  );
};

export default PendingApproval;